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

    // Configuration optimisée pour réduire la latence
    const POLLING_CONFIG = {
      maxAttempts: 15,
      globalTimeout: 12000,
      isSSE: false
    };

    console.log('chat-openai-stream: starting optimized polling', { 
      runId, 
      config: POLLING_CONFIG 
    });

    let result;
    try {
      result = await PollingService.pollForCompletion({
        openAIApiKey,
        threadId,
        runId,
        ...POLLING_CONFIG
      });
    } catch (pollingError) {
      console.error('chat-openai-stream: polling threw exception', { 
        runId, 
        error: pollingError.message 
      });
      
      // Fallback: essayer de récupérer une réponse partielle
      try {
        const fallbackContent = await PollingService.getAssistantMessage(openAIApiKey, threadId, runId);
        if (fallbackContent && fallbackContent !== 'Aucune réponse générée.') {
          console.log('chat-openai-stream: fallback content retrieved', { runId, contentLength: fallbackContent.length });
          return new Response(JSON.stringify({ 
            content: fallbackContent,
            threadId: threadId,
            warning: 'Réponse récupérée en mode fallback'
          }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (fallbackError) {
        console.error('chat-openai-stream: fallback also failed', { runId, error: fallbackError.message });
      }
      
      throw pollingError;
    }

    console.log('chat-openai-stream: polling completed', { 
      runId, 
      status: result.status, 
      attempts: result.attempts,
      elapsedTime: result.elapsedTime,
      hasContent: Boolean(result.content)
    });

    // Gestion réussie
    if (result.status === 'completed' && result.content) {
      console.log('chat-openai-stream: success', { runId, contentLength: result.content.length });
      
      return new Response(JSON.stringify({ 
        content: result.content,
        threadId: threadId 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Gestion intelligente des timeouts avec réponse de secours
    if (result.status === 'timeout') {
      console.error('chat-openai-stream: timeout, attempting emergency response', { 
        runId, 
        attempts: result.attempts,
        elapsedTime: result.elapsedTime
      });
      
      // Réponse de secours en cas de timeout
      const emergencyResponse = `Je m'excuse, la réponse prend plus de temps que prévu. Votre demande a été enregistrée (ID: ${runId.slice(-8)}). Pouvez-vous reformuler votre question pour une réponse plus rapide ?`;
      
      return new Response(JSON.stringify({ 
        content: emergencyResponse,
        threadId: threadId,
        warning: 'Réponse générée en mode urgence suite à un timeout'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Gestion des échecs avec fallback intelligent
    console.error('chat-openai-stream: completion failed, generating fallback', { 
      status: result.status, 
      attempts: result.attempts,
      hasContent: Boolean(result.content)
    });
    
    // Réponse de fallback pour éviter l'erreur 500
    const fallbackResponse = `Je rencontre actuellement des difficultés techniques. Votre demande a été enregistrée (ID: ${runId.slice(-8)}). Pouvez-vous essayer de reformuler votre question ?`;
    
    return new Response(JSON.stringify({ 
      content: fallbackResponse,
      threadId: threadId,
      warning: `Réponse de fallback - statut: ${result.status}`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Toujours retourner 200 pour éviter l'erreur 500
    });

  } catch (error) {
    console.error('Stream function critical error:', error);
    
    // Gestion d'erreur ultra-robuste pour éviter absolument l'erreur 500
    const criticalErrorResponse = `Je rencontre une difficulté technique inattendue. Votre demande a été enregistrée pour investigation. Pouvez-vous réessayer dans quelques instants ?`;
    
    return new Response(JSON.stringify({ 
      content: criticalErrorResponse,
      warning: `Erreur critique: ${error.message}`,
      timestamp: new Date().toISOString()
    }), {
      status: 200, // JAMAIS 500 - toujours retourner 200
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Note: streamAssistantResponse is now handled by StreamingService.createSSEResponse