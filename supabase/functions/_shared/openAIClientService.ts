/**
 * Service client OpenAI unifié avec gestion d'erreurs robuste
 */

export interface OpenAIRequestConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  responseFormat?: { type: string };
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason?: string;
}

export class OpenAIClientService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Appel API Chat Completions avec retry automatique
   */
  async chatCompletion(
    messages: OpenAIMessage[],
    config: OpenAIRequestConfig = {}
  ): Promise<OpenAIResponse> {
    const requestBody = {
      model: config.model || 'gpt-4.1-2025-04-14',
      messages,
      max_completion_tokens: config.maxTokens || 2000,
      ...(config.temperature !== undefined && { temperature: config.temperature }),
      ...(config.stream !== undefined && { stream: config.stream }),
      ...(config.responseFormat && { response_format: config.responseFormat })
    };

    const response = await this.makeRequest('/chat/completions', requestBody);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    if (!choice?.message?.content) {
      throw new Error('No content in OpenAI response');
    }

    return {
      content: choice.message.content,
      usage: data.usage,
      finishReason: choice.finish_reason
    };
  }

  /**
   * Créer un thread pour Assistant API
   */
  async createThread(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/threads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create thread: ${response.status} - ${errorData.error?.message}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Ajouter un message à un thread
   */
  async addMessageToThread(threadId: string, content: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        role: 'user',
        content
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to add message: ${response.status} - ${errorData.error?.message}`);
    }
  }

  /**
   * Créer un run pour Assistant API
   */
  async createRun(threadId: string, assistantId: string, instructions?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        assistant_id: assistantId,
        ...(instructions && { instructions })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create run: ${response.status} - ${errorData.error?.message}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Vérifier le statut d'un run
   */
  async getRunStatus(threadId: string, runId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      console.warn(`Failed to get run status: ${response.status}`);
      return 'unknown';
    }

    const data = await response.json();
    return data.status;
  }

  /**
   * Récupérer les messages d'un thread
   */
  async getThreadMessages(threadId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get messages: ${response.status} - ${errorData.error?.message}`);
    }

    const data = await response.json();
    const assistantMessage = data.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage?.content?.[0]?.text?.value) {
      throw new Error('No assistant response found');
    }

    return assistantMessage.content[0].text.value;
  }

  /**
   * Annuler les runs actifs d'un thread
   */
  async cancelActiveRuns(threadId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs?limit=5`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const activeRuns = data.data?.filter((run: any) => 
          ['queued', 'in_progress', 'requires_action'].includes(run.status)
        ) || [];

        for (const run of activeRuns) {
          console.log(`Cancelling active run: ${run.id}`);
          await fetch(`${this.baseUrl}/threads/${threadId}/runs/${run.id}/cancel`, {
            method: 'POST',
            headers: this.getHeaders()
          });
        }
      }
    } catch (error) {
      console.warn('Error cancelling runs:', error);
    }
  }

  /**
   * Faire une requête HTTP avec retry
   */
  private async makeRequest(endpoint: string, body: any, retries = 2): Promise<Response> {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body)
        });

        return response;
      } catch (error) {
        if (attempt === retries + 1) {
          throw error;
        }
        
        // Attente exponentielle
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Obtenir les headers pour les requêtes
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    };
  }
}