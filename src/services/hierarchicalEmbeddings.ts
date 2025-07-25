import { supabase } from '@/integrations/supabase/client';

export interface HierarchicalEmbedding {
  title: number[];
  paragraph: number[];
  document: number[];
  metadata: {
    level: 'title' | 'paragraph' | 'document';
    position: number;
    parent_id?: string;
  };
}

export interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
  queryHash: string;
  usageCount: number;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
  relevanceScore: number;
  level: 'title' | 'paragraph' | 'document';
  hierarchicalScores: {
    titleScore: number;
    paragraphScore: number;
    documentScore: number;
    fusedScore: number;
  };
}

class HierarchicalEmbeddingService {
  private cache = new Map<string, EmbeddingCache>();
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Generate embeddings at multiple levels for a document
   */
  async generateHierarchicalEmbeddings(
    title: string,
    content: string,
    chunkSize: number = 500
  ): Promise<HierarchicalEmbedding[]> {
    const embeddings: HierarchicalEmbedding[] = [];

    try {
      // Generate title embedding
      const titleEmbedding = await this.getCachedEmbedding(title);
      
      // Split content into paragraphs
      const paragraphs = this.splitIntoParagraphs(content, chunkSize);
      
      // Generate paragraph embeddings
      const paragraphEmbeddings = await Promise.all(
        paragraphs.map(async (paragraph, index) => {
          const embedding = await this.getCachedEmbedding(paragraph);
          return {
            title: titleEmbedding,
            paragraph: embedding,
            document: [], // Will be calculated later
            metadata: {
              level: 'paragraph' as const,
              position: index,
              parent_id: undefined
            }
          };
        })
      );

      // Generate document-level embedding (combination of title + content summary)
      const documentText = `${title}\n\n${this.summarizeContent(content)}`;
      const documentEmbedding = await this.getCachedEmbedding(documentText);

      // Update document embeddings in paragraph objects
      paragraphEmbeddings.forEach(pe => {
        pe.document = documentEmbedding;
      });

      embeddings.push(...paragraphEmbeddings);

      return embeddings;
    } catch (error) {
      console.error('Error generating hierarchical embeddings:', error);
      throw error;
    }
  }

  /**
   * Perform hierarchical search with score fusion
   */
  async hierarchicalSearch(
    query: string,
    options: {
      maxResults?: number;
      threshold?: number;
      weights?: {
        title: number;
        paragraph: number;
        document: number;
      };
    } = {}
  ): Promise<SearchResult[]> {
    const { 
      maxResults = 10, 
      threshold = 0.3,
      weights = { title: 0.4, paragraph: 0.4, document: 0.2 }
    } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await this.getCachedEmbedding(query);

      // Search at different levels
      const [titleResults, paragraphResults, documentResults] = await Promise.all([
        this.searchAtLevel(queryEmbedding, 'title', maxResults * 2),
        this.searchAtLevel(queryEmbedding, 'paragraph', maxResults * 2),
        this.searchAtLevel(queryEmbedding, 'document', maxResults * 2)
      ]);

      // Fuse scores from different levels
      const fusedResults = this.fuseSearchResults(
        titleResults,
        paragraphResults,
        documentResults,
        weights
      );

      // Filter by threshold and limit results
      return fusedResults
        .filter(result => result.hierarchicalScores.fusedScore >= threshold)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Error in hierarchical search:', error);
      return [];
    }
  }

  /**
   * Search recommendations based on conversation context
   */
  async getContextualRecommendations(
    conversationHistory: string[],
    currentQuery: string,
    maxResults: number = 5
  ): Promise<SearchResult[]> {
    try {
      // Create context embedding from recent conversation
      const contextText = conversationHistory.slice(-5).join(' ');
      const contextEmbedding = await this.getCachedEmbedding(contextText);
      
      // Combine context with current query
      const enhancedQuery = `${contextText} ${currentQuery}`;
      
      return await this.hierarchicalSearch(enhancedQuery, {
        maxResults,
        weights: { title: 0.3, paragraph: 0.5, document: 0.2 }
      });
    } catch (error) {
      console.error('Error getting contextual recommendations:', error);
      return [];
    }
  }

  /**
   * Get or generate cached embedding
   */
  private async getCachedEmbedding(text: string): Promise<number[]> {
    const queryHash = this.hashText(text);
    
    // Check cache first
    const cached = this.cache.get(queryHash);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      cached.usageCount++;
      return cached.embedding;
    }

    // Generate new embedding
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text: text.substring(0, 8000) } // Limit text length
    });

    if (error) throw error;

    // Cache the result
    this.cacheEmbedding(queryHash, data.embedding);
    
    return data.embedding;
  }

  /**
   * Cache embedding with LRU eviction
   */
  private cacheEmbedding(queryHash: string, embedding: number[]): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestEntry = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
      this.cache.delete(oldestEntry[0]);
    }

    this.cache.set(queryHash, {
      embedding,
      timestamp: Date.now(),
      queryHash,
      usageCount: 1
    });
  }

  /**
   * Search at a specific hierarchical level
   */
  private async searchAtLevel(
    queryEmbedding: number[],
    level: 'title' | 'paragraph' | 'document',
    maxResults: number
  ): Promise<any[]> {
    const { data } = await supabase.rpc('match_documents_hierarchical', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: maxResults,
      level_filter: level
    });

    return data || [];
  }

  /**
   * Fuse search results from different levels
   */
  private fuseSearchResults(
    titleResults: any[],
    paragraphResults: any[],
    documentResults: any[],
    weights: { title: number; paragraph: number; document: number }
  ): SearchResult[] {
    const fusedMap = new Map<string, SearchResult>();

    // Process results from each level
    titleResults.forEach(result => this.addToFusedResults(fusedMap, result, 'title', weights.title));
    paragraphResults.forEach(result => this.addToFusedResults(fusedMap, result, 'paragraph', weights.paragraph));
    documentResults.forEach(result => this.addToFusedResults(fusedMap, result, 'document', weights.document));

    // Convert to array and sort by fused score
    return Array.from(fusedMap.values())
      .sort((a, b) => b.hierarchicalScores.fusedScore - a.hierarchicalScores.fusedScore);
  }

  /**
   * Add result to fused results map
   */
  private addToFusedResults(
    fusedMap: Map<string, SearchResult>,
    result: any,
    level: 'title' | 'paragraph' | 'document',
    weight: number
  ): void {
    const existing = fusedMap.get(result.id);
    
    if (existing) {
      // Update existing result
      existing.hierarchicalScores[`${level}Score`] = result.similarity;
      existing.hierarchicalScores.fusedScore += result.similarity * weight;
    } else {
      // Create new result
      const searchResult: SearchResult = {
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        similarity: result.similarity,
        relevanceScore: result.similarity,
        level,
        hierarchicalScores: {
          titleScore: level === 'title' ? result.similarity : 0,
          paragraphScore: level === 'paragraph' ? result.similarity : 0,
          documentScore: level === 'document' ? result.similarity : 0,
          fusedScore: result.similarity * weight
        }
      };
      
      fusedMap.set(result.id, searchResult);
    }
  }

  /**
   * Split content into meaningful paragraphs
   */
  private splitIntoParagraphs(content: string, maxSize: number): string[] {
    const paragraphs = content.split(/\n\s*\n/);
    const chunks: string[] = [];
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Create a summary of content for document-level embedding
   */
  private summarizeContent(content: string): string {
    // Extract first and last sentences, plus any headers
    const sentences = content.split(/[.!?]+/);
    const firstSentences = sentences.slice(0, 3).join('. ');
    const lastSentences = sentences.slice(-2).join('. ');
    
    return `${firstSentences}... ${lastSentences}`.substring(0, 1000);
  }

  /**
   * Simple hash function for text
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestCacheEntry()
    };
  }

  private calculateHitRate(): number {
    const totalUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.usageCount, 0);
    return totalUsage > 0 ? this.cache.size / totalUsage : 0;
  }

  private getOldestCacheEntry(): number {
    const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
    return Math.min(...timestamps);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const hierarchicalEmbeddingService = new HierarchicalEmbeddingService();