import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';
import { useBetaAnalytics } from './useBetaAnalytics';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface BetaError {
  error: Error;
  errorInfo: ErrorInfo;
  timestamp: number;
  component: string;
  userId?: string;
  route: string;
  userActions: string[];
}

export function useBetaErrorBoundary() {
  const [errors, setErrors] = useState<BetaError[]>([]);
  const { trackError, userJourney } = useBetaAnalytics();

  const logError = useCallback((error: Error, errorInfo: ErrorInfo, component: string = 'Unknown') => {
    const betaError: BetaError = {
      error,
      errorInfo,
      timestamp: Date.now(),
      component,
      userId: localStorage.getItem('user-id') || undefined,
      route: window.location.pathname,
      userActions: userJourney.actions.slice(-5).map(action => action.action)
    };

    // Ajouter l'erreur à la liste
    setErrors(prev => [betaError, ...prev.slice(0, 49)]); // Garder les 50 dernières erreurs

    // Logger l'erreur avec contexte enrichi
    logger.error(`Erreur React dans ${component}`, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      route: betaError.route,
      recentActions: betaError.userActions,
      props: errorInfo.errorBoundary ? 'Boundary active' : 'Sans boundary',
      timestamp: betaError.timestamp
    }, component);

    // Tracker l'erreur via les analytics
    trackError(error, component, {
      componentStack: errorInfo.componentStack,
      recentActions: betaError.userActions,
      route: betaError.route
    });

    // Logger spécifique beta
    logger.beta('Erreur capturée par Error Boundary', {
      component,
      errorType: error.name,
      hasComponentStack: !!errorInfo.componentStack,
      userActionsCount: betaError.userActions.length,
      errorFrequency: errors.filter(e => e.error.message === error.message).length + 1
    }, 'BetaErrorBoundary');

  }, [trackError, userJourney.actions, errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
    logger.audit('Erreurs beta effacées', { clearedCount: errors.length }, 'BetaErrorBoundary');
  }, [errors.length]);

  const getErrorStats = useCallback(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneMinute = 60 * 1000;

    const recentErrors = errors.filter(error => now - error.timestamp < oneHour);
    const criticalErrors = errors.filter(error => now - error.timestamp < oneMinute);
    
    const errorsByComponent = errors.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostProblematicComponent = Object.entries(errorsByComponent)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucun';

    return {
      totalErrors: errors.length,
      recentErrors: recentErrors.length,
      criticalErrors: criticalErrors.length,
      errorsByComponent,
      mostProblematicComponent,
      errorRate: recentErrors.length > 0 ? (recentErrors.length / (oneHour / oneMinute)) : 0
    };
  }, [errors]);

  const createErrorReport = useCallback(() => {
    const stats = getErrorStats();
    const report = {
      reportGenerated: new Date().toISOString(),
      sessionId: userJourney.sessionId,
      errorStats: stats,
      recentErrors: errors.slice(0, 10).map(error => ({
        timestamp: new Date(error.timestamp).toISOString(),
        component: error.component,
        message: error.error.message,
        route: error.route,
        userActions: error.userActions
      })),
      recommendations: generateRecommendations(stats)
    };

    logger.audit('Rapport d\'erreur beta généré', {
      totalErrors: stats.totalErrors,
      reportSize: JSON.stringify(report).length
    }, 'BetaErrorBoundary');

    return JSON.stringify(report, null, 2);
  }, [errors, getErrorStats, userJourney.sessionId]);

  const generateRecommendations = (stats: ReturnType<typeof getErrorStats>) => {
    const recommendations = [];

    if (stats.criticalErrors > 3) {
      recommendations.push({
        type: 'urgent',
        message: `${stats.criticalErrors} erreurs critiques dans la dernière minute`,
        action: 'Vérifier immédiatement les composants les plus problématiques'
      });
    }

    if (stats.errorRate > 1) {
      recommendations.push({
        type: 'warning',
        message: `Taux d'erreur élevé: ${stats.errorRate.toFixed(2)} erreurs/minute`,
        action: 'Analyser les erreurs récentes et leurs patterns'
      });
    }

    if (stats.mostProblematicComponent !== 'Aucun') {
      recommendations.push({
        type: 'info',
        message: `Composant le plus problématique: ${stats.mostProblematicComponent}`,
        action: `Examiner et refactoriser le composant ${stats.mostProblematicComponent}`
      });
    }

    return recommendations;
  };

  return {
    errors,
    logError,
    clearErrors,
    getErrorStats,
    createErrorReport
  };
}