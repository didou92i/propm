import { useState, useCallback } from 'react';
import { hierarchicalEmbeddingService, SearchResult } from '@/services/hierarchicalEmbeddings';

interface HierarchicalSearchOptions {
  maxResults?: number;
  threshold?: number;
  weights?: {
    title: number;
    paragraph: number;
    document: number;
  };
  enableCache?: boolean;
}

export const useHierarchicalSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const hierarchicalSearch = useCallback(async (
    query: string,
    options: HierarchicalSearchOptions = {}
  ): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    try {
      const results = await hierarchicalEmbeddingService.hierarchicalSearch(
        query,
        {
          maxResults: options.maxResults || 10,
          threshold: options.threshold || 0.3,
          weights: options.weights || { title: 0.4, paragraph: 0.4, document: 0.2 }
        }
      );

      setSearchResults(results);
      
      // Update search history
      setSearchHistory(prev => {
        const updated = [query, ...prev.filter(h => h !== query)];
        return updated.slice(0, 10);
      });

      // Update cache stats if enabled
      if (options.enableCache) {
        setCacheStats(hierarchicalEmbeddingService.getCacheStats());
      }

      return results;
    } catch (error) {
      console.error('Hierarchical search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const contextualSearch = useCallback(async (
    conversationHistory: string[],
    currentQuery: string,
    maxResults: number = 5
  ): Promise<SearchResult[]> => {
    setIsSearching(true);
    try {
      const results = await hierarchicalEmbeddingService.getContextualRecommendations(
        conversationHistory,
        currentQuery,
        maxResults
      );

      return results;
    } catch (error) {
      console.error('Contextual search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchAtLevel = useCallback(async (
    query: string,
    level: 'title' | 'paragraph' | 'document',
    maxResults: number = 10
  ): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    try {
      // Use appropriate weights for the specific level
      const weights = {
        title: level === 'title' ? 1.0 : 0.0,
        paragraph: level === 'paragraph' ? 1.0 : 0.0,
        document: level === 'document' ? 1.0 : 0.0
      };

      const results = await hierarchicalEmbeddingService.hierarchicalSearch(
        query,
        { maxResults, weights }
      );

      return results;
    } catch (error) {
      console.error('Level-specific search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const clearCache = useCallback(() => {
    hierarchicalEmbeddingService.clearCache();
    setCacheStats(hierarchicalEmbeddingService.getCacheStats());
  }, []);

  const getCacheStatistics = useCallback(() => {
    const stats = hierarchicalEmbeddingService.getCacheStats();
    setCacheStats(stats);
    return stats;
  }, []);

  return {
    // Search functions
    hierarchicalSearch,
    contextualSearch,
    searchAtLevel,
    
    // State
    isSearching,
    searchResults,
    searchHistory,
    cacheStats,
    
    // Actions
    clearSearchResults,
    clearCache,
    getCacheStatistics
  };
};