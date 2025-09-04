import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Hash } from 'lucide-react';

interface StreamingPerformanceIndicatorProps {
  performance?: {
    firstTokenLatency: number;
    tokenCount: number;
    tokensPerSecond: number;
  };
  isStreaming: boolean;
}

export function StreamingPerformanceIndicator({ 
  performance, 
  isStreaming 
}: StreamingPerformanceIndicatorProps) {
  // Only show in development or when performance data is available
  if (!performance && !isStreaming) return null;
  
  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 500) return 'bg-green-500/10 text-green-600 border-green-200';
    if (ms < 1000) return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  };

  const getSpeedColor = (tps: number) => {
    if (tps > 30) return 'bg-green-500/10 text-green-600 border-green-200';
    if (tps > 15) return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  };

  if (isStreaming) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Streaming en temps réel...</span>
        </div>
      </div>
    );
  }

  if (performance) {
    return (
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        {performance.firstTokenLatency > 0 && (
          <Badge 
            variant="outline" 
            className={`text-xs px-1.5 py-0.5 ${getLatencyColor(performance.firstTokenLatency)}`}
          >
            <Clock className="w-3 h-3 mr-1" />
            {formatLatency(performance.firstTokenLatency)}
          </Badge>
        )}
        
        {performance.tokensPerSecond > 0 && (
          <Badge 
            variant="outline" 
            className={`text-xs px-1.5 py-0.5 ${getSpeedColor(performance.tokensPerSecond)}`}
          >
            <Zap className="w-3 h-3 mr-1" />
            {Math.round(performance.tokensPerSecond)} t/s
          </Badge>
        )}
        
        {performance.tokenCount > 0 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-600 border-blue-200">
            <Hash className="w-3 h-3 mr-1" />
            {performance.tokenCount} tokens
          </Badge>
        )}
      </div>
    );
  }

  return null;
}