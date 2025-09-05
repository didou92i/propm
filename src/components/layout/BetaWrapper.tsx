import React, { useEffect, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'sonner';
import { AlertTriangle, Bug, Activity } from 'lucide-react';
import { logger } from '@/utils/logger';
import { useBetaAnalytics } from '@/hooks/useBetaAnalytics';
import { useBetaErrorBoundary } from '@/hooks/useBetaErrorBoundary';
import { BetaIndicator } from '@/components/common/BetaIndicator';
import { Button } from '@/components/ui/button';

interface BetaWrapperProps {
  children: ReactNode;
  component?: string;
}

function ErrorFallback({ error, resetErrorBoundary, componentName }: { 
  error: Error; 
  resetErrorBoundary: () => void;
  componentName?: string;
}) {
  const { createErrorReport } = useBetaErrorBoundary();

  useEffect(() => {
    // Générer automatiquement un rapport d'erreur
    const report = createErrorReport();
    console.error('Beta Error Report:', report);
    
    // Toast d'alerte pour l'erreur
    toast.error('Erreur détectée dans la beta', {
      description: `Composant: ${componentName || 'Inconnu'}`,
      duration: 10000,
      action: {
        label: 'Voir détails',
        onClick: () => {
          console.log('Rapport d\'erreur complet:', report);
          navigator.clipboard?.writeText(report);
          toast.info('Rapport copié dans le presse-papier');
        }
      }
    });
  }, [error, componentName, createErrorReport]);

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-destructive/5 border border-destructive/20 rounded-lg space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Erreur Beta Détectée</h3>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Une erreur s'est produite dans le composant: <strong>{componentName || 'Inconnu'}</strong>
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          {error.message}
        </p>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetErrorBoundary}
          className="flex items-center gap-1"
        >
          <Activity className="w-4 h-4" />
          Réessayer
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => {
            const report = createErrorReport();
            navigator.clipboard?.writeText(report);
            toast.success('Rapport d\'erreur copié');
          }}
          className="flex items-center gap-1"
        >
          <Bug className="w-4 h-4" />
          Copier le rapport
        </Button>
      </div>

      <BetaIndicator className="mt-2" showMetrics />
    </div>
  );
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

// HOC pour wrapper automatiquement les composants avec BetaWrapper
export function withBetaLogging<P extends object>(
  Component: React.ComponentType<P>, 
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Component';
    
    return (
      <BetaWrapper component={name}>
        <Component {...props} />
      </BetaWrapper>
    );
  };

  WrappedComponent.displayName = `withBetaLogging(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook pour tracker les interactions dans les composants
export function useBetaComponentTracker(componentName: string) {
  const { trackUserAction, trackError } = useBetaAnalytics();

  const trackClick = (element: string, data?: any) => {
    logger.user(`click_${element}`, {
      type: 'click',
      element,
      metadata: data
    }, componentName);
    trackUserAction(`click_${element}`, componentName);
  };

  const trackInput = (field: string, value: any) => {
    logger.user(`input_${field}`, {
      type: 'input',
      element: field,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }, componentName);
    trackUserAction(`input_${field}`, componentName);
  };

  const trackFeatureUse = (feature: string, data?: any) => {
    logger.user(`feature_${feature}`, {
      type: 'feature_usage',
      element: feature,
      metadata: data
    }, componentName);
    trackUserAction(`feature_${feature}`, componentName);
  };

  const trackPerformance = (operation: string, startTime: number, endTime?: number) => {
    const duration = (endTime || performance.now()) - startTime;
    logger.trackPerformance(`${componentName}_${operation}`, duration, 'ms', {
      component: componentName,
      operation
    });
  };

  const trackAsyncOperation = async <T,>(
    operation: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    logger.beta(`Début opération async: ${operation}`, { component: componentName }, componentName);
    
    try {
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      
      logger.beta(`Fin opération async: ${operation}`, { 
        component: componentName,
        duration,
        success: true 
      }, componentName);
      
      trackPerformance(`async_${operation}`, startTime);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error(`Erreur opération async: ${operation}`, {
        component: componentName,
        duration,
        error
      }, componentName);
      
      trackError(error as Error, componentName, { operation, duration });
      throw error;
    }
  };

  return {
    trackClick,
    trackInput,
    trackFeatureUse,
    trackPerformance,
    trackAsyncOperation
  };
}