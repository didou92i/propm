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
    const { level, domain, scenarioType, complexityLevel } = await req.json();

    const systemPrompt = `Tu es un expert en conception de cas pratiques pour le concours CDS.

Génère un cas pratique réaliste avec documents d'accompagnement.

FORMAT REQUIS:
{
  "title": "Titre du cas",
  "context": "Contexte général",
  "documents": ["Document 1", "Document 2", "Document 3"],
  "questions": ["Question 1", "Question 2"],
  "expectedStructure": ["Introduction", "Analyse", "Propositions"],
  "evaluationCriteria": ["Critère 1", "Critère 2"],
  "timeLimit": "2h00",
  "difficulty": "3/5"
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
          { role: 'user', content: `Niveau: ${level}, Domaine: ${domain}, Type: ${scenarioType}` }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    let caseStudy;
    
    try {
      caseStudy = JSON.parse(data.choices[0].message.content);
    } catch {
      caseStudy = {
        title: `Cas pratique ${domain}`,
        context: "Contexte professionnel",
        documents: ["Document administratif", "Note de service", "Rapport d'incident"],
        questions: ["Analysez la situation", "Proposez des solutions"],
        expectedStructure: ["Introduction", "Analyse", "Propositions"],
        evaluationCriteria: ["Analyse juridique", "Propositions réalistes"],
        timeLimit: "2h00",
        difficulty: "3/5"
      };
    }

    return new Response(JSON.stringify(caseStudy), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur cas pratique:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});