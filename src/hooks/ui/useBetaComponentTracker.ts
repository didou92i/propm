import { useBetaAnalytics } from '@/hooks/useBetaAnalytics';
import { useBetaErrorBoundary } from '@/hooks/useBetaErrorBoundary';
import { logger } from '@/utils/logger';

// Hook pour tracker les interactions dans les composants
export function useBetaComponentTracker(componentName: string) {
  const { trackUserAction, trackError } = useBetaAnalytics();
  const { logError } = useBetaErrorBoundary();

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