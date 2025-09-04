import { logger } from '@/utils/logger';

interface OptimizationMetrics {
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  lastOptimizedAt: number;
}

interface OptimizationParams {
  pollingInterval: number;
  maxAttempts: number;
  timeoutMs: number;
  chunkSize: number;
  streamingSpeed: number;
}

class ChatOptimizer {
  private static instance: ChatOptimizer;
  private metrics: OptimizationMetrics = {
    averageResponseTime: 0,
    requestCount: 0,
    errorRate: 0,
    lastOptimizedAt: Date.now()
  };
  private responseTimes: number[] = [];
  private maxMetricsHistory = 50;

  static getInstance(): ChatOptimizer {
    if (!ChatOptimizer.instance) {
      ChatOptimizer.instance = new ChatOptimizer();
    }
    return ChatOptimizer.instance;
  }

  // Optimise les paramètres selon les métriques actuelles
  getOptimizedParams(messageLength: number, agentType: string): OptimizationParams {
    const baseParams = this.getBaseParams();
    const lengthMultiplier = this.getMessageLengthMultiplier(messageLength);
    const agentMultiplier = this.getAgentMultiplier(agentType);
    
    return {
      pollingInterval: Math.max(15, Math.floor(baseParams.pollingInterval * lengthMultiplier * agentMultiplier)),
      maxAttempts: Math.min(80, Math.floor(baseParams.maxAttempts * lengthMultiplier)),
      timeoutMs: Math.floor(baseParams.timeoutMs * lengthMultiplier),
      chunkSize: Math.max(2, Math.floor(baseParams.chunkSize * (messageLength > 500 ? 1.5 : 1))),
      streamingSpeed: Math.max(1, Math.floor(baseParams.streamingSpeed * (this.metrics.averageResponseTime > 2000 ? 1.5 : 1)))
    };
  }

  private getBaseParams(): OptimizationParams {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Paramètres optimisés selon les métriques de performance
    if (this.metrics.averageResponseTime > 3000) {
      // Mode haute performance si les délais sont élevés
      return {
        pollingInterval: 20,
        maxAttempts: 60,
        timeoutMs: 8000,
        chunkSize: 4,
        streamingSpeed: 2
      };
    } else if (this.metrics.averageResponseTime > 1500) {
      // Mode équilibré
      return {
        pollingInterval: 25,
        maxAttempts: 50,
        timeoutMs: 6000,
        chunkSize: 3,
        streamingSpeed: 3
      };
    } else {
      // Mode standard pour bonnes performances
      return {
        pollingInterval: isProduction ? 30 : 25,
        maxAttempts: 45,
        timeoutMs: 5000,
        chunkSize: isProduction ? 3 : 2,
        streamingSpeed: isProduction ? 3 : 2
      };
    }
  }

  private getMessageLengthMultiplier(length: number): number {
    if (length < 50) return 0.8; // Messages courts plus rapides
    if (length < 200) return 1.0; // Messages moyens
    if (length < 500) return 1.2; // Messages longs
    return 1.5; // Messages très longs
  }

  private getAgentMultiplier(agentType: string): number {
    const agentComplexity: Record<string, number> = {
      'redacpro': 1.0,     // Standard
      'cdspro': 1.1,       // Légèrement plus complexe
      'prepacds': 1.2,     // Plus complexe (formations)
      'arrete': 1.3        // Le plus complexe (documents officiels)
    };
    
    return agentComplexity[agentType] || 1.0;
  }

  // Enregistre les métriques de performance
  recordResponseTime(responseTime: number, success: boolean): void {
    this.responseTimes.push(responseTime);
    
    // Garder seulement les N dernières mesures
    if (this.responseTimes.length > this.maxMetricsHistory) {
      this.responseTimes.shift();
    }
    
    // Recalculer les métriques
    this.metrics.requestCount++;
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    if (!success) {
      this.metrics.errorRate = ((this.metrics.errorRate * (this.metrics.requestCount - 1)) + 1) / this.metrics.requestCount;
    }
    
    // Log des métriques périodiquement
    if (this.metrics.requestCount % 10 === 0) {
      logger.info('Performance metrics updated', {
        averageResponseTime: Math.round(this.metrics.averageResponseTime),
        requestCount: this.metrics.requestCount,
        errorRate: Math.round(this.metrics.errorRate * 100) / 100
      }, 'ChatOptimizer');
    }
  }

  // Obtient les recommandations d'optimisation
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.averageResponseTime > 4000) {
      recommendations.push('⚡ Délais très élevés détectés - optimisation aggressive activée');
    } else if (this.metrics.averageResponseTime > 2500) {
      recommendations.push('🔄 Optimisation modérée des paramètres de polling');
    }
    
    if (this.metrics.errorRate > 0.1) {
      recommendations.push('⚠️ Taux d\'erreur élevé - augmentation des tentatives');
    }
    
    if (this.responseTimes.length > 20) {
      const trend = this.getPerformanceTrend();
      if (trend === 'improving') {
        recommendations.push('✅ Performances en amélioration continue');
      } else if (trend === 'degrading') {
        recommendations.push('📉 Dégradation des performances détectée');
      }
    }
    
    return recommendations;
  }

  private getPerformanceTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.responseTimes.length < 10) return 'stable';
    
    const firstHalf = this.responseTimes.slice(0, Math.floor(this.responseTimes.length / 2));
    const secondHalf = this.responseTimes.slice(Math.floor(this.responseTimes.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const improvement = (firstAvg - secondAvg) / firstAvg;
    
    if (improvement > 0.1) return 'improving';
    if (improvement < -0.1) return 'degrading';
    return 'stable';
  }

  // Réinitialise les métriques si nécessaire
  resetMetrics(): void {
    this.metrics = {
      averageResponseTime: 0,
      requestCount: 0,
      errorRate: 0,
      lastOptimizedAt: Date.now()
    };
    this.responseTimes = [];
    logger.info('Performance metrics reset', {}, 'ChatOptimizer');
  }

  // Obtient les métriques actuelles
  getMetrics(): OptimizationMetrics {
    return { ...this.metrics };
  }
}

export const chatOptimizer = ChatOptimizer.getInstance();
export type { OptimizationParams, OptimizationMetrics };