import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
type TrainingType = 'qcm' | 'vrai_faux' | 'cas_pratique' | 'simulation_oral' | 'question_ouverte' | 'plan_revision';
type UserLevel = 'debutant' | 'intermediaire' | 'avance';
type StudyDomain = 'droit_administratif' | 'droit_penal' | 'management' | 'redaction_administrative';

interface TrainingRequest {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  sessionId?: string;
}

// Configuration des templates optimisés
const TRAINING_TEMPLATES = {
  qcm: {
    systemPrompt: `Tu es un expert PrepaCDS. Génère EXACTEMENT 5 questions QCM de qualité professionnelle.
Format JSON STRICT requis:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question claire et précise",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication détaillée de la bonne réponse",
      "difficulty": "moyen"
    }
  ],
  "metadata": {
    "estimatedTime": 10,
    "passingScore": 70
  }
}`,
    maxTokens: 2000
  },
  vrai_faux: {
    systemPrompt: `Tu es un expert PrepaCDS. Génère EXACTEMENT 5 affirmations Vrai/Faux.
Format JSON STRICT requis:
{
  "questions": [
    {
      "id": "tf1",
      "statement": "Affirmation claire et précise",
      "isCorrect": true,
      "explanation": "Explication détaillée",
      "domain": "domaine"
    }
  ]
}`,
    maxTokens: 1500
  },
  cas_pratique: {
    systemPrompt: `Tu es un expert PrepaCDS. Génère UN cas pratique complet.
Format JSON STRICT requis:
{
  "title": "Titre du cas",
  "context": "Contexte détaillé",
  "steps": [
    {
      "id": "step1",
      "title": "Titre de l'étape",
      "scenario": "Scénario détaillé",
      "question": "Question à traiter",
      "expectedPoints": ["Point 1", "Point 2", "Point 3"],
      "timeLimit": 15
    }
  ],
  "totalTime": 30
}`,
    maxTokens: 2500
  }
};

// Cache simple en mémoire avec TTL
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Queue pour gérer les appels concurrents
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

// Fonction pour traiter la queue
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }

  isProcessingQueue = true;
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const request = requestQueue.shift();
    if (request) {
      activeRequests++;
      request().finally(() => {
        activeRequests--;
        setTimeout(processQueue, 100); // Délai entre les requêtes
      });
    }
  }
  
  isProcessingQueue = false;
}

// Fonction pour ajouter une requête à la queue
function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

// Fonction pour gérer le cache
function getCachedContent(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

function setCachedContent(key: string, data: any, ttl: number = CACHE_TTL) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Fonction pour appeler l'Assistant PrepaCDS avec retry et backoff
async function callPrepaCDSAssistantWithRetry(
  prompt: string, 
  trainingType: TrainingType,
  level: UserLevel,
  domain: StudyDomain,
  retries: number = 3
): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const assistantId = Deno.env.get('PREPACDS_ASSISTANT_ID');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  if (!assistantId) {
    throw new Error('PrepaCDS Assistant ID not configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[PrepaCDS Assistant] Tentative ${attempt}/${retries}`);
      
      // 1. Créer un thread
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        throw new Error(`Failed to create thread: ${threadResponse.status}`);
      }

      const thread = await threadResponse.json();
      console.log(`[PrepaCDS Assistant] Thread créé: ${thread.id}`);

      // 2. Ajouter le message au thread
      const messageBody = `DEMANDE DE GÉNÉRATION D'ENTRAÎNEMENT PREPACDS

Type d'entraînement: ${trainingType}
Niveau: ${level}
Domaine: ${domain}

${prompt}

IMPORTANT: Réponds UNIQUEMENT avec le JSON demandé, sans texte supplémentaire.`;

      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: messageBody
        })
      });

      if (!messageResponse.ok) {
        throw new Error(`Failed to add message: ${messageResponse.status}`);
      }

      // 3. Lancer le run avec l'assistant PrepaCDS
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          instructions: `Tu es l'assistant PrepaCDS spécialisé dans la génération de contenu d'entraînement pour les concours administratifs et de police municipale. Génère du contenu de qualité professionnelle en respectant exactement le format JSON demandé.`
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to create run: ${runResponse.status}`);
      }

      const run = await runResponse.json();
      console.log(`[PrepaCDS Assistant] Run créé: ${run.id}`);

      // 4. Attendre que le run soit complété
      let runStatus = run.status;
      let maxWaitTime = 60000; // 60 secondes max
      let waitTime = 0;
      const pollInterval = 1000; // 1 seconde

      while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'cancelled' && waitTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waitTime += pollInterval;

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.status;
          console.log(`[PrepaCDS Assistant] Status: ${runStatus}`);
        }
      }

      if (runStatus !== 'completed') {
        throw new Error(`Run failed or timed out. Status: ${runStatus}`);
      }

      // 5. Récupérer les messages du thread
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${messagesResponse.status}`);
      }

      const messages = await messagesResponse.json();
      
      // Trouver la réponse de l'assistant
      const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
      
      if (!assistantMessage?.content?.[0]?.text?.value) {
        throw new Error('No response from PrepaCDS Assistant');
      }

      const responseText = assistantMessage.content[0].text.value;
      console.log(`[PrepaCDS Assistant] Réponse reçue`);

      return responseText;

    } catch (error) {
      console.error(`[PrepaCDS Assistant] Erreur tentative ${attempt}:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Attendre avant le prochain retry
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Toutes les tentatives PrepaCDS Assistant ont échoué');
}

// Fonction principale de génération
async function generateTrainingContent(request: TrainingRequest): Promise<any> {
  const { trainingType, level, domain, sessionId } = request;
  
  console.log(`[GENERATION] Début pour: ${trainingType} - ${level} - ${domain}`);
  
  // Vérifier le cache d'abord
  const cacheKey = `${trainingType}-${level}-${domain}`;
  const cachedContent = getCachedContent(cacheKey);
  
  if (cachedContent) {
    console.log(`[CACHE] Contenu trouvé pour: ${cacheKey}`);
    return {
      ...cachedContent,
      sessionInfo: {
        id: sessionId || `session-${Date.now()}`,
        source: 'cache',
        trainingType,
        level,
        domain,
        createdAt: new Date().toISOString()
      }
    };
  }

  // Générer via OpenAI avec queue
  const template = TRAINING_TEMPLATES[trainingType];
  if (!template) {
    throw new Error(`Type d'entraînement non supporté: ${trainingType}`);
  }

  // Construire le prompt contextuel
  const contextualPrompt = `${template.systemPrompt}

CONTEXTE:
- Niveau: ${level}
- Domaine: ${domain}
- Type: ${trainingType}

INSTRUCTIONS CRITIQUES:
1. Respecte EXACTEMENT le format JSON demandé
2. Génère du contenu de qualité professionnelle niveau ${level}
3. Concentre-toi sur le domaine: ${domain}
4. Assure-toi que le JSON est valide et parsable
5. N'inclus AUCUN texte avant ou après le JSON`;

  const content = await queueRequest(() => 
    callPrepaCDSAssistantWithRetry(contextualPrompt, trainingType, level, domain)
  );

  // Parser et valider le contenu (nettoyer le texte si nécessaire)
  let parsedContent;
  try {
    // Nettoyer la réponse pour extraire uniquement le JSON
    let cleanContent = content.trim();
    
    // Supprimer les blocs de code markdown si présents
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Chercher le premier { et le dernier } pour extraire le JSON
    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
    }
    
    parsedContent = JSON.parse(cleanContent);
    console.log(`[PrepaCDS Assistant] JSON parsé avec succès`);
  } catch (error) {
    console.error('[PARSING] Erreur parsing JSON:', error);
    console.error('[PARSING] Contenu reçu:', content);
    throw new Error('Contenu généré par PrepaCDS Assistant invalide (JSON malformé)');
  }

  // Validation basique
  if (trainingType === 'qcm' && !parsedContent.questions?.length) {
    throw new Error('Questions QCM manquantes');
  }
  if (trainingType === 'vrai_faux' && !parsedContent.questions?.length) {
    throw new Error('Questions Vrai/Faux manquantes');
  }
  if (trainingType === 'cas_pratique' && !parsedContent.steps?.length) {
    throw new Error('Étapes cas pratique manquantes');
  }

  // Ajouter les métadonnées de session
  const finalContent = {
    ...parsedContent,
    sessionInfo: {
      id: sessionId || `session-${Date.now()}`,
      source: 'prepacds_assistant',
      trainingType,
      level,
      domain,
      createdAt: new Date().toISOString(),
      contentLength: JSON.stringify(parsedContent).length
    }
  };

  // Mettre en cache
  setCachedContent(cacheKey, finalContent, CACHE_TTL);
  
  console.log(`[PrepaCDS Assistant] Succès pour: ${trainingType} - ${level} - ${domain}`);
  
  return finalContent;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Parse request
    const requestData = await req.json();
    const { trainingType, level, domain, sessionId } = requestData;

    // Validation des paramètres
    if (!trainingType || !level || !domain) {
      throw new Error('Paramètres manquants: trainingType, level, domain requis');
    }

    const validTrainingTypes = ['qcm', 'vrai_faux', 'cas_pratique'];
    if (!validTrainingTypes.includes(trainingType)) {
      throw new Error(`Type d'entraînement non supporté: ${trainingType}. Types supportés: ${validTrainingTypes.join(', ')}`);
    }

    console.log(`[REQUEST] Nouvelle demande: ${trainingType} - ${level} - ${domain} - User: ${user.id}`);

    // Génération du contenu
    const content = await generateTrainingContent({
      trainingType,
      level,
      domain,
      sessionId
    });

    return new Response(
      JSON.stringify({
        success: true,
        content,
        meta: {
          userId: user.id,
          timestamp: new Date().toISOString(),
          requestId: sessionId || `req-${Date.now()}`
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[ERROR]', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: error.message.includes('Authentication') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});