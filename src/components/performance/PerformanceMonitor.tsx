import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  HardDrive, 
  Wifi,
  Zap,
  Eye,
  EyeOff 
} from 'lucide-react';
import { useRealTimePerformanceMonitor } from '@/hooks/useRealTimePerformanceMonitor';
import { useIncrementalSearch } from '@/hooks/useIncrementalSearch';
import { useIntelligentPrefetch } from '@/hooks/useIntelligentPrefetch';

/**
 * Composant de surveillance de performance en temps réel
 */
export const PerformanceMonitor: React.FC = () => {
  const {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    generateReport
  } = useRealTimePerformanceMonitor();

  const { getSearchStats } = useIncrementalSearch();
  const { getPrefetchStats } = useIntelligentPrefetch();

  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const getMetricColor = (value: number, threshold: number, reverse = false) => {
    const ratio = value / threshold;
    if (reverse) {
      if (ratio < 0.7) return 'destructive';
      if (ratio < 0.9) return 'secondary';
      return 'default';
    } else {
      if (ratio > 1.5) return 'destructive';
      if (ratio > 1) return 'secondary';
      return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    return `${bytes} MB`;
  };

  const formatMs = (ms: number) => {
    return `${ms} ms`;
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 will-change-transform"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] z-50 shadow-lg glass will-change-contents">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
            <Badge variant={isMonitoring ? 'default' : 'secondary'} className="text-xs">
              {isMonitoring ? 'Actif' : 'Inactif'}
            </Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {/* Contrôles */}
        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggleMonitoring}
            className="will-change-transform"
          >
            {isMonitoring ? 'Arrêter' : 'Démarrer'}
          </Button>
          {alerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAlerts}>
              Effacer alertes ({alerts.length})
            </Button>
          )}
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span className="text-xs font-medium">Mémoire</span>
            </div>
            <Badge variant={getMetricColor(metrics.memoryUsage, 100)} className="text-xs">
              {formatBytes(metrics.memoryUsage)}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span className="text-xs font-medium">FPS</span>
            </div>
            <Badge variant={getMetricColor(metrics.fps, 50, true)} className="text-xs">
              {metrics.fps}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span className="text-xs font-medium">Rendu</span>
            </div>
            <Badge variant={getMetricColor(metrics.renderTime, 16)} className="text-xs">
              {formatMs(metrics.renderTime)}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              <span className="text-xs font-medium">Réseau</span>
            </div>
            <Badge variant={getMetricColor(metrics.networkLatency, 1000)} className="text-xs">
              {formatMs(metrics.networkLatency)}
            </Badge>
          </div>
        </div>

        {/* Détails étendus */}
        {showDetails && (
          <div className="space-y-3 border-t pt-3">
            <div>
              <div className="text-xs font-medium mb-2">Cache Performance</div>
              <div className="flex justify-between text-xs">
                <span>Taux de réussite</span>
                <span>{metrics.cacheHitRate}%</span>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-1" />
            </div>

            <div>
              <div className="text-xs font-medium mb-2">Nœuds DOM</div>
              <div className="flex justify-between text-xs">
                <span>Total</span>
                <span>{metrics.domNodeCount}</span>
              </div>
              <Progress 
                value={Math.min((metrics.domNodeCount / 5000) * 100, 100)} 
                className="h-1" 
              />
            </div>

            {/* Statistiques de recherche */}
            <div>
              <div className="text-xs font-medium mb-2">Recherche & Cache</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Recherches en cache</span>
                  <span>{getSearchStats().cacheSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Préchargements</span>
                  <span>{getPrefetchStats().currentQueueSize}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Alertes
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {alerts.slice(-3).map(alert => (
                <Alert key={alert.id} className="py-2">
                  <AlertDescription className="text-xs">
                    <div className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Badge 
                        variant={alert.type === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.type}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showDetails && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const report = generateReport();
                if (report) {
                  // Production: removed debug logging
                  // Vous pouvez ici implémenter l'export ou l'envoi du rapport
                }
              }}
              className="text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Rapport
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};