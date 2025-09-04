import { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/performance/usePerformanceMonitor';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, TrendingUp } from 'lucide-react';

interface PerformanceIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function PerformanceIndicator({ className = '', compact = false }: PerformanceIndicatorProps) {
  const { 
    currentMetrics, 
    performanceGrade, 
    averageResponseTime,
    responseCount,
    isOptimizationActive
  } = usePerformanceMonitor();

  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Afficher l'indicateur seulement après quelques requêtes
    setShowIndicator(responseCount >= 3 && isOptimizationActive);
  }, [responseCount, isOptimizationActive]);

  if (!showIndicator) return null;

  const getPerformanceColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getPerformanceIcon = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return <Zap className="w-3 h-3" />;
      case 'B': return <TrendingUp className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const formatTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${Math.round(time / 100) / 10}s`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Badge 
          variant="outline" 
          className={`text-xs px-2 py-0.5 ${getPerformanceColor(performanceGrade)}`}
        >
          <div className="flex items-center gap-1">
            {getPerformanceIcon(performanceGrade)}
            <span>{performanceGrade}</span>
          </div>
        </Badge>
        {averageResponseTime > 0 && (
          <span className="text-xs text-muted-foreground">
            ~{formatTime(averageResponseTime)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`text-xs px-2 py-1 ${getPerformanceColor(performanceGrade)}`}
      >
        <div className="flex items-center gap-1.5">
          {getPerformanceIcon(performanceGrade)}
          <span>Performance {performanceGrade}</span>
        </div>
      </Badge>
      
      {averageResponseTime > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span title={`Temps de réponse moyen: ${formatTime(averageResponseTime)}`}>
            {formatTime(averageResponseTime)} avg
          </span>
          {responseCount > 1 && (
            <span className="text-muted-foreground/70">
              ({responseCount} req.)
            </span>
          )}
        </div>
      )}
      
      {isOptimizationActive && (
        <div className="text-xs text-emerald-600 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Optimisé</span>
        </div>
      )}
    </div>
  );
}