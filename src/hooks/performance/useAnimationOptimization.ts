import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook pour optimiser les animations avec will-change et gestion de performance
 */
export function useAnimationOptimization() {
  const animatingElements = useRef<Set<HTMLElement>>(new Set());

  // Optimise un élément pour l'animation
  const optimizeForAnimation = useCallback((element: HTMLElement, properties: string[] = ['transform', 'opacity']) => {
    if (!element) return;

    element.style.willChange = properties.join(', ');
    element.classList.add('animate-optimized');
    animatingElements.current.add(element);
  }, []);

  // Nettoie les optimisations après animation
  const cleanupAnimation = useCallback((element: HTMLElement) => {
    if (!element) return;

    element.style.willChange = 'auto';
    element.classList.remove('animate-optimized');
    element.classList.add('animate-complete');
    animatingElements.current.delete(element);

    // Nettoie la classe après un court délai
    setTimeout(() => {
      element.classList.remove('animate-complete');
    }, 100);
  }, []);

  // Optimise une liste d'éléments
  const optimizeList = useCallback((container: HTMLElement) => {
    if (!container) return;

    container.style.willChange = 'scroll-position';
    container.classList.add('virtualized-list');

    const items = container.querySelectorAll('[data-virtualized-item]');
    items.forEach(item => {
      if (item instanceof HTMLElement) {
        item.style.willChange = 'transform';
        item.classList.add('virtualized-item');
      }
    });
  }, []);

  // Optimise les composants de chat
  const optimizeChatComponents = useCallback(() => {
    const messages = document.querySelectorAll('[data-message]');
    const inputs = document.querySelectorAll('[data-chat-input]');

    messages.forEach(message => {
      if (message instanceof HTMLElement) {
        message.classList.add('chat-message');
      }
    });

    inputs.forEach(input => {
      if (input instanceof HTMLElement) {
        input.classList.add('chat-input');
      }
    });
  }, []);

  // Optimise les modals
  const optimizeModal = useCallback((overlay: HTMLElement, content: HTMLElement) => {
    if (overlay) {
      overlay.classList.add('modal-overlay');
    }
    if (content) {
      content.classList.add('modal-content');
      optimizeForAnimation(content);
    }
  }, [optimizeForAnimation]);

  // Animation avec callback de nettoyage
  const animateWithCleanup = useCallback((
    element: HTMLElement,
    animation: () => Promise<void> | void,
    properties?: string[]
  ) => {
    optimizeForAnimation(element, properties);
    
    const result = animation();
    
    if (result instanceof Promise) {
      return result.finally(() => cleanupAnimation(element));
    } else {
      // Pour les animations synchrones, nettoie après un délai
      setTimeout(() => cleanupAnimation(element), 300);
      return Promise.resolve();
    }
  }, [optimizeForAnimation, cleanupAnimation]);

  // Nettoie tous les éléments en cours d'animation
  useEffect(() => {
    return () => {
      animatingElements.current.forEach(element => {
        cleanupAnimation(element);
      });
      animatingElements.current.clear();
    };
  }, [cleanupAnimation]);

  // Observer de performance pour détecter les animations coûteuses
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.duration > 16) {
            console.warn(`Animation lente détectée: ${entry.name} (${entry.duration}ms)`);
          }
        });
      });

      try {
        performanceObserver.current.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('PerformanceObserver non supporté:', error);
      }
    }

    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, []);

  return {
    optimizeForAnimation,
    cleanupAnimation,
    optimizeList,
    optimizeChatComponents,
    optimizeModal,
    animateWithCleanup
  };
}