/**
 * Service de gestion des configurations d'agents
 */

export interface AgentConfig {
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature?: number;
}

export interface AssistantConfig {
  agentId: string;
  assistantId: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature?: number;
  maxTokens: number;
  retrievedAt: string;
}

export class AgentConfigService {
  private static readonly FALLBACK_CONFIGS: Record<string, AgentConfig> = {
    redacpro: {
      model: 'gpt-5-mini-2025-08-07',
      systemPrompt: `Tu es RedacPro, un assistant expert en rédaction professionnelle française. Tu maîtrises parfaitement :
- La rédaction administrative et professionnelle
- Les règles de français et de style
- La structuration de documents
- L'adaptation du ton selon le contexte

Réponds de manière claire, structurée et professionnelle en français.`,
      maxTokens: 3000,
      temperature: 0.7
    },
    
    cdspro: {
      model: 'gpt-5-mini-2025-08-07',
      systemPrompt: `Tu es CDSPro, un assistant spécialisé dans les concours de la fonction publique française, notamment :
- Le Centre de Gestion (CDG)
- Les épreuves de rédaction administrative
- Les connaissances institutionnelles
- La méthodologie des concours

Réponds avec expertise et pédagogie en français, en structurant tes réponses de façon claire.`,
      maxTokens: 3000,
      temperature: 0.6
    },
    
    prepacds: {
      model: 'gpt-5-mini-2025-08-07',
      systemPrompt: `Tu es PrépaCD, un formateur expert pour la préparation au concours de Contrôleur des Douanes. Tu maîtrises :
- Le programme officiel du concours
- Les épreuves écrites et orales
- La méthodologie de préparation
- Les connaissances douanières et fiscales

Réponds de façon pédagogique et structurée, adapte tes explications au niveau du candidat.`,
      maxTokens: 3000,
      temperature: 0.6
    },
    
    arrete: {
      model: 'gpt-5-2025-08-07',
      systemPrompt: `Tu es un expert en rédaction d'arrêtés administratifs français. Tu maîtrises parfaitement :
- La structure réglementaire des arrêtés
- Le vocabulaire juridique approprié
- Les références légales et réglementaires
- Les formules de politesse officielles

Produis des arrêtés conformes aux standards administratifs français, structurés et précis.`,
      maxTokens: 4000
    }
  };

  static getConfig(selectedAgent: string): AgentConfig {
    return this.FALLBACK_CONFIGS[selectedAgent] || this.FALLBACK_CONFIGS.redacpro;
  }

  static async getDynamicConfig(
    supabaseAdmin: any, 
    userId: string, 
    agentId: string
  ): Promise<AgentConfig | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('assistant_configs, configs_updated_at')
        .eq('user_id', userId)
        .single();

      if (error || !data?.assistant_configs) {
        return null;
      }

      const configs: AssistantConfig[] = data.assistant_configs;
      const configAge = new Date().getTime() - new Date(data.configs_updated_at).getTime();
      const isExpired = configAge > (24 * 60 * 60 * 1000); // 24 heures

      if (isExpired) {
        return null;
      }

      const config = configs.find(c => c.agentId === agentId);
      if (!config) {
        return null;
      }

      return {
        model: config.model,
        systemPrompt: config.systemPrompt,
        maxTokens: config.maxTokens,
        temperature: config.temperature
      };

    } catch (error) {
      console.error('Error retrieving dynamic agent config:', error);
      return null;
    }
  }

  static formatConversationMessages(messages: any[], systemPrompt: string) {
    return [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];
  }

  static buildOpenAIRequestBody(config: AgentConfig, messages: any[]): any {
    const requestBody: any = {
      model: config.model,
      messages,
      stream: true,
      stream_options: {
        include_usage: true
      }
    };

    // Add appropriate token limit parameter based on model
    if (config.model.startsWith('gpt-5') || config.model.startsWith('o3') || config.model.startsWith('o4')) {
      requestBody.max_completion_tokens = config.maxTokens;
      // Don't include temperature for newer models (not supported)
    } else {
      requestBody.max_tokens = config.maxTokens;
      if (config.temperature !== undefined) {
        requestBody.temperature = config.temperature;
      }
    }

    return requestBody;
  }
}