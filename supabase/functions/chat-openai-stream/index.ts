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
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

// Ultra-intelligent thread cache with performance optimization
const threadCache = new Map<string, { 
  threadId: string; 
  lastUsed: number; 
  expiry: number; 
  useCount: number;
  averageResponseTime: number;
  agentType: string;
}>();

// Performance metrics for cache optimization
let cacheHitRate = 0;
let totalCacheRequests = 0;

// Pre-calculated instructions cache with TTL
const instructionCache = new Map<string, { instructions: string; expiry: number }>();

// Ultra-aggressive cleanup every 15 minutes for better performance
setInterval(() => {
  const now = Date.now();
  let cleanedThreads = 0;
  let cleanedInstructions = 0;
  
  // Clean expired threads
  for (const [key, data] of threadCache.entries()) {
    if (now > data.expiry || (data.useCount === 0 && now - data.lastUsed > 30 * 60 * 1000)) {
      threadCache.delete(key);
      cleanedThreads++;
    }
  }
  
  // Clean expired instructions
  for (const [key, data] of instructionCache.entries()) {
    if (now > data.expiry) {
      instructionCache.delete(key);
      cleanedInstructions++;
    }
  }
  
  if (cleanedThreads > 0 || cleanedInstructions > 0) {
    console.log('cache-cleanup:', { cleanedThreads, cleanedInstructions, cacheSize: threadCache.size });
  }
}, 15 * 60 * 1000); // Every 15 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is an SSE streaming request
  const acceptHeader = req.headers.get('accept') || '';
  const isStreamingRequest = acceptHeader.includes('text/event-stream');

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
    const lastMessage = messages[messages.length - 1];
    
    console.log('chat-openai-stream: incoming request', {
      userId: user.id,
      selectedAgent,
      contentLength: (lastMessage?.content || '').length,
      hasThreadId: Boolean(userSession?.threadId),
      isStreaming: isStreamingRequest
    });

    // Ultra-intelligent thread management with performance-aware cache
    const cacheKey = `${user.id}-${selectedAgent}`;
    let threadId = userSession?.threadId;
    totalCacheRequests++;
    
    // Check cache first with performance tracking
    const cachedThread = threadCache.get(cacheKey);
    if (cachedThread && !threadId && Date.now() < cachedThread.expiry) {
      threadId = cachedThread.threadId;
      cachedThread.lastUsed = Date.now();
      cachedThread.useCount++;
      cacheHitRate = ((cacheHitRate * (totalCacheRequests - 1)) + 1) / totalCacheRequests;
      console.log('chat-openai-stream: using cached thread', { 
        threadId, 
        useCount: cachedThread.useCount,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100
      });
    }
    
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
      
      // Cache the new thread with enhanced metadata for 2 hours (increased for performance)
      threadCache.set(cacheKey, {
        threadId,
        lastUsed: Date.now(),
        expiry: Date.now() + (120 * 60 * 1000), // 2 hours for better performance
        useCount: 1,
        averageResponseTime: 0,
        agentType: selectedAgent
      });
      
      console.log('chat-openai-stream: created and cached thread', { 
        threadId, 
        cacheSize: threadCache.size,
        selectedAgent
      });
    } else {
      // Update cache usage for existing threads
      if (cachedThread) {
        cachedThread.lastUsed = Date.now();
        cachedThread.useCount++;
      }
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

    // Simplified instruction handling - let assistants use their core prompts
    const getInstructions = (agent: string, messageContent: string): string | undefined => {
      // Only provide essential context for arrete agent when needed
      if (agent === 'arrete') {
        const text = messageContent.toLowerCase();
        const shouldGenerate = /arr[ée]t[ée]|exemple|g[ée]n[ée]re|r[ée]dige|produis/.test(text);
        if (shouldGenerate) {
          return "Réponds en français. Produis l'arrêté demandé selon la structure réglementaire.";
        }
      }
      return undefined; // Let other assistants use their configured prompts
    };
    
    const instructions = getInstructions(selectedAgent, lastMessage?.content || '');

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
      const errorText = await runResponse.text();
      console.error('OpenAI API error:', { status: runResponse.status, body: errorText });
      throw new Error(`Failed to create run: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Return SSE stream if requested
    if (isStreamingRequest) {
      return streamAssistantResponse(openAIApiKey, threadId, runId);
    }

    // Ultra-optimized adaptive polling with performance intelligence
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // Increased for better reliability
    const startTime = Date.now();

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      // Ultra-aggressive polling: faster initial intervals, smarter adaptation
      const pollInterval = attempts < 2 ? 15 : // Ultra-fast start
                          attempts < 5 ? 25 : // Fast continuation
                          attempts < 12 ? 40 : // Moderate speed
                          attempts < 25 ? 75 : // Standard polling
                          attempts < 40 ? 150 : // Slower but persistent
                          250; // Conservative fallback
      
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
        
        // Intelligent logging with performance tracking
        if (attempts % 5 === 0 || attempts < 5) {
          console.log('chat-openai-stream: run status', { 
            runId, 
            runStatus, 
            attempts, 
            pollInterval,
            elapsedTime: Date.now() - startTime,
            estimatedCompletion: runStatus === 'in_progress' ? `~${Math.round((Date.now() - startTime) * 1.5)}ms` : 'unknown'
          });
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

// SSE Streaming function for real-time updates
async function streamAssistantResponse(openAIApiKey: string, threadId: string, runId: string): Promise<Response> {
  const encoder = new TextEncoder();
  
  let runStatus = 'queued';
  let attempts = 0;
  const maxAttempts = 70; // Increased for SSE reliability
  let lastContent = '';
  const startTime = Date.now();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send immediate feedback
      controller.enqueue(encoder.encode('event: status\n'));
      controller.enqueue(encoder.encode('data: {"status": "thinking", "message": "L\'assistant réfléchit..."}\n\n'));
      
      while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
        // Ultra-aggressive SSE polling - even faster than non-streaming
        const pollInterval = attempts < 2 ? 10 : // Instant feedback
                            attempts < 5 ? 20 : // Ultra-fast
                            attempts < 12 ? 35 : // Fast continuation
                            attempts < 25 ? 60 : // Moderate speed
                            attempts < 45 ? 120 : // Standard polling
                            200; // Conservative fallback
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        try {
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
            if (attempts % 10 === 0) {
              const statusMessage = runStatus === 'in_progress' ? 'Génération en cours...' : 
                                   runStatus === 'queued' ? 'En attente...' : 
                                   'Traitement...';
              controller.enqueue(encoder.encode('event: status\n'));
              controller.enqueue(encoder.encode(`data: {"status": "${runStatus}", "message": "${statusMessage}"}\n\n`));
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
        } catch (error) {
          console.error('Polling error:', error);
          attempts++;
        }
      }

      if (runStatus === 'completed') {
        // Get final message
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
            
            // Send complete response
            controller.enqueue(encoder.encode('event: complete\n'));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, threadId })}\n\n`));
          }
        }
      } else {
        // Send error
        controller.enqueue(encoder.encode('event: error\n'));
        controller.enqueue(encoder.encode('data: {"error": "Assistant did not complete successfully"}\n\n'));
      }
      
      controller.close();
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
}