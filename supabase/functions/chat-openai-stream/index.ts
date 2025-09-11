import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { threadCacheService } from '../_shared/threadCache.ts';
import { PollingService } from '../_shared/pollingService.ts';
import { StreamingService } from '../_shared/streamingService.ts';
import { AssistantMapper } from '../_shared/assistantMapper.ts';

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

    // Gestion intelligente du cache des threads
    const cacheKey = threadCacheService.getCacheKey(user.id, selectedAgent);
    let threadId = userSession?.threadId;
    
    // Vérification du cache en premier
    const cachedThread = threadCacheService.get(cacheKey);
    if (cachedThread && !threadId) {
      threadId = cachedThread.threadId;
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
      
      // Mise en cache du nouveau thread
      threadCacheService.set(cacheKey, threadId, selectedAgent);
    } else {
      // Mise à jour de l'usage du cache
      threadCacheService.updateUsage(cacheKey);
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

    // Configuration de l'assistant avec mapping centralisé
    const assistantId = AssistantMapper.getAssistantId(selectedAgent);
    const instructions = AssistantMapper.getInstructions(selectedAgent, lastMessage?.content || '');

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

    // Return SSE stream if requested
    if (isStreamingRequest) {
      return StreamingService.createSSEResponse({ openAIApiKey, threadId, runId, corsHeaders });
    }

    // Polling optimisé pour la réponse standard
    const result = await PollingService.pollForCompletion({
      openAIApiKey,
      threadId,
      runId,
      maxAttempts: 60
    });

    if (result.status === 'completed' && result.content) {
      return new Response(JSON.stringify({ 
        content: result.content,
        threadId: threadId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

// Note: streamAssistantResponse is now handled by StreamingService.createSSEResponse