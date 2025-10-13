import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Templates de génération par type d'entraînement
const TRAINING_TEMPLATES = {
  qcm: {
    systemPrompt: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère un quiz interactif avec des questions à choix multiples optimisées pour l'animation.
Format de réponse STRICTEMENT JSON :
{
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": number (0-3),
      "explanation": "string détaillée",
      "difficulty": "facile|moyen|difficile",
      "animationType": "standard|highlight|progressive"
    }
  ],
  "metadata": {
    "estimatedTime": number,
    "passingScore": number,
    "tips": ["tip1", "tip2"]
  }
}`,
    questionCount: 5
  },

  vrai_faux: {
    systemPrompt: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère des affirmations de type vrai/faux avec animations de flip.
Format de réponse STRICTEMENT JSON :
{
  "questions": [
    {
      "id": "string",
      "statement": "string claire et précise",
      "isTrue": boolean,
      "explanation": "string détaillée",
      "domain": "string",
      "confidence": "high|medium|low",
      "animationType": "flip|slide|fade"
    }
  ],
  "metadata": {
    "estimatedTime": number,
    "difficulty": "facile|moyen|difficile"
  }
}`,
    questionCount: 6
  },

  cas_pratique: {
    systemPrompt: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère un cas pratique interactif avec progression étape par étape.
Format de réponse STRICTEMENT JSON :
{
  "title": "string",
  "context": "string détaillé",
  "steps": [
    {
      "id": "string",
      "title": "string",
      "scenario": "string détaillé",
      "question": "string",
      "expectedPoints": ["point1", "point2", "point3"],
      "timeLimit": number,
      "animationType": "typewriter|reveal|progressive"
    }
  ],
  "metadata": {
    "totalTime": number,
    "difficulty": "facile|moyen|difficile",
    "evaluationCriteria": ["critère1", "critère2"]
  }
}`,
    stepCount: 3
  },

  simulation_oral: {
    systemPrompt: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère une simulation d'entretien oral interactif avec jury virtuel.
Format de réponse STRICTEMENT JSON :
{
  "scenario": {
    "setting": "string",
    "juryMembers": ["membre1", "membre2", "membre3"],
    "duration": number
  },
  "questions": [
    {
      "id": "string",
      "question": "string",
      "type": "motivation|technique|situation|leadership",
      "expectedElements": ["élément1", "élément2"],
      "followUpQuestions": ["question1", "question2"],
      "animationType": "avatar|highlight|interactive"
    }
  ],
  "metadata": {
    "tips": ["conseil1", "conseil2"],
    "evaluationGrid": ["critère1", "critère2"]
  }
}`,
    questionCount: 4
  },

  question_ouverte: {
    systemPrompt: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère des questions ouvertes nécessitant développement et argumentation.
Format de réponse STRICTEMENT JSON :
{
  "questions": [
    {
      "id": "string",
      "question": "string",
      "context": "string optionnel",
      "expectedLength": "court|moyen|long",
      "keyPoints": ["point1", "point2", "point3"],
      "evaluationCriteria": ["critère1", "critère2"],
      "animationType": "typewriter|reveal|progressive"
    }
  ],
  "metadata": {
    "estimatedTime": number,
    "difficulty": "facile|moyen|difficile",
    "instructions": "string"
  }
}`,
    questionCount: 3
  },

  plan_revision: {
    systemPrompt: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère un plan de révision personnalisé et structuré.
Format de réponse STRICTEMENT JSON :
{
  "title": "string",
  "description": "string",
  "phases": [
    {
      "id": "string",
      "title": "string",
      "duration": "string",
      "objectives": ["objectif1", "objectif2"],
      "activities": ["activité1", "activité2"],
      "resources": ["ressource1", "ressource2"],
      "animationType": "timeline|progress|interactive"
    }
  ],
  "metadata": {
    "totalDuration": "string",
    "difficulty": "facile|moyen|difficile",
    "checkpoints": ["checkpoint1", "checkpoint2"]
  }
}`,
    phaseCount: 4
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let trainingType = 'qcm';
  let level = 'intermediaire';
  let domain = 'droit_administratif';
  let sessionId = `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('🚀 [START] Début génération contenu animé PrepaCDS:', { 
      sessionId,
      timestamp: new Date().toISOString(),
      phase: 'initialization'
    });
    
    // Utiliser la clé API dédiée aux animations pour optimiser les prompts
    const openAIApiKey = Deno.env.get('OPENAI_ANIMATIONS_API_KEY') || Deno.env.get('OPENAI_API_KEY');
    const prepaCdsAssistantId = Deno.env.get('PREPACDS_ASSISTANT_ID');
    
    console.log('🔧 Configuration API:', { 
      hasOpenAIKey: !!openAIApiKey,
      hasPrepaCdsAssistantId: !!prepaCdsAssistantId,
      timestamp: new Date().toISOString()
    });
    
    if (!openAIApiKey) {
      throw new Error('OpenAI Animations API key not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const requestBody = await req.json();
    trainingType = requestBody.trainingType || 'qcm';
    level = requestBody.level || 'intermediaire';
    domain = requestBody.domain || 'droit_administratif';
    const options = requestBody.options || {};

    console.log('📝 [PARAMS] Paramètres génération:', { 
      sessionId,
      trainingType, 
      level, 
      domain, 
      options,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      phase: 'parameters'
    });

    // Récupérer le template approprié
    const template = TRAINING_TEMPLATES[trainingType as keyof typeof TRAINING_TEMPLATES];
    if (!template) {
      console.error(`Type d'entraînement non supporté: ${trainingType}. Types disponibles:`, Object.keys(TRAINING_TEMPLATES));
      throw new Error(`Type d'entraînement non supporté: ${trainingType}. Types disponibles: ${Object.keys(TRAINING_TEMPLATES).join(', ')}`);
    }
    
    // Extraction sécurisée du nombre d'items selon le type de template
    const getItemCount = (tmpl: typeof template): number | string => {
      if ('questionCount' in tmpl) return tmpl.questionCount;
      if ('stepCount' in tmpl) return tmpl.stepCount;
      if ('phaseCount' in tmpl) return tmpl.phaseCount;
      return 'N/A';
    };
    
    console.log(`Template trouvé pour ${trainingType}:`, { 
      systemPromptLength: template.systemPrompt.length,
      itemCount: getItemCount(template)
    });

    // Construire le prompt contextuel avec tokens réduits
    const contextualPrompt = `${template.systemPrompt}

NIVEAU: ${level}
DOMAINE: ${domain}

Génère du contenu adapté au niveau ${level} en ${domain}.
${trainingType === 'qcm' ? `Crée exactement ${template.questionCount} questions variées.` : ''}
${trainingType === 'vrai_faux' ? `Crée exactement ${template.questionCount} affirmations équilibrées.` : ''}
${trainingType === 'cas_pratique' ? `Crée exactement ${template.stepCount} étapes progressives.` : ''}
${trainingType === 'question_ouverte' ? `Crée exactement ${template.questionCount} questions ouvertes nécessitant développement.` : ''}
${trainingType === 'simulation_oral' ? `Crée exactement ${template.questionCount} questions d'entretien oral.` : ''}
${trainingType === 'plan_revision' ? `Crée exactement ${template.phaseCount} phases de révision.` : ''}

IMPORTANT: Réponds UNIQUEMENT avec du JSON valide, sans texte additionnel.`;

    console.log('Prompt contextuel généré:', {
      trainingType,
      promptLength: contextualPrompt.length,
      level,
      domain
    });

    console.log('🤖 [API_CALL] Appel OpenAI avec assistant PrepaCDS:', {
      sessionId,
      model: prepaCdsAssistantId ? 'gpt-5-with-assistant' : 'gpt-5-standard',
      assistantId: prepaCdsAssistantId,
      trainingType,
      timestamp: new Date().toISOString(),
      phase: 'openai_call'
    });

    // Utiliser l'assistant PrepaCDS si configuré, sinon utiliser le modèle standard
    let response;
    if (prepaCdsAssistantId) {
      // Utiliser l'assistant spécialisé PrepaCDS avec l'endpoint correct
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07', // GPT-5 pour contenu pédagogique complexe
          messages: [
            { 
              role: 'system', 
              content: `Tu es l'assistant PrepaCDS spécialisé (ID: ${prepaCdsAssistantId}). ${contextualPrompt}`
            },
            { 
              role: 'user', 
              content: `Génère maintenant le contenu pour un entraînement ${trainingType} de niveau ${level} en ${domain}.` 
            }
          ],
          reasoning_effort: 'medium', // Raisonnement pour structurer le contenu
          verbosity: 'high', // Explications détaillées pour formation
          max_completion_tokens: 2500,
          response_format: { type: "json_object" }
        }),
      });
    } else {
      // Utiliser le modèle standard
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07', // GPT-5 pour contenu pédagogique
          messages: [
            { 
              role: 'system', 
              content: contextualPrompt
            },
            { 
              role: 'user', 
              content: `Génère maintenant le contenu pour un entraînement ${trainingType} de niveau ${level} en ${domain}.` 
            }
          ],
          reasoning_effort: 'medium', // Raisonnement pour structurer le contenu
          verbosity: 'high', // Explications détaillées pour formation
          max_completion_tokens: 2500,
          response_format: { type: "json_object" }
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        trainingType,
        level,
        domain
      });
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 [API_RESPONSE] Réponse API reçue:', {
      sessionId,
      apiType: prepaCdsAssistantId ? 'assistant' : 'completion',
      choices: data.choices?.length || 0,
      usage: data.usage,
      trainingType,
      finishReason: data.choices[0]?.finish_reason,
      assistantUsed: !!prepaCdsAssistantId,
      timestamp: new Date().toISOString(),
      phase: 'response_received'
    });

    const content = data.choices[0]?.message?.content;

    if (!content || content.trim() === '') {
      console.error('Aucun contenu dans la réponse OpenAI:', {
        fullResponse: data,
        finishReason: data.choices[0]?.finish_reason,
        trainingType
      });
      throw new Error('Aucun contenu généré par OpenAI');
    }

    console.log('Contenu OpenAI reçu:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
      trainingType
    });

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log('JSON parse réussi:', {
        trainingType,
        keysInParsedContent: Object.keys(parsedContent),
        questionsCount: parsedContent.questions?.length || parsedContent.steps?.length || parsedContent.phases?.length || 'N/A'
      });
    } catch (parseError) {
      console.error('JSON parsing error:', {
        error: parseError.message,
        content: content.substring(0, 500),
        trainingType,
        level,
        domain
      });
      throw new Error(`Format de réponse invalide de OpenAI: ${parseError.message}`);
    }

    // Ajouter des métadonnées d'animation
    const enhancedContent = {
      ...parsedContent,
      sessionInfo: {
        id: `session-${Date.now()}`,
        trainingType,
        level,
        domain,
        createdAt: new Date().toISOString(),
        estimatedDuration: parsedContent.metadata?.estimatedTime || 
          (trainingType === 'qcm' ? 15 : trainingType === 'vrai_faux' ? 10 : 30)
      }
    };

    console.log('✅ [SUCCESS] Contenu d\'entraînement animé généré avec succès:', {
      sessionId,
      clientSessionId: enhancedContent.sessionInfo.id,
      trainingType,
      level,
      domain,
      contentKeys: Object.keys(enhancedContent),
      assistantUsed: !!prepaCdsAssistantId,
      contentLength: JSON.stringify(enhancedContent).length,
      success: true,
      timestamp: new Date().toISOString(),
      phase: 'success'
    });

    // Réponse garantie non vide avec meta status
    const successResponse = {
      content: enhancedContent,
      trainingType,
      level,
      domain,
      success: true,
      meta: {
        status: 'OK',
        serverSessionId: sessionId,
        clientSessionId: enhancedContent.sessionInfo.id,
        timestamp: new Date().toISOString(),
        assistantUsed: !!prepaCdsAssistantId,
        generatedAt: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorSessionId = `error-${sessionId || Date.now()}`;
    
    console.error('❌ [ERROR] Erreur génération contenu animé:', {
      sessionId: errorSessionId,
      originalSessionId: sessionId,
      errorMessage: error.message,
      errorStack: error.stack,
      trainingType,
      level,
      domain,
      userId: 'unknown',
      timestamp: new Date().toISOString(),
      phase: 'error'
    });
    
    // Fallback garanti non vide même en cas d'erreur
    const fallbackErrorContent = {
      content: {
        questions: [{
          id: 'error-fallback',
          question: 'Cette question de démonstration apparaît en cas d\'erreur technique.',
          options: ['Réessayer', 'Continuer', 'Quitter', 'Support'],
          correctAnswer: 0,
          explanation: 'Le système a généré un contenu de démonstration suite à une erreur technique.',
          difficulty: level
        }],
        sessionInfo: {
          id: errorSessionId,
          trainingType,
          level,
          domain,
          createdAt: new Date().toISOString(),
          estimatedDuration: 5,
          isErrorFallback: true
        }
      },
      trainingType,
      level,
      domain,
      success: false,
      meta: {
        status: 'ERROR',
        serverSessionId: sessionId,
        errorSessionId: errorSessionId,
        timestamp: new Date().toISOString(),
        errorMessage: error.message,
        phase: 'error_fallback'
      }
    };
    
    return new Response(JSON.stringify(fallbackErrorContent), {
      status: 200, // 200 pour éviter les erreurs côté client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});