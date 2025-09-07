import { supabase } from '@/integrations/supabase/client';

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

export interface CachedConfigs {
  configurations: AssistantConfig[];
  lastUpdated: string;
  isExpired: boolean;
}

class AssistantConfigService {
  private cache: Map<string, AssistantConfig> = new Map();
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 heures
  private lastFetch: number = 0;

  /**
   * Récupère les configurations d'Assistants, en utilisant le cache si disponible
   */
  async getConfigurations(forceRefresh: boolean = false): Promise<AssistantConfig[]> {
    const now = Date.now();
    const isExpired = (now - this.lastFetch) > this.cacheExpiry;

    // Utiliser le cache si valide et pas de force refresh
    if (!forceRefresh && !isExpired && this.cache.size > 0) {
      console.log('assistantConfigService: using cached configurations');
      return Array.from(this.cache.values());
    }

    try {
      console.log('assistantConfigService: fetching fresh configurations');
      
      // Appeler la fonction edge pour récupérer les configs
      const { data, error } = await supabase.functions.invoke('fetch-assistant-config', {
        method: 'GET'
      });

      if (error) {
        console.error('assistantConfigService: fetch error', error);
        // Retourner le cache même expiré si erreur
        return Array.from(this.cache.values());
      }

      if (data?.success && data.configurations) {
        // Mettre à jour le cache
        this.cache.clear();
        data.configurations.forEach((config: AssistantConfig) => {
          this.cache.set(config.agentId, config);
        });
        this.lastFetch = now;

        console.log('assistantConfigService: cached new configurations', {
          count: data.configurations.length,
          agents: data.configurations.map((c: AssistantConfig) => c.agentId)
        });

        return data.configurations;
      }

      // Si pas de nouvelles configs, retourner le cache existant
      return Array.from(this.cache.values());

    } catch (error) {
      console.error('assistantConfigService: error fetching configurations', error);
      // Retourner le cache existant en cas d'erreur
      return Array.from(this.cache.values());
    }
  }

  /**
   * Récupère la configuration pour un agent spécifique
   */
  async getConfigForAgent(agentId: string): Promise<AssistantConfig | null> {
    const configs = await this.getConfigurations();
    return configs.find(config => config.agentId === agentId) || null;
  }

  /**
   * Vérifie si on a des configurations en cache
   */
  hasConfigurations(): boolean {
    return this.cache.size > 0;
  }

  /**
   * Force le rechargement des configurations
   */
  async refreshConfigurations(): Promise<AssistantConfig[]> {
    return this.getConfigurations(true);
  }

  /**
   * Récupère les configurations depuis le cache local uniquement
   */
  getCachedConfigurations(): AssistantConfig[] {
    return Array.from(this.cache.values());
  }

  /**
   * Clear le cache (utile pour les tests ou le reset)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}

// Instance singleton
export const assistantConfigService = new AssistantConfigService();