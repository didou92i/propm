/**
 * Service de monitoring des performances pour les Edge Functions
 */

export interface PerformanceMetrics {
  responseTime: number;
  startTime: number;
  endTime: number;
  memoryUsage?: number;
  cacheHit?: boolean;
  openAICallTime?: number;
  databaseCallTime?: number;
  [key: string]: any;
}

export interface FunctionStats {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  lastError?: string;
  lastSuccess?: string;
}

export class PerformanceMonitoringService {
  private static stats = new Map<string, FunctionStats>();
  private static requestTimes: number[] = [];
  private static maxStoredTimes = 100; // Garder les 100 derniers temps de réponse

  /**
   * Initialiser le monitoring pour une requête
   */
  static startMonitoring(functionName: string, requestData?: any): number {
    const startTime = Date.now();
    
    // Incrémenter le compteur de requêtes
    const currentStats = this.stats.get(functionName) || {
      totalRequests: 0,
      averageResponseTime: 0,
      successRate: 0,
      errorRate: 0
    };
    
    currentStats.totalRequests++;
    this.stats.set(functionName, currentStats);
    
    console.log(`[PERF] ${functionName}: Début monitoring - Requête #${currentStats.totalRequests}`, {
      timestamp: new Date().toISOString(),
      functionName,
      requestData: requestData ? Object.keys(requestData) : undefined
    });
    
    return startTime;
  }

  /**
   * Enregistrer le succès d'une requête
   */
  static recordSuccess(
    functionName: string, 
    startTime: number, 
    additionalMetrics: Record<string, any> = {}
  ): PerformanceMetrics {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Mettre à jour les statistiques
    this.updateStats(functionName, responseTime, true);
    
    // Ajouter au tableau des temps de réponse
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > this.maxStoredTimes) {
      this.requestTimes.shift();
    }
    
    const metrics: PerformanceMetrics = {
      responseTime,
      startTime,
      endTime,
      ...additionalMetrics
    };
    
    console.log(`[PERF] ${functionName}: Succès en ${responseTime}ms`, {
      ...metrics,
      timestamp: new Date().toISOString()
    });
    
    return metrics;
  }

  /**
   * Enregistrer l'échec d'une requête
   */
  static recordError(
    functionName: string, 
    startTime: number, 
    error: Error | string,
    additionalMetrics: Record<string, any> = {}
  ): PerformanceMetrics {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Mettre à jour les statistiques
    this.updateStats(functionName, responseTime, false, error.toString());
    
    const metrics: PerformanceMetrics = {
      responseTime,
      startTime,
      endTime,
      error: error.toString(),
      ...additionalMetrics
    };
    
    console.error(`[PERF] ${functionName}: Échec après ${responseTime}ms`, {
      ...metrics,
      timestamp: new Date().toISOString()
    });
    
    return metrics;
  }

  /**
   * Obtenir les statistiques actuelles
   */
  static getStats(functionName?: string): FunctionStats | Map<string, FunctionStats> {
    if (functionName) {
      return this.stats.get(functionName) || {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0
      };
    }
    return new Map(this.stats);
  }

  /**
   * Obtenir les métriques de performance globales
   */
  static getGlobalMetrics(): {
    totalFunctions: number;
    totalRequests: number;
    averageResponseTime: number;
    overallSuccessRate: number;
    recentResponseTimes: number[];
  } {
    const allStats = Array.from(this.stats.values());
    const totalRequests = allStats.reduce((sum, stat) => sum + stat.totalRequests, 0);
    const totalSuccessful = allStats.reduce((sum, stat) => 
      sum + (stat.totalRequests * stat.successRate / 100), 0);
    
    return {
      totalFunctions: this.stats.size,
      totalRequests,
      averageResponseTime: this.requestTimes.length > 0 
        ? Math.round(this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length)
        : 0,
      overallSuccessRate: totalRequests > 0 
        ? Math.round((totalSuccessful / totalRequests) * 100)
        : 0,
      recentResponseTimes: [...this.requestTimes].slice(-10) // 10 derniers temps
    };
  }

  /**
   * Logger les métriques OpenAI
   */
  static logOpenAIMetrics(
    functionName: string,
    requestData: any,
    responseTime: number,
    tokenUsage?: any
  ): void {
    console.log(`[PERF-OPENAI] ${functionName}: Appel OpenAI`, {
      responseTime,
      model: requestData.model,
      messageCount: requestData.messages?.length,
      maxTokens: requestData.max_completion_tokens || requestData.max_tokens,
      tokenUsage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logger les métriques de base de données
   */
  static logDatabaseMetrics(
    functionName: string,
    operation: string,
    responseTime: number,
    recordsAffected?: number
  ): void {
    console.log(`[PERF-DB] ${functionName}: ${operation}`, {
      responseTime,
      recordsAffected,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logger les métriques de cache
   */
  static logCacheMetrics(
    functionName: string,
    operation: 'hit' | 'miss' | 'set' | 'invalidate',
    cacheKey: string,
    responseTime?: number
  ): void {
    console.log(`[PERF-CACHE] ${functionName}: Cache ${operation}`, {
      cacheKey,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Créer un rapport de performance
   */
  static generateReport(): string {
    const globalMetrics = this.getGlobalMetrics();
    const allStats = this.getStats() as Map<string, FunctionStats>;
    
    let report = `\n=== RAPPORT DE PERFORMANCE ===\n`;
    report += `Fonctions surveillées: ${globalMetrics.totalFunctions}\n`;
    report += `Requêtes totales: ${globalMetrics.totalRequests}\n`;
    report += `Temps de réponse moyen: ${globalMetrics.averageResponseTime}ms\n`;
    report += `Taux de succès global: ${globalMetrics.overallSuccessRate}%\n\n`;
    
    report += `=== DÉTAIL PAR FONCTION ===\n`;
    for (const [functionName, stats] of allStats) {
      report += `${functionName}:\n`;
      report += `  - Requêtes: ${stats.totalRequests}\n`;
      report += `  - Temps moyen: ${stats.averageResponseTime}ms\n`;
      report += `  - Succès: ${stats.successRate}%\n`;
      report += `  - Erreurs: ${stats.errorRate}%\n`;
      if (stats.lastError) {
        report += `  - Dernière erreur: ${stats.lastError}\n`;
      }
      report += '\n';
    }
    
    return report;
  }

  /**
   * Remettre à zéro les statistiques
   */
  static resetStats(): void {
    this.stats.clear();
    this.requestTimes.length = 0;
    console.log('[PERF] Statistiques remises à zéro');
  }

  /**
   * Méthode privée pour mettre à jour les statistiques
   */
  private static updateStats(
    functionName: string, 
    responseTime: number, 
    success: boolean,
    error?: string
  ): void {
    const currentStats = this.stats.get(functionName) || {
      totalRequests: 0,
      averageResponseTime: 0,
      successRate: 0,
      errorRate: 0
    };

    // Calculer la nouvelle moyenne des temps de réponse
    const totalTime = currentStats.averageResponseTime * (currentStats.totalRequests - 1);
    currentStats.averageResponseTime = Math.round((totalTime + responseTime) / currentStats.totalRequests);

    // Calculer les taux de succès et d'erreur
    const successCount = Math.round((currentStats.successRate / 100) * (currentStats.totalRequests - 1));
    const newSuccessCount = success ? successCount + 1 : successCount;
    
    currentStats.successRate = Math.round((newSuccessCount / currentStats.totalRequests) * 100);
    currentStats.errorRate = 100 - currentStats.successRate;

    // Enregistrer la dernière erreur ou succès
    if (success) {
      currentStats.lastSuccess = new Date().toISOString();
    } else {
      currentStats.lastError = error || 'Erreur inconnue';
    }

    this.stats.set(functionName, currentStats);
  }
}