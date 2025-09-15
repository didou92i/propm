import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

// Services refactorisés
import { OpenAIClientService } from '../_shared/openAIClientService.ts';
import { ResponseFormatterService } from '../_shared/responseFormatterService.ts';
import { PerformanceMonitoringService } from '../_shared/performanceMonitoringService.ts';
import { AuthValidationService } from '../_shared/authValidationService.ts';
import { ThreadManagementService } from '../_shared/threadManagementService.ts';
import { AssistantConfigService } from '../_shared/assistantConfigService.ts';
import { AdaptivePollingService } from '../_shared/adaptivePollingService.ts';

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialisation des clients
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Fonction principale de traitement du chat
 */
async function processChatRequest(
  requestData: any,
  authResult: any,
  startTime: number
): Promise<{ content: string; threadId: string; performanceMetrics: any }> {
  const { messages, selectedAgent, userSession, hasAttachments } = requestData;
  const userId = authResult.userId;
  
  // Validation des clés API
  const apiKeysCheck = AuthValidationService.validateRequiredApiKeys(['OPENAI_API_KEY']);
  if (!apiKeysCheck.isValid) {
    throw new Error(`Clés API manquantes: ${apiKeysCheck.missingKeys.join(', ')}`);
  }

  console.log(`🚀 Début traitement chat - User: ${userId}, Agent: ${selectedAgent}`);
  
  // Initialiser les services
  const openAIClient = new OpenAIClientService(Deno.env.get('OPENAI_API_KEY')!);
  const authService = new AuthValidationService(supabaseAdmin);
  const userSupabase = authService.createUserClient(`Bearer ${authResult.user.access_token || ''}`);
  const threadService = new ThreadManagementService(openAIClient, userSupabase);
  const pollingService = new AdaptivePollingService(openAIClient);

  // Obtenir ou créer le thread
  const threadInfo = await threadService.getOrCreateThread(userId, userSession, selectedAgent);
  console.log(`📋 Thread: ${threadInfo.threadId} (${threadInfo.isNew ? 'nouveau' : 'existant'})`);

  // Obtenir la configuration de l'assistant
  const assistantConfig = AssistantConfigService.getAssistantConfig(selectedAgent);
  console.log(`🤖 Assistant: ${assistantConfig.name} (${assistantConfig.id})`);

  // Extraire le dernier message utilisateur
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || latestMessage.role !== 'user') {
    throw new Error('Aucun message utilisateur trouvé');
  }

  // Stocker le message utilisateur
  await threadService.storeMessage(threadInfo.conversationId, 'user', latestMessage.content);

  // Ajouter le message au thread OpenAI
  await openAIClient.addMessageToThread(threadInfo.threadId, latestMessage.content);

  // Obtenir les instructions contextuelles
  const contextualInstructions = AssistantConfigService.getContextualInstructions(
    selectedAgent,
    latestMessage.content
  );

  // Créer le run avec retry automatique
  let runId: string;
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      runId = await openAIClient.createRun(
        threadInfo.threadId,
        assistantConfig.id,
        contextualInstructions
      );
      break;
    } catch (error) {
      attempts++;
      if (error.message?.includes('already has an active run')) {
        console.log(`⏳ Thread occupé, tentative ${attempts}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (attempts === maxRetries) {
        throw error;
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  if (!runId!) {
    throw new Error('Impossible de créer le run après plusieurs tentatives');
  }

  console.log(`⚡ Run créé: ${runId}`);

  // Polling adaptatif pour attendre la completion
  const pollingResult = await pollingService.pollWithRetry(threadInfo.threadId, runId);

  if (!pollingResult.success) {
    throw new Error(`Run non complété: ${pollingResult.error}`);
  }

  // Récupérer la réponse de l'assistant
  const assistantResponse = await openAIClient.getThreadMessages(threadInfo.threadId);

  // Stocker la réponse de l'assistant
  await threadService.storeMessage(threadInfo.conversationId, 'assistant', assistantResponse);

  // Nettoyage des anciens messages
  await threadService.cleanupOldMessages(threadInfo.conversationId);

  // Obtenir les statistiques de la conversation
  const conversationStats = await threadService.getConversationStats(threadInfo.conversationId);

  // Logger l'utilisation de l'API
  await authService.logApiUsage(
    userId,
    'chat-openai',
    { selectedAgent, messageLength: latestMessage.content.length },
    Date.now() - startTime
  );

  console.log(`✅ Chat traité avec succès en ${Date.now() - startTime}ms`);

  return {
    content: assistantResponse,
    threadId: threadInfo.threadId,
    performanceMetrics: {
      ...pollingResult,
      conversationStats,
      assistantUsed: assistantConfig.name
    }
  };
}

/**
 * Handler principal
 */
serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = PerformanceMonitoringService.startMonitoring('chat-openai');
  let sessionId: string | undefined;

  try {
    console.log('=== DÉBUT REQUÊTE CHAT-OPENAI ===');

    // Validation de l'authentification
    const authService = new AuthValidationService(supabaseAdmin);
    const authResult = await authService.validateAuth(
      req.headers.get('Authorization'),
      { requireAuth: true, checkRateLimit: true }
    );

    if (!authResult.success) {
      return ResponseFormatterService.createHttpResponse(
        ResponseFormatterService.error(authResult.error!, 'Authentification échouée'),
        200,
        corsHeaders
      );
    }

    // Validation des paramètres de requête
    const requestData = await req.json();
    const validation = AuthValidationService.validateRequestParams(
      requestData,
      ['messages', 'selectedAgent', 'userSession'],
      ['hasAttachments']
    );

    if (!validation.isValid) {
      return ResponseFormatterService.createHttpResponse(
        ResponseFormatterService.error(validation.error!, 'Paramètres invalides'),
        200,
        corsHeaders
      );
    }

    sessionId = validation.cleanedData!.userSession;

    // Traitement principal
    const result = await processChatRequest(
      validation.cleanedData!,
      authResult,
      startTime
    );

    // Enregistrer les métriques de succès
    const performanceMetrics = PerformanceMonitoringService.recordSuccess(
      'chat-openai',
      startTime,
      {
        assistantUsed: result.performanceMetrics.assistantUsed,
        messageCount: result.performanceMetrics.conversationStats.messageCount,
        pollingAttempts: result.performanceMetrics.attempts
      }
    );

    // Créer la réponse de succès
    const successResponse = ResponseFormatterService.addPerformanceMetrics(
      ResponseFormatterService.success(
        {
          content: result.content,
          threadId: result.threadId
        },
        {
          status: 'OK',
          serverSessionId: sessionId,
          assistantUsed: result.performanceMetrics.assistantUsed,
          conversationStats: result.performanceMetrics.conversationStats
        }
      ),
      startTime,
      {
        pollingTime: result.performanceMetrics.totalTime,
        pollingAttempts: result.performanceMetrics.attempts
      }
    );

    return ResponseFormatterService.createHttpResponse(successResponse, 200, corsHeaders);

  } catch (error) {
    console.error('❌ ERREUR CHAT-OPENAI:', error);

    // Enregistrer les métriques d'erreur
    PerformanceMonitoringService.recordError('chat-openai', startTime, error, {
      sessionId,
      errorType: error.constructor.name
    });

    // Créer une réponse d'erreur avec fallback si nécessaire
    const errorResponse = ResponseFormatterService.addPerformanceMetrics(
      ResponseFormatterService.error(
        error.message || 'Erreur inattendue lors du traitement du chat',
        error.stack || 'Pas de stack trace disponible',
        {
          errorType: error.constructor.name,
          ...(sessionId && { serverSessionId: sessionId })
        }
      ),
      startTime
    );

    return ResponseFormatterService.createHttpResponse(errorResponse, 200, corsHeaders);
  }
});