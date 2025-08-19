import { useState, useEffect, useCallback } from 'react';
import type { MonitoringStats, HealthStatus } from '@/components/monitoring/types';

export function useMonitoringStats() {
  const [stats, setStats] = useState<MonitoringStats>({
    openai: {
      tokensUsed: 125_430,
      requestsCount: 1_254,
      averageResponseTime: 2.3,
      successRate: 98.5,
      errors: [
        { timestamp: '2024-01-15 14:30:00', error: 'Rate limit exceeded', severity: 'medium' },
        { timestamp: '2024-01-15 13:45:00', error: 'Timeout error', severity: 'low' },
        { timestamp: '2024-01-15 12:15:00', error: 'Invalid request format', severity: 'high' }
      ]
    },
    edgeFunctions: {
      totalCalls: 5_421,
      averageLatency: 450,
      errorRate: 2.1,
      recentErrors: [
        { function: 'chat-openai-stream', timestamp: '2024-01-15 15:20:00', error: 'Database connection timeout', severity: 'high' },
        { function: 'process-document', timestamp: '2024-01-15 14:55:00', error: 'File parsing error', severity: 'medium' },
        { function: 'generate-embedding', timestamp: '2024-01-15 14:30:00', error: 'OpenAI API error', severity: 'low' }
      ]
    },
    documents: {
      totalProcessed: 2_156,
      processingQueue: 12,
      averageProcessingTime: 3.8,
      failureRate: 1.2
    },
    system: {
      uptime: 99.8,
      activeUsers: 47,
      conversationsToday: 284,
      memoryUsage: 68
    }
  });

  const refreshStats = useCallback(async () => {
    console.log('Actualisation des statistiques de monitoring...');
    
    // Simulation de l'actualisation des données
    setStats(prevStats => ({
      ...prevStats,
      openai: {
        ...prevStats.openai,
        tokensUsed: prevStats.openai.tokensUsed + Math.floor(Math.random() * 100),
        requestsCount: prevStats.openai.requestsCount + Math.floor(Math.random() * 10),
        averageResponseTime: +(prevStats.openai.averageResponseTime + (Math.random() - 0.5) * 0.2).toFixed(1),
        successRate: +(Math.max(95, Math.min(100, prevStats.openai.successRate + (Math.random() - 0.5) * 2))).toFixed(1)
      },
      edgeFunctions: {
        ...prevStats.edgeFunctions,
        totalCalls: prevStats.edgeFunctions.totalCalls + Math.floor(Math.random() * 20),
        averageLatency: Math.floor(prevStats.edgeFunctions.averageLatency + (Math.random() - 0.5) * 50),
        errorRate: +(Math.max(0, Math.min(10, prevStats.edgeFunctions.errorRate + (Math.random() - 0.5) * 0.5))).toFixed(1)
      },
      documents: {
        ...prevStats.documents,
        totalProcessed: prevStats.documents.totalProcessed + Math.floor(Math.random() * 5),
        processingQueue: Math.max(0, prevStats.documents.processingQueue + Math.floor((Math.random() - 0.7) * 5)),
        averageProcessingTime: +(prevStats.documents.averageProcessingTime + (Math.random() - 0.5) * 0.3).toFixed(1)
      },
      system: {
        ...prevStats.system,
        activeUsers: Math.max(0, prevStats.system.activeUsers + Math.floor((Math.random() - 0.5) * 10)),
        conversationsToday: prevStats.system.conversationsToday + Math.floor(Math.random() * 3),
        memoryUsage: Math.max(30, Math.min(90, prevStats.system.memoryUsage + Math.floor((Math.random() - 0.5) * 10)))
      }
    }));
  }, []);

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

  useEffect(() => {
    const interval = setInterval(refreshStats, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    getHealthStatus,
    getSeverityColor
  };
}