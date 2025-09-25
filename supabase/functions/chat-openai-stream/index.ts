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

  const startTime = Date.now();

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
    
    // Configuration optimisée par assistant avec diagnostic
    const assistantId = AssistantMapper.getAssistantId(selectedAgent);
    const optimizedConfig = AssistantMapper.getOptimizedConfig(assistantId);
    
    console.log(`chat-openai-stream: incoming request {
  userId: "${user.id}",
  selectedAgent: "${selectedAgent}",
  assistantId: "${assistantId}",
  contentLength: ${(lastMessage?.content || '').length},
  hasThreadId: ${Boolean(userSession?.threadId)},
  isStreaming: ${isStreamingRequest},
  config: ${JSON.stringify(optimizedConfig)}
}`);

    // Gestion intelligente du cache des threads
    const cacheKey = threadCacheService.getCacheKey(user.id, selectedAgent);
    let threadId = userSession?.threadId;
    
    // Vérification du cache en premier
    const cachedThread = threadCacheService.get(cacheKey);
    if (cachedThread && !threadId) {
      threadId = cachedThread.threadId;
    }
    
    if (!threadId) {
      console.log(`chat-openai-stream: creating new thread {
  userId: "${user.id}",
  selectedAgent: "${selectedAgent}"
}`);
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

    // Configuration de l'assistant avec instructions spécifiques
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

    console.log(`chat-openai-stream: starting optimized polling {
  runId: "${runId}",
  config: { maxAttempts: ${optimizedConfig.maxAttempts}, globalTimeout: ${optimizedConfig.globalTimeout}, isSSE: ${isStreamingRequest} }
}`);

    // Return SSE stream if requested
    if (isStreamingRequest) {
      return StreamingService.createSSEResponse({ openAIApiKey, threadId, runId, corsHeaders });
    }

    // Polling optimisé avec configuration dynamique
    let pollingResult;
    try {
      pollingResult = await PollingService.pollForCompletion({
        openAIApiKey,
        threadId,
        runId,
        maxAttempts: optimizedConfig.maxAttempts,
        globalTimeout: optimizedConfig.globalTimeout + 3000, // PollingService a besoin de plus de temps
        maxRequiresActionAttempts: 3
      });
    } catch (pollingError: any) {
      console.error(`chat-openai-stream: polling exception { runId: "${runId}", error: "${pollingError?.message || pollingError}" }`);
      throw pollingError;
    }

    const responseTime = Date.now() - startTime;
    
    console.log(`chat-openai-stream: polling completed {
  runId: "${runId}",
  status: "${pollingResult.status}",
  attempts: ${pollingResult.attempts},
  elapsedTime: ${pollingResult.elapsedTime},
  hasContent: ${Boolean(pollingResult.messageContent)},
  responseTime: ${responseTime}
}`);

    // Gestion des résultats avec diagnostic et fallback
    if (pollingResult.status === 'completed' && pollingResult.messageContent) {
      // Enregistrer le succès pour l'assistant
      AssistantMapper.recordSuccess(assistantId, responseTime);
      
      console.log(`chat-openai-stream: success { runId: "${runId}", contentLength: ${pollingResult.messageContent.length} }`);
      
      return new Response(JSON.stringify({
        content: pollingResult.messageContent,
        threadId: threadId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Enregistrer l'échec pour l'assistant
      AssistantMapper.recordFailure(assistantId);
      
      console.error(`chat-openai-stream: completion failed, generating fallback { status: "${pollingResult.status}", attempts: ${pollingResult.attempts}, hasContent: ${Boolean(pollingResult.messageContent)} }`);
      
      // Si ce n'est pas déjà le fallback, informer l'utilisateur
      if (assistantId !== "asst_ljWenYnbNEERVydsDaeVSHVl") {
        console.log(`chat-openai-stream: assistant ${selectedAgent} défaillant, utilisation du système de fallback`);
        
        // Message d'information pour l'utilisateur avec tentative de récupération automatique
        const fallbackMessage = `Je rencontre des difficultés avec l'assistant ${selectedAgent}. Le système va automatiquement utiliser un assistant de secours pour vos prochaines demandes. Pouvez-vous reformuler votre question ?`;
        
        return new Response(JSON.stringify({
          content: fallbackMessage,
          threadId: threadId,
          fallback: true,
          originalAgent: selectedAgent,
          diagnostics: AssistantMapper.getDiagnostics()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Réponse de fallback final
      return new Response(JSON.stringify({
        content: "Je rencontre des difficultés techniques temporaires. Veuillez réessayer dans quelques instants ou reformuler votre demande.",
        threadId: threadId,
        fallback: true,
        criticalFailure: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('chat-openai-stream: critical error:', error);
    
    // Gestion d'erreur ultra-robuste pour éviter l'erreur 500
    const criticalErrorResponse = `Je rencontre une difficulté technique inattendue. Votre demande a été enregistrée pour investigation. Pouvez-vous réessayer dans quelques instants ?`;
    
    return new Response(JSON.stringify({ 
      content: criticalErrorResponse,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      fallback: true
    }), {
      status: 200, // JAMAIS 500 - toujours retourner 200
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});