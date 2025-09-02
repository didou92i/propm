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

// Fonction pour appeler OpenAI avec retry et backoff
async function callOpenAIWithRetry(
  prompt: string, 
  maxTokens: number,
  retries: number = 3
): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[OpenAI] Tentative ${attempt}/${retries}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: 'Génère le contenu demandé en respectant exactement le format JSON.' }
          ],
          max_completion_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        console.log(`[OpenAI] Rate limit atteint. Attente de ${delay}ms avant retry.`);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          throw new Error(`Rate limit exceeded après ${retries} tentatives`);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Réponse OpenAI invalide');
      }

      return data.choices[0].message.content;

    } catch (error) {
      console.error(`[OpenAI] Erreur tentative ${attempt}:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Attendre avant le prochain retry
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Toutes les tentatives OpenAI ont échoué');
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
4. Assure-toi que le JSON est valide et parsable`;

  const content = await queueRequest(() => 
    callOpenAIWithRetry(contextualPrompt, template.maxTokens)
  );

  // Parser et valider le contenu
  let parsedContent;
  try {
    parsedContent = JSON.parse(content);
  } catch (error) {
    console.error('[PARSING] Erreur parsing JSON:', error);
    throw new Error('Contenu généré invalide (JSON malformé)');
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
      source: 'ai',
      trainingType,
      level,
      domain,
      createdAt: new Date().toISOString(),
      contentLength: JSON.stringify(parsedContent).length
    }
  };

  // Mettre en cache
  setCachedContent(cacheKey, finalContent, CACHE_TTL);
  
  console.log(`[GENERATION] Succès pour: ${trainingType} - ${level} - ${domain}`);
  
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