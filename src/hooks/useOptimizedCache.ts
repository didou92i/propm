import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compressedStorage } from '@/services/compressedStorage';
import { logger } from '@/utils/logger';
import type { ConversationData } from '@/types/performance';
import type { Message } from '@/types/chat';

interface CacheOptions {
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
  useCompression?: boolean;
}

/**
 * Hook optimisé pour la gestion du cache avec React Query et compression
 */
export function useOptimizedCache() {
  const queryClient = useQueryClient();

  // Cache optimisé avec compression pour les conversations
  const useConversationCache = (agentId: string, options: CacheOptions = {}) => {
    return useQuery({
      queryKey: ['conversation', agentId],
      queryFn: () => {
        const data = compressedStorage.getItem(`conversation_${agentId}`, []);
        return data;
      },
      staleTime: options.staleTime || 10 * 60 * 1000, // 10 minutes
      gcTime: options.gcTime || 30 * 60 * 1000, // 30 minutes
      enabled: options.enabled !== false,
    });
  };

  // Mutation optimisée pour sauvegarder les conversations
  const useConversationSave = (agentId: string) => {
    return useMutation({
      mutationFn: async (messages: Message[]) => {
        const success = compressedStorage.setItem(`conversation_${agentId}`, {
          messages,
          timestamp: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });
        
        if (!success) {
          throw new Error('Échec de la sauvegarde de la conversation');
        }
        
        return messages;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['conversation', agentId] });
      },
      onError: (error) => {
        logger.error('Erreur lors de la sauvegarde de la conversation', error, 'useOptimizedCache');
      }
    });
  };

  // Cache pour les recherches sémantiques
  const useSearchCache = (query: string, options: CacheOptions = {}) => {
    return useQuery({
      queryKey: ['search', query],
      queryFn: () => {
        // Implémentation de la recherche sémantique
        return compressedStorage.getItem(`search_${query}`, null);
      },
      staleTime: options.staleTime || 15 * 60 * 1000, // 15 minutes
      gcTime: options.gcTime || 60 * 60 * 1000, // 1 heure
      enabled: options.enabled !== false && query.length > 2,
    });
  };

  // Cache pour les documents
  const useDocumentCache = (documentId: string, options: CacheOptions = {}) => {
    return useQuery({
      queryKey: ['document', documentId],
      queryFn: () => {
        return compressedStorage.getItem(`document_${documentId}`, null);
      },
      staleTime: options.staleTime || 30 * 60 * 1000, // 30 minutes
      gcTime: options.gcTime || 2 * 60 * 60 * 1000, // 2 heures
      enabled: options.enabled !== false,
    });
  };

  // Préchargement intelligent
  const prefetchData = async (keys: string[], prefetchFn: (key: string) => Promise<unknown>) => {
    const promises = keys.map(async (key) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: [key],
          queryFn: () => prefetchFn(key),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } catch (error) {
        logger.warn(`Échec du préchargement pour ${key}`, error, 'useOptimizedCache');
      }
    });

    await Promise.allSettled(promises);
  };

  // Nettoyage du cache
  const clearCache = (pattern?: string) => {
    if (pattern) {
      queryClient.removeQueries({ queryKey: [pattern] });
    } else {
      queryClient.clear();
    }
    
    // Optimise également le stockage compressé
    compressedStorage.optimize();
  };

  // Statistiques du cache
  const getCacheStats = () => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    const storageStats = compressedStorage.getCompressionStats();
    
    return {
      queries: queryCache.getAll().length,
      mutations: mutationCache.getAll().length,
      storage: storageStats,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    };
  };

  return {
    useConversationCache,
    useConversationSave,
    useSearchCache,
    useDocumentCache,
    prefetchData,
    clearCache,
    getCacheStats,
    queryClient
  };
}