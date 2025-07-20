
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
  relevanceScore: number;
}

interface SearchOptions {
  threshold?: number;
  maxResults?: number;
  includeMetadata?: boolean;
  boostTitles?: boolean;
}

export const useSemanticSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const generateEmbedding = async (query: string): Promise<number[]> => {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text: query }
    });

    if (error) throw error;
    return data.embedding;
  };

  const semanticSearch = useCallback(async (
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    try {
      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);

      // Search for similar documents using the existing function
      const { data: results } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: options.maxResults || 10,
        filter: options.boostTitles ? { boost_titles: true } : {}
      });

      if (results) {
        // Enhanced scoring with multiple factors
        const enhancedResults: SearchResult[] = results
          .filter((result: any) => result.similarity >= (options.threshold || 0.3))
          .map((result: any) => ({
            id: result.id,
            content: result.content,
            metadata: result.metadata,
            similarity: result.similarity,
            relevanceScore: calculateRelevanceScore(result, query, options)
          }));

        // Sort by relevance score
        enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

        setSearchResults(enhancedResults);
        
        // Add to search history
        setSearchHistory(prev => {
          const updated = [query, ...prev.filter(h => h !== query)];
          return updated.slice(0, 10); // Keep last 10 searches
        });

        return enhancedResults;
      }

      return [];
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const calculateRelevanceScore = (result: any, query: string, options: SearchOptions): number => {
    let score = result.similarity;

    // Boost if query terms appear in filename
    const filename = result.metadata?.filename?.toLowerCase() || '';
    const queryTerms = query.toLowerCase().split(' ');
    const filenameBoost = queryTerms.some(term => filename.includes(term)) ? 0.2 : 0;

    // Boost recent documents
    const processedAt = new Date(result.metadata?.processed_at || 0);
    const daysSinceProcessed = (Date.now() - processedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, (30 - daysSinceProcessed) / 30) * 0.1;

    // Boost based on content length (longer content might be more comprehensive)
    const contentLength = result.content?.length || 0;
    const lengthBoost = Math.min(contentLength / 5000, 1) * 0.1;

    return Math.min(score + filenameBoost + recencyBoost + lengthBoost, 1);
  };

  const getSuggestions = useCallback(async (partialQuery: string): Promise<string[]> => {
    if (partialQuery.length < 2) return [];

    // Generate suggestions based on search history and document metadata
    const suggestions = searchHistory
      .filter(term => term.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, 3);

    // Add common search patterns
    const commonPatterns = [
      'rapport de police',
      'procès-verbal',
      'arrêté municipal',
      'note de service',
      'réglementation',
      'contravention'
    ].filter(pattern => 
      pattern.toLowerCase().includes(partialQuery.toLowerCase()) &&
      !suggestions.includes(pattern)
    ).slice(0, 2);

    return [...suggestions, ...commonPatterns];
  }, [searchHistory]);

  const findSimilarDocuments = useCallback(async (documentId: string): Promise<SearchResult[]> => {
    try {
      const { data: document } = await supabase
        .from('documents')
        .select('embedding, content')
        .eq('id', documentId)
        .single();

      if (!document?.embedding) return [];

      const { data: similar } = await supabase.rpc('match_documents', {
        query_embedding: document.embedding,
        match_count: 5,
        filter: { exclude_id: documentId }
      });

      if (similar) {
        return similar.map((result: any) => ({
          id: result.id,
          content: result.content,
          metadata: result.metadata,
          similarity: result.similarity,
          relevanceScore: result.similarity
        }));
      }

      return [];
    } catch (error) {
      console.error('Error finding similar documents:', error);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    semanticSearch,
    getSuggestions,
    findSimilarDocuments,
    clearSearch,
    searchResults,
    searchHistory,
    isSearching
  };
};
