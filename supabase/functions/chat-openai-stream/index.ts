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

    const { messages, selectedAgent, userSession, enrichedContent } = await req.json();
    const lastMessage = messages[messages.length - 1];
    
    // Use enriched content (with attachments) if provided, otherwise use original message
    const messageContent = enrichedContent || lastMessage.content;
    
    console.log('📨 Sending to OpenAI:', {
      contentLength: messageContent.length,
      hasAttachments: lastMessage.attachments?.length > 0,
      hasEnrichment: !!enrichedContent,
      enrichedContentSample: messageContent.substring(0, 200)
    });
    
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

    // Add user message to thread (with enriched content including attachments)
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: messageContent
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

    console.log(`chat-openai-stream: using dynamic config for ${selectedAgent}`, {
      assistantId,
      maxAttempts: optimizedConfig.maxAttempts,
      globalTimeout: optimizedConfig.globalTimeout,
      isSSE: isStreamingRequest,
      source: 'AssistantMapper.getOptimizedConfig'
    });
    
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
        globalTimeout: optimizedConfig.globalTimeout,
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
      
      // Si ce n'est pas déjà le fallback, utiliser une completion directe
      if (assistantId !== "asst_ljWenYnbNEERVydsDaeVSHVl") {
        console.log(`chat-openai-stream: assistant ${selectedAgent} timeout, using direct GPT completion`);
        
        try {
          // Appel direct GPT-4o-mini pour réponse rapide
          const directResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-5-2025-08-07', // GPT-5 pour fallback timeout
              messages: [
                { 
                  role: 'system', 
                  content: `Tu es ${selectedAgent}, assistant spécialisé en rédaction juridique et administrative. Réponds de manière concise et professionnelle en français.` 
                },
                { role: 'user', content: messageContent }
              ],
              reasoning: { effort: 'medium' }, // ✅ Syntaxe correcte GPT-5
              text: { verbosity: 'medium' },   // ✅ Réponses équilibrées
              max_completion_tokens: 1500
            })
          });
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            const fallbackContent = directData.choices[0].message.content;
            
            return new Response(JSON.stringify({
              content: `⚠️ **Mode performance optimisé activé**\n\n${fallbackContent}\n\n_Note : Pour des analyses plus approfondies, veuillez réessayer dans quelques instants._`,
              threadId: threadId,
              fallback: true,
              originalAgent: selectedAgent
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (fallbackError) {
          console.error('Direct completion failed:', fallbackError);
        }
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