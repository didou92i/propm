/**
 * Service de polling optimisé pour OpenAI
 * Extraction sécurisée de la logique de polling depuis chat-openai-stream
 */

interface PollConfig {
  openAIApiKey: string;
  threadId: string;
  runId: string;
  maxAttempts?: number;
  globalTimeout?: number;
  maxRequiresActionAttempts?: number;
  isSSE?: boolean;
}

interface PollResult {
  status: 'completed' | 'failed' | 'timeout';
  content?: string;
  messageContent?: string;
  attempts: number;
  elapsedTime: number;
}

export class PollingService {
  static async pollForCompletion(config: PollConfig): Promise<PollResult> {
    const { openAIApiKey, threadId, runId, maxAttempts = 20, globalTimeout, maxRequiresActionAttempts, isSSE = false } = config;
    
    let runStatus = 'queued';
    let attempts = 0;
    let requiresActionAttempts = 0;
    const startTime = Date.now();
    const GLOBAL_TIMEOUT = globalTimeout || 15000; // 15 secondes par défaut
    const MAX_REQUIRES_ACTION_ATTEMPTS = maxRequiresActionAttempts || 3; // Maximum 3 tentatives pour requires_action
    
    // Intervalles optimisés et plus agressifs
    const getInterval = (attempt: number): number => {
      if (isSSE) {
        return attempt < 2 ? 10 : 
               attempt < 5 ? 15 :
               attempt < 10 ? 25 : 50;
      } else {
        return attempt < 2 ? 10 :
               attempt < 5 ? 20 :
               attempt < 10 ? 30 : 60;
      }
    };

    console.log('polling-service: starting with optimized config', { 
      runId, 
      maxAttempts, 
      globalTimeout: GLOBAL_TIMEOUT,
      maxRequiresActionAttempts: MAX_REQUIRES_ACTION_ATTEMPTS
    });

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      // Vérification du timeout global
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > GLOBAL_TIMEOUT) {
        console.error('polling-service: global timeout exceeded', { runId, elapsedTime, attempts });
        return {
          status: 'timeout',
          attempts,
          elapsedTime
        };
      }
      const pollInterval = getInterval(attempts);
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
          
          // Retry intelligent pour runs bloqués
          if (runStatus === 'in_progress' && attempts === Math.floor(maxAttempts / 2)) {
            console.warn(`polling-service: run stuck in_progress, restarting { runId: "${runId}", attempts: ${attempts} }`);
            
            try {
              await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openAIApiKey}`,
                  'OpenAI-Beta': 'assistants=v2'
                }
              });
              
              // Attendre 1 seconde puis reprendre
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (cancelError) {
              console.error('Failed to cancel stuck run:', cancelError);
            }
          }
          
          // Log de progression intelligent
          if (attempts % 5 === 0 || attempts < 5) {
            console.log('polling-service: status', {
              runId,
              runStatus,
              attempts,
              pollInterval,
              elapsedTime: Date.now() - startTime,
              estimatedCompletion: runStatus === 'in_progress' ? 
                `~${Math.round((Date.now() - startTime) * 1.5)}ms` : 'unknown'
            });
          }

          // Gestion critique des actions requises avec limite de tentatives
          if (runStatus === 'requires_action') {
            requiresActionAttempts++;
            console.log('polling-service: handling requires_action', { 
              runId, 
              attempts, 
              requiresActionAttempts,
              maxAllowed: MAX_REQUIRES_ACTION_ATTEMPTS 
            });
            
            // Limitation critique: éviter la boucle infinie de requires_action
            if (requiresActionAttempts > MAX_REQUIRES_ACTION_ATTEMPTS) {
              console.error('polling-service: max requires_action attempts exceeded', { 
                runId, 
                requiresActionAttempts,
                totalAttempts: attempts 
              });
              return {
                status: 'failed',
                attempts,
                elapsedTime: Date.now() - startTime
              };
            }
            
            const toolSubmissionSuccess = await this.submitToolOutputs(openAIApiKey, threadId, runId);
            if (!toolSubmissionSuccess) {
              console.error('polling-service: tool submission failed, aborting', { runId, attempts });
              return {
                status: 'failed',
                attempts,
                elapsedTime: Date.now() - startTime
              };
            }
            
            // Attendre et vérifier le changement de statut
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Vérification immédiate du nouveau statut après tool submission
            try {
              const verifyResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${openAIApiKey}`,
                  'OpenAI-Beta': 'assistants=v2'
                }
              });
              
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                const newStatus = verifyData.status;
                console.log('polling-service: status after tool submission', { 
                  runId, 
                  previousStatus: runStatus,
                  newStatus,
                  changed: newStatus !== runStatus
                });
                
                // Si le statut n'a pas changé après tool submission, c'est problématique
                if (newStatus === 'requires_action' && requiresActionAttempts >= 2) {
                  console.error('polling-service: status stuck in requires_action, force exit', { 
                    runId, 
                    requiresActionAttempts 
                  });
                  return {
                    status: 'failed',
                    attempts,
                    elapsedTime: Date.now() - startTime
                  };
                }
              }
            } catch (verifyError: any) {
              console.error('polling-service: error verifying status', { runId, error: verifyError?.message || verifyError });
            }
          }
        }
      } catch (error: any) {
        console.error('polling-service: error', { runId, attempts, error: error?.message || error });
      }
      
      attempts++;
    }

    const result: PollResult = {
      status: runStatus as 'completed' | 'failed' | 'timeout',
      attempts,
      elapsedTime: Date.now() - startTime
    };

    // Récupération du contenu si complété
    if (runStatus === 'completed') {
      try {
        const content = await this.getAssistantMessage(openAIApiKey, threadId, runId);
        result.content = content;
        result.messageContent = content;
        console.log('polling-service: completed', { runId, contentLength: content?.length || 0 });
      } catch (error: any) {
        console.error('polling-service: failed to get content', { runId, error: error?.message || error });
        result.status = 'failed';
      }
    }

    return result;
  }

  private static async submitToolOutputs(openAIApiKey: string, threadId: string, runId: string): Promise<boolean> {
    try {
      // Récupérer d'abord les détails du run pour voir les tool calls requis
      const runDetailsResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (runDetailsResponse.ok) {
        const runDetails = await runDetailsResponse.json();
        console.log('polling-service: tool calls required', { 
          runId, 
          toolCallsCount: runDetails.required_action?.submit_tool_outputs?.tool_calls?.length || 0 
        });

        // Si pas de tool calls requis, ne pas envoyer de tool outputs
        if (!runDetails.required_action?.submit_tool_outputs?.tool_calls) {
          console.log('polling-service: no tool calls required, skipping submission');
          return false;
        }

        // Soumettre des tool outputs vides pour chaque tool call requis (désactivation)
        const toolCalls = runDetails.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = toolCalls.map((toolCall: any) => ({
          tool_call_id: toolCall.id,
          output: "Tool calls are currently disabled for this assistant. Please provide the response directly."
        }));

        await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ tool_outputs: toolOutputs })
        });

        console.log('polling-service: tool outputs submitted successfully', { runId, outputsCount: toolOutputs.length });
        return true;
      } else {
        console.error('polling-service: failed to get run details for tool submission', { 
          runId, 
          status: runDetailsResponse.status 
        });
        return false;
      }
    } catch (error: any) {
      console.error('polling-service: critical error submitting tool outputs', { runId, error: error?.message || error });
      return false;
    }
  }

  static async getAssistantMessage(openAIApiKey: string, threadId: string, runId: string): Promise<string> {
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json();
      const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant' && msg.run_id === runId);
      return assistantMessage?.content[0]?.text?.value || 'Aucune réponse générée.';
    }
    
    throw new Error('Failed to retrieve assistant message');
  }
}