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

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: 'Initialisation...' })}\n\n`));

          // Get or create thread
          let threadId = userSession?.threadId;
          if (!threadId) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: 'Création du thread...' })}\n\n`));
            
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
          }

          // Add user message to thread
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: 'Ajout du message...' })}\n\n`));
          
          const lastMessage = messages[messages.length - 1];
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

          // Create run
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: 'Démarrage de l\'assistant...' })}\n\n`));
          
          const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
              assistant_id: selectedAgent
            })
          });

          if (!runResponse.ok) {
            throw new Error('Failed to create run');
          }

          const runData = await runResponse.json();
          const runId = runData.id;

          // Adaptive polling with streaming updates
          let runStatus = 'queued';
          let attempts = 0;
          const maxAttempts = 120; // 2 minutes timeout
          
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: 'Traitement en cours...' })}\n\n`));

          while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
            // Adaptive polling: start fast, then slow down
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
              
              // Send status updates
              const statusMessages = {
                'queued': 'En file d\'attente...',
                'in_progress': 'Génération de la réponse...',
                'requires_action': 'Finalisation...'
              };
              
              if (statusMessages[runStatus]) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                  type: 'status', 
                  message: statusMessages[runStatus],
                  progress: Math.min(95, (attempts / maxAttempts) * 100)
                })}\n\n`));
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
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'status', message: 'Récupération de la réponse...', progress: 98 })}\n\n`));
            
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
                
                // Send the response in chunks for streaming effect
                const words = content.split(' ');
                const chunkSize = 3;
                
                for (let i = 0; i < words.length; i += chunkSize) {
                  const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                    type: 'content', 
                    chunk: chunk,
                    isComplete: false
                  })}\n\n`));
                  
                  // Small delay for streaming effect
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                // Send completion signal
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                  type: 'complete', 
                  content: content,
                  threadId: threadId
                })}\n\n`));
                
                // Save to database in background (non-blocking)
                Promise.resolve().then(async () => {
                  try {
                    // Get or create conversation
                    const { data: existingConv } = await supabaseAdmin
                      .from('conversations')
                      .select('id')
                      .eq('user_id', user.id)
                      .eq('agent_id', selectedAgent)
                      .single();

                    let conversationId = existingConv?.id;
                    
                    if (!conversationId) {
                      const { data: newConv } = await supabaseAdmin
                        .from('conversations')
                        .insert([{
                          user_id: user.id,
                          agent_id: selectedAgent,
                          title: lastMessage.content.substring(0, 50),
                          thread_id: threadId
                        }])
                        .select()
                        .single();
                      conversationId = newConv?.id;
                    }

                    // Save messages
                    await supabaseAdmin
                      .from('conversation_messages')
                      .insert([
                        {
                          conversation_id: conversationId,
                          role: 'user',
                          content: lastMessage.content,
                          message_index: messages.length - 1
                        },
                        {
                          conversation_id: conversationId,
                          role: 'assistant',
                          content: content,
                          message_index: messages.length
                        }
                      ]);
                  } catch (error) {
                    console.error('Background save failed:', error);
                  }
                });
              }
            }
          } else {
            throw new Error('Assistant did not complete successfully');
          }

        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message 
          })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});