import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptimizedCache } from '@/hooks/useOptimizedCache';
import { logger } from '@/utils/logger';

interface PrefetchConfig {
  enableRoutePrefetch: boolean;
  enableDataPrefetch: boolean;
  enableImagePrefetch: boolean;
  userBehaviorWeight: number;
  timeBasedWeight: number;
  maxConcurrentPrefetch: number;
}

interface UserBehavior {
  visitedRoutes: Map<string, number>;
  transitionPatterns: Map<string, string[]>;
  timeSpentOnRoutes: Map<string, number>;
  preferredAgents: string[];
}

const DEFAULT_CONFIG: PrefetchConfig = {
  enableRoutePrefetch: true,
  enableDataPrefetch: true,
  enableImagePrefetch: true,
  userBehaviorWeight: 0.7,
  timeBasedWeight: 0.3,
  maxConcurrentPrefetch: 3
};

/**
 * Hook pour le préchargement intelligent basé sur le comportement utilisateur
 */
export function useIntelligentPrefetch(config: Partial<PrefetchConfig> = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { prefetchData: cachePrefetchData, queryClient } = useOptimizedCache();
  
  const userBehavior = useRef<UserBehavior>({
    visitedRoutes: new Map(),
    transitionPatterns: new Map(),
    timeSpentOnRoutes: new Map(),
    preferredAgents: []
  });
  
  const prefetchQueue = useRef<Set<string>>(new Set());
  const routeEnterTime = useRef<number>(Date.now());
  const observer = useRef<IntersectionObserver | null>(null);
  
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Enregistre le comportement utilisateur
  const trackUserBehavior = useCallback((currentRoute: string, previousRoute?: string) => {
    const behavior = userBehavior.current;
    
    // Enregistre la visite
    behavior.visitedRoutes.set(currentRoute, (behavior.visitedRoutes.get(currentRoute) || 0) + 1);
    
    // Enregistre le temps passé sur la route précédente
    if (previousRoute) {
      const timeSpent = Date.now() - routeEnterTime.current;
      behavior.timeSpentOnRoutes.set(previousRoute, 
        (behavior.timeSpentOnRoutes.get(previousRoute) || 0) + timeSpent
      );
      
      // Enregistre le pattern de transition
      const existingPatterns = behavior.transitionPatterns.get(previousRoute) || [];
      if (!existingPatterns.includes(currentRoute)) {
        behavior.transitionPatterns.set(previousRoute, [...existingPatterns, currentRoute]);
      }
    }
    
    routeEnterTime.current = Date.now();
  }, []);

  // Prédit les prochaines routes probables
  const predictNextRoutes = useCallback((currentRoute: string): string[] => {
    const behavior = userBehavior.current;
    const predictions: Array<{ route: string; score: number }> = [];
    
    // Analyse les patterns de transition
    const transitionPatterns = behavior.transitionPatterns.get(currentRoute) || [];
    transitionPatterns.forEach(route => {
      const visits = behavior.visitedRoutes.get(route) || 0;
      const timeSpent = behavior.timeSpentOnRoutes.get(route) || 0;
      
      const behaviorScore = visits * fullConfig.userBehaviorWeight;
      const timeScore = (timeSpent / 1000) * fullConfig.timeBasedWeight; // Convertit en secondes
      
      predictions.push({
        route,
        score: behaviorScore + timeScore
      });
    });
    
    // Analyse contextuelle basée sur l'heure
    const currentHour = new Date().getHours();
    const commonRoutes = ['/jobs', '/diagnostics', '/legal'];
    
    if (currentHour >= 9 && currentHour <= 17) {
      // Heures de bureau - favorise les outils professionnels
      commonRoutes.forEach(route => {
        if (!predictions.find(p => p.route === route)) {
          predictions.push({ route, score: 0.3 });
        }
      });
    }
    
    return predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(p => p.route);
  }, [fullConfig.userBehaviorWeight, fullConfig.timeBasedWeight]);

  // Précharge les routes
  const prefetchRoute = useCallback(async (route: string) => {
    if (prefetchQueue.current.has(route) || prefetchQueue.current.size >= fullConfig.maxConcurrentPrefetch) {
      return;
    }
    
    prefetchQueue.current.add(route);
    
    try {
      // Précharge les composants de la route
      const routeImports: Record<string, () => Promise<any>> = {
        '/jobs': () => import('@/pages/Jobs'),
        '/job/create': () => import('@/pages/JobCreate'),
        '/job/manage': () => import('@/pages/JobManage'),
        '/diagnostics': () => import('@/pages/Diagnostics'),
        '/user-data-management': () => import('@/pages/UserDataManagement'),
        '/legal': () => import('@/pages/Legal'),
        '/privacy': () => import('@/pages/Privacy'),
        '/terms': () => import('@/pages/Terms')
      };
      
      const importFn = routeImports[route];
      if (importFn) {
        await importFn();
        logger.info(`Route préchargée: ${route}`, undefined, 'useIntelligentPrefetch');
      }
    } catch (error) {
      logger.warn(`Échec du préchargement de la route ${route}`, error, 'useIntelligentPrefetch');
    } finally {
      prefetchQueue.current.delete(route);
    }
  }, [fullConfig.maxConcurrentPrefetch]);

  // Précharge les données
  const prefetchDataItems = useCallback(async (dataKeys: string[]) => {
    try {
      await cachePrefetchData(dataKeys, async (key) => {
        // Simulé - remplace par tes vraies requêtes de données
        const response = await fetch(`/api/prefetch/${key}`);
        return response.json();
      });
    } catch (error) {
      logger.warn('Échec du préchargement des données', error, 'useIntelligentPrefetch');
    }
  }, [cachePrefetchData]);

  // Précharge les images visibles
  const setupImagePrefetch = useCallback(() => {
    if (!fullConfig.enableImagePrefetch || observer.current) return;
    
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src && !img.src) {
              img.src = src;
              img.onload = () => {
                img.classList.add('loaded');
              };
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    // Observe toutes les images avec data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.current?.observe(img);
    });
  }, [fullConfig.enableImagePrefetch]);

  // Préchargement intelligent basé sur l'interaction
  const handleLinkHover = useCallback(async (route: string) => {
    if (fullConfig.enableRoutePrefetch) {
      // Délai de 100ms pour éviter les préchargements accidentels
      setTimeout(() => {
        prefetchRoute(route);
      }, 100);
    }
  }, [fullConfig.enableRoutePrefetch, prefetchRoute]);

  // Préchargement proactif
  const performProactivePrefetch = useCallback(() => {
    const currentPath = location.pathname;
    const predictedRoutes = predictNextRoutes(currentPath);
    
    predictedRoutes.forEach(route => {
      prefetchRoute(route);
    });
    
    // Précharge également les données couramment utilisées
    if (fullConfig.enableDataPrefetch) {
      const commonDataKeys = ['user-profile', 'recent-conversations', 'agent-configs'];
      prefetchDataItems(commonDataKeys);
    }
  }, [location.pathname, predictNextRoutes, prefetchRoute, fullConfig.enableDataPrefetch, prefetchDataItems]);

  // Obtient les statistiques de préchargement
  const getPrefetchStats = useCallback(() => {
    const behavior = userBehavior.current;
    return {
      visitedRoutes: Object.fromEntries(behavior.visitedRoutes),
      transitionPatterns: Object.fromEntries(behavior.transitionPatterns),
      timeSpentOnRoutes: Object.fromEntries(behavior.timeSpentOnRoutes),
      currentQueueSize: prefetchQueue.current.size,
      prefetchedImagesCount: document.querySelectorAll('img.loaded').length
    };
  }, []);

  // Efface les données de comportement
  const clearBehaviorData = useCallback(() => {
    userBehavior.current = {
      visitedRoutes: new Map(),
      transitionPatterns: new Map(),
      timeSpentOnRoutes: new Map(),
      preferredAgents: []
    };
  }, []);

  // Track route changes
  useEffect(() => {
    const currentRoute = location.pathname;
    const previousRoute = sessionStorage.getItem('previousRoute');
    
    trackUserBehavior(currentRoute, previousRoute || undefined);
    sessionStorage.setItem('previousRoute', currentRoute);
    
    // Préchargement proactif après navigation
    const timeoutId = setTimeout(performProactivePrefetch, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, trackUserBehavior, performProactivePrefetch]);

  // Setup image prefetch observer
  useEffect(() => {
    setupImagePrefetch();
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [setupImagePrefetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      prefetchQueue.current.clear();
    };  
  }, []);

  return {
    handleLinkHover,
    performProactivePrefetch,
    getPrefetchStats,
    clearBehaviorData,
    prefetchRoute,
    setupImagePrefetch
  };
}