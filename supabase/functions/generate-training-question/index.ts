import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('PREPACDS_ASSISTANT_ID');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { level, domain, questionType, avoidRecentTopics } = await req.json();

    console.log('Génération question:', { level, domain, questionType });

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
          instructions: 'Tu es un expert en génération de questions pour les concours de Chef de Service de Police Municipale. Génère des questions de qualité professionnelle.'
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

    // Construction du prompt pour l'assistant PrepaCDS
    const questionPrompt = `GÉNÉRATION DE QUESTION PREPACDS

Type de question: ${questionType}
Niveau: ${level}
Domaine: ${domain}
Éviter répétitions: ${avoidRecentTopics ? 'Oui' : 'Non'}

Génère UNE question d'entraînement de qualité professionnelle conforme aux épreuves du concours de Chef de Service de Police Municipale.

FORMAT DE RÉPONSE REQUIS (JSON strict):
{
  "question": "Question formulée clairement",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "Réponse correcte",
  "explanation": "Explication détaillée avec analyse et références",
  "references": [
    {
      "article": "Article L.511-1",
      "code": "Code de la sécurité intérieure",
      "content": "Texte de l'article",
      "url": "URL légifrance si disponible"
    }
  ],
  "difficulty": "Niveau de difficulté 1-5",
  "domain": "${domain}",
  "learningObjectives": ["Objectif 1", "Objectif 2"]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    const response = await callPrepaCDSAssistant(questionPrompt);

    // Extraction du JSON de la réponse
    let questionData;
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
      
      questionData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      // Fallback avec structure de base
      questionData = {
        question: `Question ${questionType} pour ${domain}`,
        options: questionType === 'qcm' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
        correctAnswer: 'Réponse à déterminer',
        explanation: 'Explication générée par l\'assistant PrepaCDS',
        references: [],
        difficulty: level === 'debutant' ? 2 : level === 'intermediaire' ? 3 : 4,
        domain: domain,
        learningObjectives: [`Maîtriser ${domain}`]
      };
    }

    // Log de la question générée (pour monitoring)
    try {
      await supabase
        .from('training_questions_log')
        .insert({
          level,
          domain,
          question_type: questionType,
          question_content: questionData.question,
          generated_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Erreur log question:', logError);
      // Ne pas faire échouer la requête pour un problème de log
    }

    console.log('Question générée avec succès');

    return new Response(JSON.stringify(questionData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Erreur génération question:', error);
    
    // Réponse de fallback en cas d'erreur
    const fallbackQuestion = {
      question: `Question d'entraînement générée pour le domaine demandé`,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
      explanation: 'Cette question sera développée ultérieurement avec les références appropriées.',
      references: [],
      difficulty: 3,
      domain: 'general',
      learningObjectives: ['Révision générale']
    };

    return new Response(JSON.stringify(fallbackQuestion), {
      status: 200, // Retourner 200 avec fallback plutôt qu'une erreur
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});