import React, { useEffect, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useBetaAnalytics } from '@/hooks/useBetaAnalytics';
import { useBetaErrorBoundary } from '@/hooks/useBetaErrorBoundary';
import { ErrorFallback } from './ErrorFallback';

interface BetaWrapperProps {
  children: ReactNode;
  component?: string;
}

export function BetaWrapper({ children, component = 'UnknownComponent' }: BetaWrapperProps) {
  const { trackUserAction, trackError } = useBetaAnalytics();
  const { logError } = useBetaErrorBoundary();

  // Logger le montage du composant
  useEffect(() => {
    logger.beta(`Composant ${component} monté`, {
      timestamp: Date.now(),
      route: window.location.pathname
    }, component);

    trackUserAction(`mount_${component}`, component);

    // Logger le démontage
    return () => {
      logger.beta(`Composant ${component} démonté`, {
        timestamp: Date.now()
      }, component);
    };
  }, [component, trackUserAction]);

  // Gestionnaire d'erreur personnalisé
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    logError(error, errorInfo, component);
    trackError(error, component, { componentStack: errorInfo.componentStack });
    
    // Log détaillé pour la beta
    logger.error(`Erreur dans BetaWrapper - ${component}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      route: window.location.pathname,
      timestamp: new Date().toISOString()
    }, component);
  };

  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} componentName={component} />
      )}
      onError={handleError}
      onReset={() => {
        logger.beta(`Erreur réinitialisée pour ${component}`, {}, component);
        trackUserAction(`error_reset_${component}`, component);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}