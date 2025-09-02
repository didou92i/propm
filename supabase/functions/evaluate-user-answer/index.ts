import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userAnswer, expectedAnswer, level, domain } = await req.json();

    const systemPrompt = `Tu es un correcteur expert pour le concours de Chef de Service de Police Municipale.

Analyse la réponse de l'utilisateur et fournis une évaluation détaillée.

FORMAT DE RÉPONSE:
{
  "score": 75,
  "isCorrect": true,
  "strengths": ["Point fort 1", "Point fort 2"],
  "weaknesses": ["Point faible 1"],
  "detailedAnalysis": "Analyse complète de la réponse",
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"],
  "references": ["Référence juridique 1"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Niveau: ${level}, Domaine: ${domain}\nRéponse utilisateur: ${userAnswer}\nRéponse attendue: ${expectedAnswer}` }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    let evaluation;
    
    try {
      evaluation = JSON.parse(data.choices[0].message.content);
    } catch {
      evaluation = {
        score: 50,
        isCorrect: false,
        strengths: [],
        weaknesses: ["Révision nécessaire"],
        detailedAnalysis: "Évaluation en cours",
        improvementSuggestions: ["Approfondir les concepts"],
        references: []
      };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur évaluation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});