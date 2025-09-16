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
    // TTL dynamique basé sur l'agent et la charge
    const baseTTL = 120 * 60 * 1000; // 2 heures de base
    const dynamicTTL = this.calculateDynamicTTL(selectedAgent, baseTTL);
    
    const entry: ThreadCacheEntry = {
      threadId,
      lastUsed: Date.now(),
      expiry: Date.now() + dynamicTTL,
      useCount: 1,
      averageResponseTime: 0,
      agentType: selectedAgent
    };
    
    this.cache.set(cacheKey, entry);
    
    console.log('thread-cache: set', {
      threadId,
      cacheSize: this.cache.size,
      selectedAgent,
      ttlMinutes: Math.round(dynamicTTL / 60000)
    });
  }

  /**
   * Calculer TTL dynamique basé sur l'utilisation
   */
  private calculateDynamicTTL(selectedAgent: string, baseTTL: number): number {
    const cacheLoad = this.cache.size;
    const currentHitRate = this.cacheHitRate;
    
    // Ajuster selon la charge du cache
    let multiplier = 1;
    if (cacheLoad > 50) multiplier *= 0.8;      // Réduire si surcharge
    if (currentHitRate > 0.8) multiplier *= 1.5; // Augmenter si efficace
    if (currentHitRate < 0.3) multiplier *= 0.7; // Réduire si inefficace
    
    // Ajuster selon l'agent (certains plus stables)
    const agentMultipliers: Record<string, number> = {
      'cdspro': 1.2,      // Plus stable, TTL plus long
      'prepacds': 1.0,    // Standard
      'arrete': 0.9,      // Moins prévisible
      'redacpro': 1.1
    };
    
    multiplier *= agentMultipliers[selectedAgent] || 1;
    
    const finalTTL = Math.max(
      Math.min(baseTTL * multiplier, baseTTL * 2), // Max 4h
      baseTTL * 0.5  // Min 1h
    );
    
    return Math.round(finalTTL);
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