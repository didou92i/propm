import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Bug, Zap } from 'lucide-react';
import { useBetaAnalytics } from '@/hooks/useBetaAnalytics';

interface BetaIndicatorProps {
  className?: string;
  showMetrics?: boolean;
}

export function BetaIndicator({ className = "", showMetrics = false }: BetaIndicatorProps) {
  const { metrics, isTracking } = useBetaAnalytics();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className="bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
      >
        <Activity className={`w-3 h-3 mr-1 ${isTracking ? 'animate-pulse' : ''}`} />
        BETA
      </Badge>
      
      {showMetrics && (
        <>
          {metrics.errorRate > 0 && (
            <Badge variant="destructive" className="text-xs">
              <Bug className="w-3 h-3 mr-1" />
              {metrics.errorRate.toFixed(1)}% erreurs
            </Badge>
          )}
          
          {metrics.performanceMetrics.averageLoadTime > 100 && (
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              {metrics.performanceMetrics.averageLoadTime.toFixed(0)}ms
            </Badge>
          )}
        </>
      )}
    </div>
  );
}