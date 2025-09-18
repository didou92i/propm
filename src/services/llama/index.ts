import { LlamaConfiguration } from './configuration';
import { IndexManager } from './indexManager';
import { SearchEngine } from './searchEngine';
import type { LlamaSearchResult, LlamaSearchOptions } from './types';

export class LlamaIndexService {
  private indexManager: IndexManager | null = null;
  private searchEngine: SearchEngine | null = null;
  private searchCache = new Map<string, { results: LlamaSearchResult[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Lazy initialization - ne rien faire au constructeur
    this.loadCacheFromStorage();
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('llama_search_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        // Charger seulement les entrées non expirées
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value.timestamp && (now - value.timestamp) < this.CACHE_DURATION) {
            this.searchCache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load search cache from storage:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      const cacheData: Record<string, any> = {};
      this.searchCache.forEach((value, key) => {
        cacheData[key] = value;
      });
      localStorage.setItem('llama_search_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save search cache to storage:', error);
    }
  }

  private async lazyInitialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Import dynamique pour réduire le bundle initial
      const { LlamaConfiguration } = await import('./configuration');
      const { IndexManager } = await import('./indexManager');
      
      LlamaConfiguration.configure();
      this.indexManager = new IndexManager();
      
      const { index, queryEngine } = await this.indexManager.initialize();
      
      const { SearchEngine } = await import('./searchEngine');
      this.searchEngine = new SearchEngine(queryEngine, index);
      
      this.initialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation LlamaIndex:', error);
      this.initPromise = null;
      throw error;
    }
  }

  async initialize(): Promise<void> {
    await this.lazyInitialize();
  }

  async search(query: string, options?: LlamaSearchOptions): Promise<LlamaSearchResult[]> {
    await this.lazyInitialize();

    // Vérifier le cache
    const cacheKey = `${query}_${JSON.stringify(options)}`;
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.results;
    }

    try {
      const results = await this.searchEngine!.search(query, options);
      
      // Mettre en cache avec sauvegarde
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      this.saveCacheToStorage();

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche sémantique:', error);
      return [];
    }
  }

  async contextualSearch(query: string, conversationHistory: string[], maxResults: number = 5): Promise<LlamaSearchResult[]> {
    await this.lazyInitialize();

    try {
      return await this.searchEngine!.contextualSearch(query, conversationHistory, maxResults);
    } catch (error) {
      console.error('Erreur lors de la recherche contextuelle:', error);
      return [];
    }
  }

  policeQueryRouter(query: string): 'hierarchical' | 'auto_merging' | 'default' {
    if (!this.initialized || !this.searchEngine) {
      return 'default';
    }
    return this.searchEngine.policeQueryRouter(query);
  }

  async addDocument(content: string, metadata: any): Promise<void> {
    await this.lazyInitialize();
    await this.indexManager!.addDocument(content, metadata);
    this.clearCache();
  }

  async rebuildIndex(): Promise<void> {
    await this.lazyInitialize();
    await this.indexManager!.rebuildIndex();
    this.searchEngine = null;
    this.initialized = false;
    this.initPromise = null;
    this.clearCache();
  }

  clearCache(): void {
    this.searchCache.clear();
    localStorage.removeItem('llama_search_cache');
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