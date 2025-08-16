import { useState, useCallback, useRef, useEffect } from 'react';
import { useOptimizedCache } from '@/hooks/useOptimizedCache';
import { compressedStorage } from '@/services/compressedStorage';
import { logger } from '@/utils/logger';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevance: number;
  category: string;
}

interface IncrementalSearchOptions {
  minQueryLength: number;
  debounceMs: number;
  maxResults: number;
  enableCache: boolean;
  enablePrefetch: boolean;
}

/**
 * Hook pour la recherche incrémentale optimisée avec cache et préchargement
 */
export function useIncrementalSearch(options: IncrementalSearchOptions = {
  minQueryLength: 2,
  debounceMs: 300,
  maxResults: 10,
  enableCache: true,
  enablePrefetch: true
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());
  const prefetchRef = useRef<Set<string>>(new Set());
  
  const { useSearchCache, prefetchData } = useOptimizedCache();

  // Fonction de recherche optimisée avec cache multi-niveau
  const performSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    // Cache en mémoire (niveau 1)
    if (cacheRef.current.has(searchQuery)) {
      return cacheRef.current.get(searchQuery)!;
    }

    // Cache compressé (niveau 2)
    if (options.enableCache) {
      const cached = compressedStorage.getItem<SearchResult[]>(`search_${searchQuery}`, null);
      if (cached) {
        cacheRef.current.set(searchQuery, cached);
        return cached;
      }
    }

    // Recherche réelle (niveau 3)
    try {
      setIsSearching(true);
      
      // Simulation d'une recherche sémantique avancée
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: `Résultat pour "${searchQuery}"`,
          content: `Contenu pertinent pour la recherche "${searchQuery}"`,
          relevance: 0.95,
          category: 'document'
        },
        {
          id: '2',
          title: `Information sur ${searchQuery}`,
          content: `Données détaillées concernant ${searchQuery}`,
          relevance: 0.87,
          category: 'legal'
        }
      ].slice(0, options.maxResults);

      // Met en cache les résultats
      cacheRef.current.set(searchQuery, mockResults);
      if (options.enableCache) {
        compressedStorage.setItem(`search_${searchQuery}`, mockResults);
      }

      return mockResults;
    } catch (error) {
      logger.error('Erreur lors de la recherche', error, 'useIncrementalSearch');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [options.maxResults, options.enableCache]);

  // Recherche incrémentale avec debounce
  const incrementalSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length < options.minQueryLength) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const searchResults = await performSearch(searchQuery);
      setResults(searchResults);
      
      // Génère des suggestions basées sur les résultats
      const newSuggestions = searchResults
        .map(result => result.title)
        .filter(title => title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5);
      setSuggestions(newSuggestions);

      // Précharge les résultats connexes
      if (options.enablePrefetch) {
        prefetchRelatedQueries(searchQuery);
      }
    }, options.debounceMs);
  }, [performSearch, options.minQueryLength, options.debounceMs, options.enablePrefetch]);

  // Préchargement intelligent des requêtes connexes
  const prefetchRelatedQueries = useCallback(async (baseQuery: string) => {
    const relatedQueries = [
      `${baseQuery} définition`,
      `${baseQuery} exemple`,
      `${baseQuery} réglementation`,
      baseQuery.slice(0, -1), // Version raccourcie
      `${baseQuery}s` // Version plurielle
    ].filter(q => q.length >= options.minQueryLength && !prefetchRef.current.has(q));

    relatedQueries.forEach(relatedQuery => {
      prefetchRef.current.add(relatedQuery);
      // Précharge en arrière-plan sans attendre
      performSearch(relatedQuery).catch(() => {
        // Ignore les erreurs de préchargement
      });
    });
  }, [performSearch, options.minQueryLength]);

  // Recherche instantanée (sans debounce)
  const instantSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < options.minQueryLength) {
      return [];
    }
    return await performSearch(searchQuery);
  }, [performSearch, options.minQueryLength]);

  // Suggestions auto-complétées
  const getAutocompleteSuggestions = useCallback((partial: string): string[] => {
    if (partial.length < 2) return [];
    
    // Utilise les suggestions en cache
    const allSuggestions = Array.from(cacheRef.current.keys())
      .filter(key => key.toLowerCase().startsWith(partial.toLowerCase()))
      .slice(0, 8);
    
    return allSuggestions;
  }, []);

  // Efface le cache
  const clearSearchCache = useCallback(() => {
    cacheRef.current.clear();
    prefetchRef.current.clear();
    compressedStorage.removeItem('search_cache');
  }, []);

  // Statistiques de performance
  const getSearchStats = useCallback(() => {
    return {
      cacheSize: cacheRef.current.size,
      prefetchedQueries: prefetchRef.current.size,
      compressionStats: compressedStorage.getCompressionStats()
    };
  }, []);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    suggestions,
    isSearching,
    incrementalSearch,
    instantSearch,
    getAutocompleteSuggestions,
    clearSearchCache,
    getSearchStats
  };
}