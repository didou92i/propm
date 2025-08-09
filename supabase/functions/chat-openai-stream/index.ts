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

    const { messages, selectedAgent, userSession } = await req.json();

    // Return the complete response directly for client-side streaming
    const lastMessage = messages[messages.length - 1];
    console.log('chat-openai-stream: incoming request', {
      userId: user.id,
      selectedAgent,
      contentLength: (lastMessage?.content || '').length,
      hasThreadId: Boolean(userSession?.threadId)
    });
    
    // Get or create thread
    let threadId = userSession?.threadId;
    if (!threadId) {
      console.log('chat-openai-stream: creating new thread', { userId: user.id, selectedAgent });
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
        throw new Error('Failed to create thread');
      }
      
      const threadData = await threadResponse.json();
      threadId = threadData.id;
      console.log('chat-openai-stream: created thread', { threadId });
    } else {
      console.log('chat-openai-stream: reusing thread', { threadId });
    }

    // Add user message to thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: lastMessage.content
      })
    });

    // Create run with agent-specific instruction overrides
    const assistantMap: Record<string, string> = {
      redacpro: "asst_nVveo2OzbB2h8uHY2oIDpob1",
      cdspro: "asst_ljWenYnbNEERVydsDaeVSHVl",
      arrete: "asst_e4AMY6vpiqgqFwbQuhNCbyeL",
      prepacds: "asst_MxbbQeTimcxV2mYR0KwAPNsu"
    };
    const assistantId = assistantMap[selectedAgent] || assistantMap.redacpro;

    const instructionMap: Record<string, string> = {
      arrete: (() => {
        const text = (lastMessage?.content || '').toLowerCase();
        const shouldGenerate = /arr[ée]t[ée]|exemple|g[ée]n[ée]re|g[ée]n[ée]ration|r[ée]dige|produis|mod[èe]le|vas[- ]y|^oui$|^ok$/.test(text.trim());
        console.log('chat-openai-stream: arrete intent', { shouldGenerate });
        const base = [
          "Tu es 'Arrêté Territorial'. Réponds en français.",
          "Style administratif formel, concis et juridiquement conforme (CGCT)."
        ];
        if (shouldGenerate) {
          base.push(
            "PRODUIS IMMÉDIATEMENT un arrêté complet sans reformuler les mêmes questions.",
            "Structure sans Markdown: En-tête, Visas, Considérants, Articles numérotés, Dispositions finales, Signature.",
            "Remplace toute donnée manquante par [INFORMATION MANQUANTE].",
            "N'insiste pas pour reposer les mêmes questions."
          );
        } else {
          base.push(
            "Si la demande est une question générale (analyse juridique, explication), réponds directement sans générer un arrêté.",
            "Ne boucle pas et ne repose pas les mêmes questions."
          );
        }
        return base.join(' ');
      })()
    };
    const instructions = instructionMap[selectedAgent];

    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        ...(instructions ? { instructions } : {})
      })
    });

    if (!runResponse.ok) {
      throw new Error('Failed to create run');
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Adaptive polling
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 120;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      const pollInterval = attempts < 10 ? 200 : attempts < 30 ? 300 : 500;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        if (attempts % 5 === 0) {
          console.log('chat-openai-stream: run status', { runId, runStatus, attempts });
        }
        if (runStatus === 'requires_action') {
          await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({ tool_outputs: [] })
          });
        }
      }
      
      attempts++;
    }

    if (runStatus === 'completed') {
      // Get messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data.find(msg => msg.role === 'assistant' && msg.run_id === runId);
        
        if (assistantMessage) {
          const content = assistantMessage.content[0]?.text?.value || 'Aucune réponse générée.';
          
          // Return the complete response for client-side streaming
          console.log('chat-openai-stream: completed', { runId, contentLength: content.length });
          return new Response(JSON.stringify({ 
            content: content,
            threadId: threadId
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    
    throw new Error('Assistant did not complete successfully');

  } catch (error) {
    console.error('Stream function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});