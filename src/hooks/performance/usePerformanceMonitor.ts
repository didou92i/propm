import { useState, useEffect, useCallback, useRef } from 'react';
import { chatOptimizer, OptimizationMetrics, OptimizationParams } from '@/services/performance/chatOptimizer';
import { logger } from '@/utils/logger';

interface PerformanceMonitorState {
  isMonitoring: boolean;
  currentMetrics: OptimizationMetrics;
  recommendations: string[];
  optimizedParams: OptimizationParams | null;
  averageResponseTime: number;
  responseCount: number;
}

interface PerformanceSession {
  startTime: number;
  messageLength: number;
  agentType: string;
  sessionId: string;
}

export function usePerformanceMonitor() {
  const [state, setState] = useState<PerformanceMonitorState>({
    isMonitoring: false,
    currentMetrics: chatOptimizer.getMetrics(),
    recommendations: [],
    optimizedParams: null,
    averageResponseTime: 0,
    responseCount: 0
  });

  const activeSessionsRef = useRef<Map<string, PerformanceSession>>(new Map());
  const metricsUpdateIntervalRef = useRef<NodeJS.Timeout>();

  // Démarre le monitoring d'une session
  const startSession = useCallback((sessionId: string, messageLength: number, agentType: string): OptimizationParams => {
    const session: PerformanceSession = {
      startTime: performance.now(),
      messageLength,
      agentType,
      sessionId
    };
    
    activeSessionsRef.current.set(sessionId, session);
    
    // Obtenir les paramètres optimisés pour cette session
    const optimizedParams = chatOptimizer.getOptimizedParams(messageLength, agentType);
    
    setState(prev => ({
      ...prev,
      isMonitoring: true,
      optimizedParams,
      responseCount: prev.responseCount + 1
    }));

    logger.info('Performance session started', {
      sessionId,
      messageLength,
      agentType,
      optimizedParams
    }, 'usePerformanceMonitor');

    return optimizedParams;
  }, []);

  // Termine le monitoring d'une session
  const endSession = useCallback((sessionId: string, success: boolean = true) => {
    const session = activeSessionsRef.current.get(sessionId);
    if (!session) return;

    const responseTime = performance.now() - session.startTime;
    
    // Enregistrer les métriques
    chatOptimizer.recordResponseTime(responseTime, success);
    
    // Nettoyer la session
    activeSessionsRef.current.delete(sessionId);
    
    // Mettre à jour l'état
    const newMetrics = chatOptimizer.getMetrics();
    const recommendations = chatOptimizer.getOptimizationRecommendations();
    
    setState(prev => ({
      ...prev,
      currentMetrics: newMetrics,
      recommendations,
      averageResponseTime: newMetrics.averageResponseTime,
      isMonitoring: activeSessionsRef.current.size > 0
    }));

    logger.info('Performance session ended', {
      sessionId,
      responseTime: Math.round(responseTime),
      success,
      newAverageResponseTime: Math.round(newMetrics.averageResponseTime)
    }, 'usePerformanceMonitor');

    return responseTime;
  }, []);

  // Obtient les paramètres optimisés pour un type de message
  const getOptimizedParams = useCallback((messageLength: number, agentType: string): OptimizationParams => {
    return chatOptimizer.getOptimizedParams(messageLength, agentType);
  }, []);

  // Met à jour les métriques périodiquement
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = chatOptimizer.getMetrics();
      const recommendations = chatOptimizer.getOptimizationRecommendations();
      
      setState(prev => ({
        ...prev,
        currentMetrics,
        recommendations,
        averageResponseTime: currentMetrics.averageResponseTime
      }));
    };

    // Mise à jour toutes les 10 secondes
    metricsUpdateIntervalRef.current = setInterval(updateMetrics, 10000);

    return () => {
      if (metricsUpdateIntervalRef.current) {
        clearInterval(metricsUpdateIntervalRef.current);
      }
    };
  }, []);

  // Enregistre manuellement une mesure de performance
  const recordManualMetric = useCallback((responseTime: number, success: boolean = true) => {
    chatOptimizer.recordResponseTime(responseTime, success);
    
    const newMetrics = chatOptimizer.getMetrics();
    setState(prev => ({
      ...prev,
      currentMetrics: newMetrics,
      averageResponseTime: newMetrics.averageResponseTime
    }));
  }, []);

  // Réinitialise les métriques
  const resetMetrics = useCallback(() => {
    chatOptimizer.resetMetrics();
    activeSessionsRef.current.clear();
    
    setState({
      isMonitoring: false,
      currentMetrics: chatOptimizer.getMetrics(),
      recommendations: [],
      optimizedParams: null,
      averageResponseTime: 0,
      responseCount: 0
    });
  }, []);

  // Obtient un rapport de performance détaillé
  const getPerformanceReport = useCallback(() => {
    const metrics = chatOptimizer.getMetrics();
    const recommendations = chatOptimizer.getOptimizationRecommendations();
    
    return {
      metrics,
      recommendations,
      activeSessions: activeSessionsRef.current.size,
      performanceGrade: getPerformanceGrade(metrics.averageResponseTime),
      suggestions: getPerformanceSuggestions(metrics)
    };
  }, []);

  // Obtient une note de performance
  const getPerformanceGrade = (averageTime: number): string => {
    if (averageTime < 1000) return 'A+';
    if (averageTime < 1500) return 'A';
    if (averageTime < 2500) return 'B';
    if (averageTime < 4000) return 'C';
    return 'D';
  };

  // Obtient des suggestions d'amélioration
  const getPerformanceSuggestions = (metrics: OptimizationMetrics): string[] => {
    const suggestions: string[] = [];
    
    if (metrics.averageResponseTime > 3000) {
      suggestions.push('Considérer l\'optimisation du cache des threads');
      suggestions.push('Réduire la fréquence de polling OpenAI');
    }
    
    if (metrics.errorRate > 0.05) {
      suggestions.push('Améliorer la gestion des erreurs réseau');
      suggestions.push('Implémenter des retry intelligents');
    }
    
    if (metrics.requestCount > 100 && metrics.averageResponseTime > 2000) {
      suggestions.push('Envisager un cache de réponses intelligent');
    }
    
    return suggestions;
  };

  return {
    // État
    ...state,
    
    // Actions
    startSession,
    endSession,
    getOptimizedParams,
    recordManualMetric,
    resetMetrics,
    getPerformanceReport,
    
    // Utilitaires
    isOptimizationActive: state.currentMetrics.requestCount > 5,
    performanceGrade: getPerformanceGrade(state.averageResponseTime),
    activeSessions: activeSessionsRef.current.size
  };
}