import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('PREPACDS_ASSISTANT_ID');

// Fonction pour appeler l'assistant PrepaCDS
async function callPrepaCDSAssistant(prompt: string): Promise<string> {
  if (!openAIApiKey || !assistantId) {
    throw new Error('Configuration manquante: OpenAI API key ou PrepaCDS Assistant ID');
  }

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

  // 2. Ajouter le message au thread
  const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role: 'user',
      content: prompt
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
      instructions: 'Tu es un expert en évaluation pour les concours de Chef de Service de Police Municipale. Analyse les réponses avec précision et bienveillance.'
    })
  });

  if (!runResponse.ok) {
    throw new Error(`Failed to create run: ${runResponse.status}`);
  }

  const run = await runResponse.json();

  // 4. Attendre que le run soit complété
  let runStatus = run.status;
  let maxWaitTime = 30000; // 30 secondes max
  let waitTime = 0;
  const pollInterval = 1000;

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
  const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
  
  if (!assistantMessage?.content?.[0]?.text?.value) {
    throw new Error('No response from PrepaCDS Assistant');
  }

  return assistantMessage.content[0].text.value;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userAnswer, expectedAnswer, level, domain } = await req.json();

    const evaluationPrompt = `ÉVALUATION D'UNE RÉPONSE PREPACDS

Niveau: ${level}
Domaine: ${domain}

Réponse de l'utilisateur:
${userAnswer}

Réponse attendue:
${expectedAnswer}

Évalue cette réponse avec expertise et bienveillance. Fournis une analyse précise et constructive.

FORMAT DE RÉPONSE REQUIS (JSON strict):
{
  "score": 75,
  "isCorrect": true,
  "strengths": ["Point fort 1", "Point fort 2"],
  "weaknesses": ["Point faible 1"],
  "detailedAnalysis": "Analyse complète de la réponse",
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"],
  "references": ["Référence juridique 1"]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    const response = await callPrepaCDSAssistant(evaluationPrompt);
    
    let evaluation;
    try {
      // Nettoyer la réponse pour extraire le JSON
      let cleanContent = response.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }
      
      evaluation = JSON.parse(cleanContent);
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