/**
 * Service de gestion du cache des threads OpenAI
 * Extraction sécurisée de la logique de cache depuis chat-openai-stream
 */

interface ThreadCacheEntry {
  threadId: string;
  lastUsed: number;
  expiry: number;
  useCount: number;
  averageResponseTime: number;
  agentType: string;
}

class ThreadCacheService {
  private cache = new Map<string, ThreadCacheEntry>();
  private cacheHitRate = 0;
  private totalCacheRequests = 0;

  constructor() {
    // Nettoyage automatique toutes les 15 minutes
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  getCacheKey(userId: string, selectedAgent: string): string {
    return `${userId}-${selectedAgent}`;
  }

  get(cacheKey: string): ThreadCacheEntry | undefined {
    this.totalCacheRequests++;
    const entry = this.cache.get(cacheKey);
    
    if (entry && Date.now() < entry.expiry) {
      entry.lastUsed = Date.now();
      entry.useCount++;
      this.updateCacheHitRate(true);
      
      console.log('thread-cache: hit', {
        threadId: entry.threadId,
        useCount: entry.useCount,
        cacheHitRate: Math.round(this.cacheHitRate * 100) / 100
      });
      
      return entry;
    }
    
    this.updateCacheHitRate(false);
    return undefined;
  }

  set(cacheKey: string, threadId: string, selectedAgent: string): void {
    const entry: ThreadCacheEntry = {
      threadId,
      lastUsed: Date.now(),
      expiry: Date.now() + (120 * 60 * 1000), // 2 heures
      useCount: 1,
      averageResponseTime: 0,
      agentType: selectedAgent
    };
    
    this.cache.set(cacheKey, entry);
    
    console.log('thread-cache: set', {
      threadId,
      cacheSize: this.cache.size,
      selectedAgent
    });
  }

  updateUsage(cacheKey: string): void {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      entry.lastUsed = Date.now();
      entry.useCount++;
    }
  }

  private updateCacheHitRate(isHit: boolean): void {
    if (isHit) {
      this.cacheHitRate = ((this.cacheHitRate * (this.totalCacheRequests - 1)) + 1) / this.totalCacheRequests;
    } else {
      this.cacheHitRate = (this.cacheHitRate * (this.totalCacheRequests - 1)) / this.totalCacheRequests;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedThreads = 0;
    
    for (const [key, data] of this.cache.entries()) {
      if (now > data.expiry || (data.useCount === 0 && now - data.lastUsed > 30 * 60 * 1000)) {
        this.cache.delete(key);
        cleanedThreads++;
      }
    }
    
    if (cleanedThreads > 0) {
      console.log('thread-cache: cleanup', { cleanedThreads, cacheSize: this.cache.size });
    }
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.cacheHitRate,
      totalRequests: this.totalCacheRequests
    };
  }
}

export const threadCacheService = new ThreadCacheService();