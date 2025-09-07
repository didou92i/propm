import { useState, useEffect, useCallback } from 'react';
import { assistantConfigService, AssistantConfig } from '@/services/assistantConfigService';
import { useAuth } from '@/hooks/useAuth';

export interface UseAssistantConfigResult {
  configurations: AssistantConfig[];
  isLoading: boolean;
  error: string | null;
  hasConfigurations: boolean;
  refreshConfigurations: () => Promise<void>;
  getConfigForAgent: (agentId: string) => AssistantConfig | null;
  lastUpdated: string | null;
}

/**
 * Hook pour gérer les configurations d'Assistants OpenAI
 */
export function useAssistantConfig(): UseAssistantConfigResult {
  const [configurations, setConfigurations] = useState<AssistantConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { user } = useAuth();

  // Charger les configurations au montage du composant
  useEffect(() => {
    if (user) {
      loadConfigurations();
    }
  }, [user]);

  const loadConfigurations = useCallback(async (forceRefresh: boolean = false) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const configs = await assistantConfigService.getConfigurations(forceRefresh);
      setConfigurations(configs);
      
      if (configs.length > 0) {
        setLastUpdated(configs[0].retrievedAt);
        console.log('useAssistantConfig: loaded configurations', {
          count: configs.length,
          agents: configs.map(c => c.agentId)
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des configurations';
      setError(errorMessage);
      console.error('useAssistantConfig: error loading configurations', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshConfigurations = useCallback(async () => {
    await loadConfigurations(true);
  }, [loadConfigurations]);

  const getConfigForAgent = useCallback((agentId: string): AssistantConfig | null => {
    return configurations.find(config => config.agentId === agentId) || null;
  }, [configurations]);

  return {
    configurations,
    isLoading,
    error,
    hasConfigurations: configurations.length > 0,
    refreshConfigurations,
    getConfigForAgent,
    lastUpdated
  };
}