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

const TRAINING_PROMPTS = {
  qcm: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale. 
Génère une question à choix multiples adaptée au niveau et domaine spécifiés.
Format: Question claire, 4 propositions (A, B, C, D), une seule bonne réponse.
Ajoute une explication pédagogique après la réponse.`,

  vrai_faux: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère une affirmation de type VRAI/FAUX adaptée au niveau et domaine spécifiés.
Format: Affirmation claire, réponse (VRAI ou FAUX), explication détaillée.`,

  cas_pratique: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère un cas pratique de management et rédaction adapté au niveau et domaine spécifiés.
Format: Situation concrète, questions à résoudre, éléments de correction attendus.`,

  question_ouverte: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Génère une question ouverte adaptée au niveau et domaine spécifiés.
Format: Question précise, axes de réponse attendus, critères d'évaluation.`,

  simulation_oral: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Simule un entretien oral adapté au niveau et domaine spécifiés.
Format: Question de jury, conseils de réponse, critères d'évaluation.`,

  plan_revision: `Tu es un expert en préparation aux concours de Chef de Service de Police Municipale.
Crée un plan de révision personnalisé adapté au niveau et domaine spécifiés.
Format: Planning structuré, objectifs clairs, ressources recommandées.`
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

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { 
      prompt, 
      trainingType = 'qcm', 
      level = 'intermediaire', 
      domain = 'droit_administratif' 
    } = await req.json();

    console.log('PrepaCDS request:', { trainingType, level, domain });

    // Construire le prompt système basé sur le type d'entraînement
    const systemPrompt = TRAINING_PROMPTS[trainingType as keyof typeof TRAINING_PROMPTS] || TRAINING_PROMPTS.qcm;
    
    const contextualPrompt = `${systemPrompt}

Niveau: ${level}
Domaine: ${domain}
Demande utilisateur: ${prompt}

Réponds de manière structurée et pédagogique.`;

    // Appel simplifié à l'API Chat Completions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: prompt 
          }
        ],
        reasoning: { effort: 'medium' }, // ✅ Syntaxe correcte GPT-5
        text: { verbosity: 'medium' },   // ✅ Réponses équilibrées
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Aucune réponse générée.';

    console.log('PrepaCDS response generated successfully');

    return new Response(JSON.stringify({ 
      content: content,
      trainingType: trainingType,
      level: level,
      domain: domain,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PrepaCDS function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});