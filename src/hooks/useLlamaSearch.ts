import { useState, useCallback, useEffect } from 'react';
import { llamaIndexService, LlamaSearchResult, LlamaSearchOptions } from '@/services/llamaIndexService';

interface UseLlamaSearchOptions {
  autoInitialize?: boolean;
  enableCache?: boolean;
  defaultOptions?: LlamaSearchOptions;
}

export const useLlamaSearch = (options: UseLlamaSearchOptions = {}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [searchResults, setSearchResults] = useState<LlamaSearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [indexStats, setIndexStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    autoInitialize = true,
    enableCache = true,
    defaultOptions = {}
  } = options;

  // Initialize on mount if autoInitialize is true
  useEffect(() => {
    if (autoInitialize) {
      initializeIndex();
    }
  }, [autoInitialize]);

  /**
   * Initialize LlamaIndex service
   */
  const initializeIndex = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      await llamaIndexService.initialize();
      setIndexStats(llamaIndexService.getIndexStats());
    } catch (error) {
      console.error('Failed to initialize LlamaIndex:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize search index');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /**
   * Perform enhanced semantic search
   */
  const search = useCallback(async (
    query: string,
    searchOptions: LlamaSearchOptions = {}
  ): Promise<LlamaSearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    setError(null);

    try {
      const mergedOptions = { ...defaultOptions, ...searchOptions };
      const results = await llamaIndexService.search(query, mergedOptions);

      setSearchResults(results);

      // Update search history
      setSearchHistory(prev => {
        const updated = [query, ...prev.filter(h => h !== query)];
        return updated.slice(0, 15); // Keep last 15 searches
      });

      return results;
    } catch (error) {
      console.error('LlamaIndex search error:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [defaultOptions]);

  /**
   * Police-specific smart search with query routing
   */
  const policeSearch = useCallback(async (query: string): Promise<LlamaSearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    setError(null);

    try {
      const results = await llamaIndexService.policeQueryRouter(query);
      setSearchResults(results);

      setSearchHistory(prev => {
        const updated = [query, ...prev.filter(h => h !== query)];
        return updated.slice(0, 15);
      });

      return results;
    } catch (error) {
      console.error('Police search error:', error);
      setError(error instanceof Error ? error.message : 'Police search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Contextual search using conversation history
   */
  const contextualSearch = useCallback(async (
    query: string,
    conversationHistory: string[],
    maxResults: number = 5
  ): Promise<LlamaSearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    setError(null);

    try {
      const results = await llamaIndexService.contextualSearch(
        query,
        conversationHistory,
        maxResults
      );

      return results;
    } catch (error) {
      console.error('Contextual search error:', error);
      setError(error instanceof Error ? error.message : 'Contextual search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Hierarchical search at specific levels
   */
  const hierarchicalSearch = useCallback(async (
    query: string,
    level: 'document' | 'paragraph' | 'sentence' = 'paragraph',
    maxResults: number = 10
  ): Promise<LlamaSearchResult[]> => {
    const searchOptions: LlamaSearchOptions = {
      retrievalStrategy: 'hierarchical',
      maxResults,
      responseMode: level === 'document' ? 'tree_summarize' : 'compact'
    };

    return search(query, searchOptions);
  }, [search]);

  /**
   * Auto-merging search for comprehensive results
   */
  const autoMergingSearch = useCallback(async (
    query: string,
    maxResults: number = 8
  ): Promise<LlamaSearchResult[]> => {
    const searchOptions: LlamaSearchOptions = {
      retrievalStrategy: 'auto_merging',
      maxResults,
      responseMode: 'compact'
    };

    return search(query, searchOptions);
  }, [search]);

  /**
   * Add new document to the index
   */
  const addDocument = useCallback(async (content: string, metadata: any): Promise<void> => {
    try {
      await llamaIndexService.addDocument(content, metadata);
      setIndexStats(llamaIndexService.getIndexStats());
    } catch (error) {
      console.error('Failed to add document:', error);
      setError(error instanceof Error ? error.message : 'Failed to add document');
      throw error;
    }
  }, []);

  /**
   * Rebuild the entire index
   */
  const rebuildIndex = useCallback(async (): Promise<void> => {
    setIsInitializing(true);
    setError(null);

    try {
      await llamaIndexService.rebuildIndex();
      setIndexStats(llamaIndexService.getIndexStats());
      setSearchResults([]); // Clear current results
    } catch (error) {
      console.error('Failed to rebuild index:', error);
      setError(error instanceof Error ? error.message : 'Failed to rebuild index');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /**
   * Clear search results and cache
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    if (enableCache) {
      llamaIndexService.clearCache();
    }
  }, [enableCache]);

  /**
   * Get cache and index statistics
   */
  const getStats = useCallback(() => {
    const indexStats = llamaIndexService.getIndexStats();
    const cacheStats = llamaIndexService.getCacheStats();

    return {
      index: indexStats,
      cache: cacheStats,
      searchHistorySize: searchHistory.length
    };
  }, [searchHistory.length]);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    // Core search functions
    search,
    policeSearch,
    contextualSearch,
    hierarchicalSearch,
    autoMergingSearch,

    // Index management
    initializeIndex,
    addDocument,
    rebuildIndex,

    // State
    isSearching,
    isInitializing,
    searchResults,
    searchHistory,
    indexStats,
    error,

    // Actions
    clearSearch,
    clearHistory,
    getStats
  };
};