import { LlamaConfiguration } from './configuration';
import { IndexManager } from './indexManager';
import { SearchEngine } from './searchEngine';
import type { LlamaSearchResult, LlamaSearchOptions } from './types';

export class LlamaIndexService {
  private indexManager: IndexManager;
  private searchEngine: SearchEngine | null = null;
  private searchCache = new Map<string, { results: LlamaSearchResult[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.indexManager = new IndexManager();
    this.configureSettings();
  }

  private configureSettings(): void {
    LlamaConfiguration.configure();
  }

  async initialize(): Promise<void> {
    const { index, queryEngine } = await this.indexManager.initialize();
    this.searchEngine = new SearchEngine(queryEngine, index);
  }

  async search(query: string, options?: LlamaSearchOptions): Promise<LlamaSearchResult[]> {
    if (!this.searchEngine) {
      await this.initialize();
    }

    // Vérifier le cache
    const cacheKey = `${query}_${JSON.stringify(options)}`;
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('Résultat de recherche depuis le cache');
      return cached.results;
    }

    try {
      const results = await this.searchEngine!.search(query, options);
      
      // Mettre en cache
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche sémantique:', error);
      return [];
    }
  }

  async contextualSearch(query: string, conversationHistory: string[], maxResults: number = 5): Promise<LlamaSearchResult[]> {
    if (!this.searchEngine) {
      await this.initialize();
    }

    try {
      return await this.searchEngine.contextualSearch(query, conversationHistory, maxResults);
    } catch (error) {
      console.error('Erreur lors de la recherche contextuelle:', error);
      return [];
    }
  }

  policeQueryRouter(query: string): 'hierarchical' | 'auto_merging' | 'default' {
    if (!this.searchEngine) {
      return 'default';
    }
    return this.searchEngine.policeQueryRouter(query);
  }

  async addDocument(content: string, metadata: any): Promise<void> {
    await this.indexManager.addDocument(content, metadata);
    this.clearCache();
  }

  async rebuildIndex(): Promise<void> {
    await this.indexManager.rebuildIndex();
    this.searchEngine = null;
    this.clearCache();
  }

  clearCache(): void {
    this.searchCache.clear();
    console.log('Cache de recherche vidé');
  }

  // Convenience method that uses the router automatically
  async smartSearch(query: string, conversationHistory: string[] = [], maxResults: number = 5): Promise<LlamaSearchResult[]> {
    const strategy = this.policeQueryRouter(query);
    
    const options: LlamaSearchOptions = {
      maxResults,
      retrievalStrategy: strategy,
      threshold: 0.3
    };

    if (conversationHistory.length > 0) {
      return this.contextualSearch(query, conversationHistory, maxResults);
    }

    return this.search(query, options);
  }
}

// Export singleton instance
export const llamaIndexService = new LlamaIndexService();

// Re-export types
export type * from './types';