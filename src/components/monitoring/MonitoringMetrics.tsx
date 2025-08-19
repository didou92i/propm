import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { MonitoringStats } from './types';

interface MonitoringMetricsProps {
  stats: MonitoringStats;
}

export function MonitoringMetrics({ stats }: MonitoringMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* OpenAI Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">OpenAI - Tokens utilisés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openai.tokensUsed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.openai.requestsCount} requêtes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Temps de réponse moyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openai.averageResponseTime}s</div>
          <p className="text-xs text-muted-foreground mt-1">
            Taux de succès: {stats.openai.successRate}%
          </p>
        </CardContent>
      </Card>

      {/* Edge Functions Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.edgeFunctions.totalCalls.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Latence: {stats.edgeFunctions.averageLatency}ms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Taux d'erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.edgeFunctions.errorRate}%</div>
          <Progress 
            value={stats.edgeFunctions.errorRate} 
            className="mt-2" 
            max={10}
          />
        </CardContent>
      </Card>

      {/* Document Processing Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Documents traités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents.totalProcessed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.documents.processingQueue} en file d'attente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Temps de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents.averageProcessingTime}s</div>
          <p className="text-xs text-muted-foreground mt-1">
            Échecs: {stats.documents.failureRate}%
          </p>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.system.activeUsers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.system.conversationsToday} conversations aujourd'hui
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Utilisation mémoire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.system.memoryUsage}%</div>
          <Progress 
            value={stats.system.memoryUsage} 
            className="mt-2"
            max={100}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Uptime: {stats.system.uptime}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}