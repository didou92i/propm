import { useCallback } from 'react';

/**
 * Hook pour fragmenter les tâches longues et réduire le Total Blocking Time
 * Utilise requestIdleCallback pour exécuter les tâches non-critiques
 */
export const useTaskScheduler = () => {
  /**
   * Exécute une tâche pendant les périodes d'inactivité du navigateur
   */
  const scheduleIdleTask = useCallback((task: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(() => {
        task();
      }, { timeout });
    } else {
      // Fallback pour navigateurs ne supportant pas requestIdleCallback
      return setTimeout(task, 1);
    }
  }, []);

  /**
   * Fragmente une tâche longue en plusieurs micro-tâches
   * pour éviter de bloquer le thread principal
   */
  const breakUpLongTask = useCallback(async (
    items: any[],
    processor: (item: any) => void,
    chunkSize = 50
  ) => {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      // Traiter le chunk
      chunk.forEach(processor);
      
      // Céder le contrôle au navigateur entre les chunks
      await new Promise(resolve => {
        if ('scheduler' in window && 'yield' in (window as any).scheduler) {
          (window as any).scheduler.yield().then(resolve);
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }, []);

  /**
   * Exécute une fonction en différant son exécution
   * pour ne pas bloquer le rendu initial
   */
  const deferExecution = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    delay = 0
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      setTimeout(() => fn(...args), delay);
    };
  }, []);

  return {
    scheduleIdleTask,
    breakUpLongTask,
    deferExecution,
  };
};
