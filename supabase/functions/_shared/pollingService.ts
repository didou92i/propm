/**
 * Service de polling optimisé pour OpenAI
 * Extraction sécurisée de la logique de polling depuis chat-openai-stream
 */

interface PollConfig {
  openAIApiKey: string;
  threadId: string;
  runId: string;
  maxAttempts?: number;
  isSSE?: boolean;
}

interface PollResult {
  status: 'completed' | 'failed' | 'timeout';
  content?: string;
  attempts: number;
  elapsedTime: number;
}

export class PollingService {
  static async pollForCompletion(config: PollConfig): Promise<PollResult> {
    const { openAIApiKey, threadId, runId, maxAttempts = 60, isSSE = false } = config;
    
    let runStatus = 'queued';
    let attempts = 0;
    const startTime = Date.now();
    
    // Intervalles adaptatifs - plus agressifs pour SSE
    const getInterval = (attempt: number): number => {
      if (isSSE) {
        return attempt < 2 ? 10 : 
               attempt < 5 ? 20 :
               attempt < 12 ? 35 :
               attempt < 25 ? 60 :
               attempt < 45 ? 120 : 200;
      } else {
        return attempt < 2 ? 15 :
               attempt < 5 ? 25 :
               attempt < 12 ? 40 :
               attempt < 25 ? 75 :
               attempt < 40 ? 150 : 250;
      }
    };

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
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

          // Gestion des actions requises avec logging renforcé
          if (runStatus === 'requires_action') {
            console.log('polling-service: handling requires_action', { runId, attempts });
            await this.submitToolOutputs(openAIApiKey, threadId, runId);
            // Attendre un peu après soumission des tool outputs
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (error) {
        console.error('polling-service: error', { runId, attempts, error: error.message });
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
        console.log('polling-service: completed', { runId, contentLength: content?.length || 0 });
      } catch (error) {
        console.error('polling-service: failed to get content', { runId, error: error.message });
        result.status = 'failed';
      }
    }

    return result;
  }

  private static async submitToolOutputs(openAIApiKey: string, threadId: string, runId: string): Promise<void> {
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
          return;
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

        console.log('polling-service: tool outputs submitted', { runId, outputsCount: toolOutputs.length });
      }
    } catch (error) {
      console.error('polling-service: error submitting tool outputs', { runId, error: error.message });
    }
  }

  private static async getAssistantMessage(openAIApiKey: string, threadId: string, runId: string): Promise<string> {
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
      return assistantMessage?.content[0]?.text?.value || 'Aucune réponse générée.';
    }
    
    throw new Error('Failed to retrieve assistant message');
  }
}