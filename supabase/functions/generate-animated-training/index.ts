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
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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

    const { 
      trainingType = 'qcm',
      level = 'intermediaire',
      domain = 'droit_administratif',
      options = {}
    } = await req.json();

    console.log('Generating animated training:', { trainingType, level, domain, options });

    // Récupérer le template approprié
    const template = TRAINING_TEMPLATES[trainingType as keyof typeof TRAINING_TEMPLATES];
    if (!template) {
      throw new Error(`Type d'entraînement non supporté: ${trainingType}`);
    }

    // Construire le prompt contextuel
    const contextualPrompt = `${template.systemPrompt}

NIVEAU: ${level}
DOMAINE: ${domain}
OPTIONS: ${JSON.stringify(options)}

Génère du contenu adapté au niveau ${level} en ${domain}.
${trainingType === 'qcm' ? `Crée exactement ${template.questionCount} questions variées.` : ''}
${trainingType === 'vrai_faux' ? `Crée exactement ${template.questionCount} affirmations équilibrées.` : ''}
${trainingType === 'cas_pratique' ? `Crée exactement ${template.stepCount} étapes progressives.` : ''}

IMPORTANT: Réponds UNIQUEMENT avec du JSON valide, sans texte additionnel.`;

    // Appel à l'API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
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
        max_completion_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Aucun contenu généré par OpenAI');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Content:', content);
      throw new Error('Format de réponse invalide de OpenAI');
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

    console.log('Animated training content generated successfully');

    return new Response(JSON.stringify({ 
      content: enhancedContent,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate animated training error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});