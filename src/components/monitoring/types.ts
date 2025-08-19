export interface MonitoringStats {
  openai: {
    tokensUsed: number;
    requestsCount: number;
    averageResponseTime: number;
    successRate: number;
    errors: Array<{
      timestamp: string;
      error: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  edgeFunctions: {
    totalCalls: number;
    averageLatency: number;
    errorRate: number;
    recentErrors: Array<{
      function: string;
      timestamp: string;
      error: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  documents: {
    totalProcessed: number;
    processingQueue: number;
    averageProcessingTime: number;
    failureRate: number;
  };
  system: {
    uptime: number;
    activeUsers: number;
    conversationsToday: number;
    memoryUsage: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
}