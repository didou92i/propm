import { useState, useEffect, useCallback } from 'react';
import type { MonitoringStats, HealthStatus } from '@/components/monitoring/types';
import { supabase } from '@/integrations/supabase/client';

export function useMonitoringStats() {
  const [stats, setStats] = useState<MonitoringStats>({
    openai: {
      tokensUsed: 0,
      requestsCount: 0,
      averageResponseTime: 0,
      successRate: 100,
      errors: []
    },
    edgeFunctions: {
      totalCalls: 0,
      averageLatency: 0,
      errorRate: 0,
      recentErrors: []
    },
    documents: {
      totalProcessed: 0,
      processingQueue: 0,
      averageProcessingTime: 0,
      failureRate: 0
    },
    system: {
      uptime: 100,
      activeUsers: 0,
      conversationsToday: 0,
      memoryUsage: 0
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('useMonitoringStats: fetching real data from Edge Function');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-monitoring-stats', {
        method: 'GET'
      });

      if (error) {
        console.error('useMonitoringStats: error fetching stats', error);
        return;
      }

      if (data) {
        console.log('useMonitoringStats: received real stats', data);
        setStats(data);
      }
    } catch (error) {
      console.error('useMonitoringStats: exception', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const getHealthStatus = useCallback((): HealthStatus => {
    const issues: string[] = [];
    
    if (stats.openai.successRate < 95) {
      issues.push(`Taux de succès OpenAI faible: ${stats.openai.successRate}%`);
    }
    
    if (stats.openai.averageResponseTime > 5) {
      issues.push(`Temps de réponse OpenAI élevé: ${stats.openai.averageResponseTime}s`);
    }
    
    if (stats.edgeFunctions.errorRate > 5) {
      issues.push(`Taux d'erreur Edge Functions élevé: ${stats.edgeFunctions.errorRate}%`);
    }
    
    if (stats.edgeFunctions.averageLatency > 1000) {
      issues.push(`Latence Edge Functions élevée: ${stats.edgeFunctions.averageLatency}ms`);
    }
    
    if (stats.documents.processingQueue > 50) {
      issues.push(`File d'attente de traitement importante: ${stats.documents.processingQueue} documents`);
    }
    
    if (stats.documents.failureRate > 5) {
      issues.push(`Taux d'échec traitement documents élevé: ${stats.documents.failureRate}%`);
    }
    
    if (stats.system.memoryUsage > 85) {
      issues.push(`Utilisation mémoire élevée: ${stats.system.memoryUsage}%`);
    }
    
    if (stats.system.uptime < 99) {
      issues.push(`Disponibilité système faible: ${stats.system.uptime}%`);
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (issues.length > 0) {
      const criticalIssues = issues.filter(issue => 
        issue.includes('faible') || 
        issue.includes('élevé') && (issue.includes('erreur') || issue.includes('échec'))
      );
      
      status = criticalIssues.length > 0 ? 'critical' : 'warning';
    }

    return { status, issues };
  }, [stats]);

  const getSeverityColor = useCallback((severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'low':
        return 'text-yellow-600';
      case 'medium':
        return 'text-orange-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  }, []);

  // Charger les stats au montage
  useEffect(() => {
    refreshStats();
  }, []);

  // Auto-refresh intelligent avec pause si tab inactive
  useEffect(() => {
    const refreshInterval = import.meta.env.PROD ? 60000 : 30000; // 1min en prod, 30s en dev
    let interval: NodeJS.Timeout | null = null;

    const startRefresh = () => {
      if (interval) return;
      interval = setInterval(refreshStats, refreshInterval);
    };

    const stopRefresh = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Gérer la visibilité de la page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('useMonitoringStats: pausing auto-refresh (tab inactive)');
        stopRefresh();
      } else {
        console.log('useMonitoringStats: resuming auto-refresh (tab active)');
        refreshStats(); // Refresh immédiat au retour
        startRefresh();
      }
    };

    // Démarrer auto-refresh si la page est visible
    if (!document.hidden) {
      startRefresh();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopRefresh();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    getHealthStatus,
    getSeverityColor
  };
}