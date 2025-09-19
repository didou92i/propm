import { useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/logger';

interface PerformanceMetrics {
  pageLoadTime: number;
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint  
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  memoryUsage: number;
  sessionDuration: number;
}

interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export function useClientPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const metricsIntervalRef = useRef<NodeJS.Timeout>();

  // Seuils d'alerte optimisés
  const thresholds = {
    pageLoadTime: 3000, // 3 secondes
    ttfb: 800, // 800ms
    fcp: 1800, // 1.8 secondes  
    lcp: 2500, // 2.5 secondes
    cls: 0.1, // Score CLS
    fid: 100, // 100ms
    memoryUsage: 100, // 100MB
    sessionDuration: 300000 // 5 minutes = alerte longue session
  };

  const collectWebVitals = (): Partial<PerformanceMetrics> => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const metrics: Partial<PerformanceMetrics> = {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      ttfb: navigation ? navigation.responseStart - navigation.fetchStart : 0,
    };

    // First Contentful Paint
    const fcpEntry = paint.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime;
    }

    // Memory Usage (si disponible)
    if ((performance as any).memory) {
      const memInfo = (performance as any).memory;
      metrics.memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // MB
    }

    // Session Duration
    metrics.sessionDuration = Date.now() - sessionStartRef.current;

    return metrics;
  };

  const checkThresholds = (currentMetrics: Partial<PerformanceMetrics>) => {
    const newAlerts: PerformanceAlert[] = [];

    Object.entries(currentMetrics).forEach(([metric, value]) => {
      const threshold = thresholds[metric as keyof typeof thresholds];
      if (threshold && value !== undefined && value > threshold) {
        const alertType = value > threshold * 1.5 ? 'critical' : 'warning';
        
        newAlerts.push({
          type: alertType,
          metric,
          value,
          threshold,
          timestamp: new Date()
        });

        if (alertType === 'critical') {
          logger.warn(`Performance critique détectée: ${metric} = ${value}`, null, 'PerformanceMonitor');
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-4), ...newAlerts]); // Garder les 5 dernières alertes
    }
  };

  const measureLCP = () => {
    // Observer pour Largest Contentful Paint
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        setMetrics(prev => prev ? { 
          ...prev, 
          lcp: lastEntry.startTime 
        } : null);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      return () => observer.disconnect();
    } catch (error) {
      // Fallback si LCP n'est pas supporté
      return () => {};
    }
  };

  const measureCLS = () => {
    // Observer pour Cumulative Layout Shift  
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        setMetrics(prev => prev ? { 
          ...prev, 
          cls: clsValue 
        } : null);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      return () => observer.disconnect();
    } catch (error) {
      return () => {};
    }
  };

  const measureFID = () => {
    // Observer pour First Input Delay
    try {
      const observer = new PerformanceObserver((list) => {
        const firstEntry = list.getEntries()[0];
        
        setMetrics(prev => prev ? { 
          ...prev, 
          fid: (firstEntry as any).processingStart - firstEntry.startTime 
        } : null);
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      
      return () => observer.disconnect();
    } catch (error) {
      return () => {};
    }
  };

  const startPerformanceMonitoring = () => {
    // Collecte initiale
    const initialMetrics = collectWebVitals();
    setMetrics(prev => ({ 
      pageLoadTime: 0,
      ttfb: 0, 
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      memoryUsage: 0,
      sessionDuration: 0,
      ...prev,
      ...initialMetrics 
    }));

    // Monitoring continu
    metricsIntervalRef.current = setInterval(() => {
      const currentMetrics = collectWebVitals();
      
      setMetrics(prev => prev ? { ...prev, ...currentMetrics } : null);
      checkThresholds(currentMetrics);
    }, 5000); // Vérification toutes les 5 secondes
  };

  useEffect(() => {
    // Démarrer le monitoring après que la page soit chargée
    if (document.readyState === 'complete') {
      startPerformanceMonitoring();
    } else {
      window.addEventListener('load', startPerformanceMonitoring);
    }

    // Configurer les observers Web Vitals
    const lcpCleanup = measureLCP();
    const clsCleanup = measureCLS(); 
    const fidCleanup = measureFID();

    return () => {
      window.removeEventListener('load', startPerformanceMonitoring);
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      lcpCleanup();
      clsCleanup();
      fidCleanup();
    };
  }, []);

  const clearAlerts = () => setAlerts([]);
  
  const getPerformanceGrade = (): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (!metrics) return 'F';
    
    let score = 100;
    
    // Pénalités basées sur les métriques
    if (metrics.lcp > 2500) score -= 20;
    if (metrics.fcp > 1800) score -= 15;
    if (metrics.cls > 0.1) score -= 15;
    if (metrics.fid > 100) score -= 10;
    if (metrics.ttfb > 800) score -= 10;
    if (metrics.memoryUsage > 100) score -= 10;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B'; 
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return {
    metrics,
    alerts,
    clearAlerts,
    performanceGrade: getPerformanceGrade(),
    isMonitoring: !!metricsIntervalRef.current
  };
}