import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  interactionDelay: number;
  networkLatency: number;
  cacheHitRate: number;
  fps: number;
  domNodeCount: number;
  bundleSize: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: keyof PerformanceMetrics;
  threshold: number;
  currentValue: number;
  timestamp: number;
}

interface ThresholdConfig {
  memoryUsage: number; // MB
  renderTime: number; // ms
  interactionDelay: number; // ms
  networkLatency: number; // ms
  cacheHitRate: number; // %
  fps: number;
  domNodeCount: number;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  memoryUsage: 100, // 100MB
  renderTime: 16, // 16ms (60fps)
  interactionDelay: 100, // 100ms
  networkLatency: 1000, // 1s
  cacheHitRate: 80, // 80%
  fps: 50,
  domNodeCount: 5000
};

/**
 * Hook pour la surveillance de performance en temps réel avec alertes
 */
export function useRealTimePerformanceMonitor(thresholds: Partial<ThresholdConfig> = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    interactionDelay: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    fps: 0,
    domNodeCount: 0,
    bundleSize: 0
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const metricsHistory = useRef<PerformanceMetrics[]>([]);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const frameId = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  
  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Collecte des métriques de mémoire
  const collectMemoryMetrics = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convertit en MB
    }
    return 0;
  }, []);

  // Mesure du temps de rendu
  const measureRenderTime = useCallback(() => {
    if (performanceObserver.current) {
      performanceObserver.current.disconnect();
    }

    performanceObserver.current = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalRenderTime = 0;
      let count = 0;

      entries.forEach(entry => {
        if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
          totalRenderTime += entry.duration;
          count++;
        }
      });

      if (count > 0) {
        setMetrics(prev => ({
          ...prev,
          renderTime: Math.round(totalRenderTime / count)
        }));
      }
    });

    try {
      performanceObserver.current.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      logger.warn('PerformanceObserver non supporté', error, 'useRealTimePerformanceMonitor');
    }
  }, []);

  // Mesure de la latence réseau
  const measureNetworkLatency = useCallback(async (): Promise<number> => {
    try {
      const start = performance.now();
      
      // Test avec une requête légère vers l'API
      await fetch('/api/health', {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      return Math.round(performance.now() - start);
    } catch (error) {
      logger.warn('Impossible de mesurer la latence réseau', error, 'useRealTimePerformanceMonitor');
      return 0;
    }
  }, []);

  // Calcul du FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
      
      setMetrics(prev => ({
        ...prev,
        fps
      }));
      
      frameCount.current = 0;
      lastFrameTime.current = now;
    }
    
    if (isMonitoring) {
      frameId.current = requestAnimationFrame(calculateFPS);
    }
  }, [isMonitoring]);

  // Compte les nœuds DOM
  const countDOMNodes = useCallback((): number => {
    return document.querySelectorAll('*').length;
  }, []);

  // Collecte toutes les métriques
  const collectAllMetrics = useCallback(async () => {
    const newMetrics: PerformanceMetrics = {
      memoryUsage: collectMemoryMetrics(),
      renderTime: metrics.renderTime, // Mis à jour par l'observer
      interactionDelay: 0, // Sera calculé lors des interactions
      networkLatency: await measureNetworkLatency(),
      cacheHitRate: 85, // Placeholder - sera calculé par le cache
      fps: metrics.fps, // Mis à jour par calculateFPS
      domNodeCount: countDOMNodes(),
      bundleSize: 0 // Placeholder - pourrait être calculé au build
    };

    setMetrics(newMetrics);
    
    // Garde un historique des 100 dernières mesures
    metricsHistory.current.push(newMetrics);
    if (metricsHistory.current.length > 100) {
      metricsHistory.current.shift();
    }

    checkThresholds(newMetrics);
  }, [collectMemoryMetrics, measureNetworkLatency, countDOMNodes, metrics.renderTime, metrics.fps]);

  // Vérifie les seuils et génère des alertes
  const checkThresholds = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    Object.entries(config).forEach(([key, threshold]) => {
      const metricKey = key as keyof PerformanceMetrics;
      const currentValue = currentMetrics[metricKey];
      
      let shouldAlert = false;
      let alertType: 'warning' | 'error' | 'info' = 'warning';

      switch (metricKey) {
        case 'memoryUsage':
        case 'renderTime':
        case 'interactionDelay':
        case 'networkLatency':
        case 'domNodeCount':
          shouldAlert = currentValue > threshold;
          alertType = currentValue > threshold * 1.5 ? 'error' : 'warning';
          break;
        case 'cacheHitRate':
        case 'fps':
          shouldAlert = currentValue < threshold;
          alertType = currentValue < threshold * 0.7 ? 'error' : 'warning';
          break;
      }

      if (shouldAlert) {
        newAlerts.push({
          id: `${metricKey}_${Date.now()}`,
          type: alertType,
          message: `${metricKey}: ${currentValue} (seuil: ${threshold})`,
          metric: metricKey,
          threshold,
          currentValue,
          timestamp: Date.now()
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-10), ...newAlerts]); // Garde les 10 dernières alertes
    }
  }, [config]);

  // Démarre la surveillance
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    measureRenderTime();
    calculateFPS();
    
    // Collecte les métriques toutes les 5 secondes
    const interval = setInterval(collectAllMetrics, 5000);
    
    return () => {
      clearInterval(interval);
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [measureRenderTime, calculateFPS, collectAllMetrics]);

  // Arrête la surveillance
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
  }, []);

  // Obtient l'historique des métriques
  const getMetricsHistory = useCallback(() => {
    return metricsHistory.current;
  }, []);

  // Efface les alertes
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Génère un rapport de performance
  const generateReport = useCallback(() => {
    const history = metricsHistory.current;
    if (history.length === 0) return null;

    const averages = history.reduce((acc, metric) => {
      Object.keys(metric).forEach(key => {
        const k = key as keyof PerformanceMetrics;
        acc[k] = (acc[k] || 0) + metric[k];
      });
      return acc;
    }, {} as PerformanceMetrics);

    Object.keys(averages).forEach(key => {
      const k = key as keyof PerformanceMetrics;
      averages[k] = Math.round(averages[k] / history.length);
    });

    return {
      current: metrics,
      averages,
      alertCount: alerts.length,
      samplesCount: history.length,
      generatedAt: new Date().toISOString()
    };
  }, [metrics, alerts.length]);

  // Démarre automatiquement en développement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [startMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getMetricsHistory,
    clearAlerts,
    generateReport,
    collectAllMetrics
  };
}