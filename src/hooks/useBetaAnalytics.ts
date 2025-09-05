import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface BetaMetrics {
  activeUsers: number;
  featureUsage: Record<string, number>;
  errorRate: number;
  averageSessionDuration: number;
  mostUsedFeatures: Array<{ name: string; count: number }>;
  recentErrors: Array<{ message: string; count: number; timestamp: string }>;
  performanceMetrics: {
    averageLoadTime: number;
    slowestComponents: Array<{ name: string; time: number }>;
  };
}

interface UserJourney {
  sessionId: string;
  startTime: number;
  actions: Array<{
    timestamp: number;
    action: string;
    component?: string;
    duration?: number;
  }>;
  currentRoute: string;
  totalDuration: number;
}

export function useBetaAnalytics() {
  const [metrics, setMetrics] = useState<BetaMetrics>({
    activeUsers: 0,
    featureUsage: {},
    errorRate: 0,
    averageSessionDuration: 0,
    mostUsedFeatures: [],
    recentErrors: [],
    performanceMetrics: {
      averageLoadTime: 0,
      slowestComponents: []
    }
  });

  const [userJourney, setUserJourney] = useState<UserJourney>({
    sessionId: crypto.randomUUID(),
    startTime: Date.now(),
    actions: [],
    currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
    totalDuration: 0
  });

  const [isTracking, setIsTracking] = useState(false);

  // Calculer les métriques depuis les logs
  const calculateMetrics = useCallback(() => {
    const logs = logger.getBufferedLogs();
    const analytics = logger.getAnalytics();

    // Calculer le taux d'erreur
    const totalLogs = logs.length;
    const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'warn').length;
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

    // Extraire les features les plus utilisées
    const mostUsedFeatures = Object.entries(analytics.featureUsage)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Extraire les erreurs récentes
    const recentErrors = Object.entries(analytics.errorFrequency)
      .map(([message, count]) => ({
        message,
        count,
        timestamp: new Date().toISOString()
      }))
      .slice(0, 5);

    // Métriques de performance
    const performanceMetrics = analytics.performanceMetrics;
    const averageLoadTime = performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum, metric) => sum + metric.value, 0) / performanceMetrics.length
      : 0;

    const slowestComponents = performanceMetrics
      .filter(metric => metric.name.includes('component') || metric.name.includes('render'))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(metric => ({ name: metric.name, time: metric.value }));

    setMetrics({
      activeUsers: 1, // Pour l'instant, juste l'utilisateur courant
      featureUsage: analytics.featureUsage,
      errorRate: Math.round(errorRate * 100) / 100,
      averageSessionDuration: analytics.sessionDuration,
      mostUsedFeatures,
      recentErrors,
      performanceMetrics: {
        averageLoadTime: Math.round(averageLoadTime * 100) / 100,
        slowestComponents
      }
    });
  }, []);

  // Tracker les interactions utilisateur
  const trackUserAction = useCallback((action: string, component?: string, duration?: number) => {
    const actionData = {
      timestamp: Date.now(),
      action,
      component,
      duration
    };

    setUserJourney(prev => ({
      ...prev,
      actions: [...prev.actions.slice(-50), actionData], // Garder les 50 dernières actions
      totalDuration: Date.now() - prev.startTime
    }));

    // Log l'action
    logger.user(action, {
      type: 'feature_usage',
      element: component,
      duration,
      metadata: { route: window.location.pathname }
    }, component);
  }, []);

  // Tracker la navigation
  const trackNavigation = useCallback((route: string) => {
    setUserJourney(prev => ({
      ...prev,
      currentRoute: route,
      actions: [...prev.actions, {
        timestamp: Date.now(),
        action: `Navigation vers ${route}`,
        component: 'Router'
      }]
    }));

    logger.user('navigation', {
      type: 'navigation',
      value: route
    }, 'Router');
  }, []);

  // Tracker les erreurs avec contexte
  const trackError = useCallback((error: Error, component?: string, context?: any) => {
    logger.error(`Erreur dans ${component || 'Application'}`, {
      message: error.message,
      stack: error.stack,
      context,
      userAction: userJourney.actions.slice(-3) // Les 3 dernières actions
    }, component);

    calculateMetrics();
  }, [calculateMetrics, userJourney.actions]);

  // Démarrer/arrêter le tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    logger.beta('Analytics tracking démarré', { sessionId: userJourney.sessionId });
    
    // Calculer les métriques toutes les 30 secondes
    const interval = setInterval(calculateMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [calculateMetrics, userJourney.sessionId]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    logger.beta('Analytics tracking arrêté', { 
      sessionId: userJourney.sessionId,
      totalDuration: userJourney.totalDuration,
      actionsCount: userJourney.actions.length
    });
  }, [userJourney]);

  // Générer un rapport complet
  const generateReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: userJourney.sessionId,
      metrics,
      userJourney: {
        ...userJourney,
        totalDuration: Date.now() - userJourney.startTime
      },
      logs: logger.getBufferedLogs(),
      analytics: logger.getAnalytics(),
      recommendations: generateRecommendations()
    };

    return JSON.stringify(report, null, 2);
  }, [metrics, userJourney]);

  // Générer des recommandations basées sur les données
  const generateRecommendations = useCallback(() => {
    const recommendations = [];

    if (metrics.errorRate > 5) {
      recommendations.push({
        type: 'error_rate',
        priority: 'high',
        message: `Taux d'erreur élevé (${metrics.errorRate}%). Vérifier les erreurs récentes.`,
        action: 'Analyser les erreurs les plus fréquentes'
      });
    }

    if (metrics.performanceMetrics.averageLoadTime > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `Temps de chargement moyen élevé (${metrics.performanceMetrics.averageLoadTime}ms)`,
        action: 'Optimiser les composants les plus lents'
      });
    }

    if (userJourney.actions.length > 100) {
      recommendations.push({
        type: 'engagement',
        priority: 'low',
        message: 'Utilisateur très actif - session longue détectée',
        action: 'Analyser le parcours pour identifier les points de friction'
      });
    }

    return recommendations;
  }, [metrics, userJourney]);

  // Export des données pour analyse externe
  const exportData = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      sessionId: userJourney.sessionId,
      metrics,
      userJourney,
      logs: logger.exportLogs(),
      recommendations: generateRecommendations()
    };

    // Créer un blob pour téléchargement
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = `beta-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    logger.audit('Export analytics data', { exportedAt: new Date().toISOString() });
  }, [metrics, userJourney, generateRecommendations]);

  // Initialisation
  useEffect(() => {
    calculateMetrics();
    const cleanup = startTracking();

    // Sauvegarder les données avant fermeture
    const handleBeforeUnload = () => {
      logger.beta('Session terminée', {
        sessionId: userJourney.sessionId,
        totalActions: userJourney.actions.length,
        totalDuration: Date.now() - userJourney.startTime
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cleanup?.();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Écouter les changements de route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackNavigation(window.location.pathname);
    }
  }, [trackNavigation]);

  return {
    metrics,
    userJourney,
    isTracking,
    trackUserAction,
    trackNavigation,
    trackError,
    generateReport,
    exportData,
    startTracking,
    stopTracking,
    calculateMetrics
  };
}