/**
 * Service de monitoring amélioré pour les Edge Functions
 * Ajoute surveillance temps réel et métriques détaillées
 */

export interface DetailedMetrics {
  functionName: string;
  phase: 'thread_creation' | 'run_creation' | 'polling' | 'response_formatting';
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  type: 'TIMEOUT_RISK' | 'HIGH_LATENCY' | 'ERROR_SPIKE' | 'CACHE_MISS_RATE';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  metadata: Record<string, any>;
}

class EnhancedMonitoringService {
  private metrics: DetailedMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private phaseTimings = new Map<string, number>();
  private errorRates = new Map<string, number>();
  private maxStoredMetrics = 500;
  private maxStoredAlerts = 100;

  /**
   * Démarrer le suivi d'une phase spécifique
   */
  startPhase(functionName: string, phase: DetailedMetrics['phase'], metadata?: Record<string, any>): string {
    const phaseId = `${functionName}-${phase}-${Date.now()}`;
    this.phaseTimings.set(phaseId, Date.now());
    
    console.log(`[MONITOR-${functionName}] Phase ${phase} started`, {
      phaseId,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    return phaseId;
  }

  /**
   * Terminer le suivi d'une phase
   */
  endPhase(phaseId: string, success: boolean, error?: string, metadata?: Record<string, any>): void {
    const startTime = this.phaseTimings.get(phaseId);
    if (!startTime) return;

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const [functionName, phase] = phaseId.split('-');
    
    const metric: DetailedMetrics = {
      functionName,
      phase: phase as DetailedMetrics['phase'],
      startTime,
      endTime,
      duration,
      success,
      error,
      metadata
    };

    this.addMetric(metric);
    this.phaseTimings.delete(phaseId);
    
    // Vérifier les seuils d'alerte
    this.checkAlertThresholds(metric);
    
    console.log(`[MONITOR-${functionName}] Phase ${phase} completed`, {
      duration: `${duration}ms`,
      success,
      error: error || 'none'
    });
  }

  /**
   * Enregistrer une métrique OpenAI spécifique
   */
  recordOpenAICall(
    functionName: string,
    operation: 'create_thread' | 'add_message' | 'create_run' | 'get_run' | 'get_messages',
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const metric: DetailedMetrics = {
      functionName,
      phase: 'polling',
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      success,
      error,
      metadata: { openAIOperation: operation }
    };

    this.addMetric(metric);
    this.updateErrorRate(functionName, success);
  }

  /**
   * Vérifier les seuils d'alerte
   */
  private checkAlertThresholds(metric: DetailedMetrics): void {
    // Alerte si temps de réponse > 20s
    if (metric.duration && metric.duration > 20000) {
      this.addAlert({
        type: 'HIGH_LATENCY',
        message: `Phase ${metric.phase} took ${metric.duration}ms (>20s)`,
        severity: metric.duration > 30000 ? 'CRITICAL' : 'HIGH',
        timestamp: Date.now(),
        metadata: { functionName: metric.functionName, phase: metric.phase, duration: metric.duration }
      });
    }

    // Alerte si risque de timeout (>25s total)
    if (metric.duration && metric.duration > 25000) {
      this.addAlert({
        type: 'TIMEOUT_RISK',
        message: `Function ${metric.functionName} approaching timeout limit`,
        severity: 'CRITICAL',
        timestamp: Date.now(),
        metadata: { functionName: metric.functionName, duration: metric.duration }
      });
    }

    // Alerte sur taux d'erreur élevé
    const currentErrorRate = this.errorRates.get(metric.functionName) || 0;
    if (currentErrorRate > 0.15) { // 15% d'erreur
      this.addAlert({
        type: 'ERROR_SPIKE',
        message: `High error rate detected: ${Math.round(currentErrorRate * 100)}%`,
        severity: currentErrorRate > 0.3 ? 'CRITICAL' : 'HIGH',
        timestamp: Date.now(),
        metadata: { functionName: metric.functionName, errorRate: currentErrorRate }
      });
    }
  }

  /**
   * Obtenir un résumé des performances
   */
  getPerformanceSummary(functionName?: string): {
    totalCalls: number;
    averageResponseTime: number;
    successRate: number;
    phaseBreakdown: Record<string, { avg: number; count: number }>;
    recentAlerts: PerformanceAlert[];
  } {
    const filteredMetrics = functionName 
      ? this.metrics.filter(m => m.functionName === functionName)
      : this.metrics;

    const totalCalls = filteredMetrics.length;
    const successfulCalls = filteredMetrics.filter(m => m.success).length;
    const successRate = totalCalls > 0 ? successfulCalls / totalCalls : 0;

    const averageResponseTime = totalCalls > 0
      ? filteredMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalCalls
      : 0;

    // Analyse par phase
    const phaseBreakdown: Record<string, { avg: number; count: number }> = {};
    for (const metric of filteredMetrics) {
      if (!phaseBreakdown[metric.phase]) {
        phaseBreakdown[metric.phase] = { avg: 0, count: 0 };
      }
      phaseBreakdown[metric.phase].avg += metric.duration || 0;
      phaseBreakdown[metric.phase].count++;
    }

    for (const phase in phaseBreakdown) {
      phaseBreakdown[phase].avg = Math.round(phaseBreakdown[phase].avg / phaseBreakdown[phase].count);
    }

    return {
      totalCalls,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      phaseBreakdown,
      recentAlerts: this.alerts.slice(-10)
    };
  }

  /**
   * Recommandations d'optimisation
   */
  getOptimizationRecommendations(functionName: string): string[] {
    const summary = this.getPerformanceSummary(functionName);
    const recommendations: string[] = [];

    if (summary.averageResponseTime > 15000) {
      recommendations.push('Réduire le maxAttempts ou l\'intervalle de polling');
    }

    if (summary.successRate < 0.85) {
      recommendations.push('Implémenter un circuit breaker ou retry logic');
    }

    const pollingPhase = summary.phaseBreakdown['polling'];
    if (pollingPhase && pollingPhase.avg > 10000) {
      recommendations.push('Optimiser les intervalles de polling');
    }

    return recommendations;
  }

  private addMetric(metric: DetailedMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift();
    }
  }

  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxStoredAlerts) {
      this.alerts.shift();
    }
    
    // Log critique
    if (alert.severity === 'CRITICAL') {
      console.error(`[CRITICAL ALERT] ${alert.message}`, alert.metadata);
    }
  }

  private updateErrorRate(functionName: string, success: boolean): void {
    const currentRate = this.errorRates.get(functionName) || 0;
    const newRate = success ? currentRate * 0.95 : Math.min(currentRate + 0.1, 1);
    this.errorRates.set(functionName, newRate);
  }
}

export const enhancedMonitoringService = new EnhancedMonitoringService();