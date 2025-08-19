import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { MonitoringStats } from './types';

interface MonitoringAnalyticsProps {
  stats: MonitoringStats;
  getSeverityColor: (severity: 'low' | 'medium' | 'high') => string;
}

export function MonitoringAnalytics({ stats, getSeverityColor }: MonitoringAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* OpenAI Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Analytiques OpenAI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tokens utilisés</span>
              <Badge variant="outline">{stats.openai.tokensUsed.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Requêtes totales</span>
              <Badge variant="outline">{stats.openai.requestsCount.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Temps de réponse moyen</span>
              <Badge variant="outline">{stats.openai.averageResponseTime}s</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Taux de succès</span>
              <Badge 
                variant={stats.openai.successRate >= 98 ? "default" : "destructive"}
              >
                {stats.openai.successRate}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Erreurs récentes - Edge Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-3">
              {stats.edgeFunctions.recentErrors.map((error, index) => (
                <div key={index} className="border-b border-border pb-2 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{error.function}</span>
                    <Badge 
                      variant="outline" 
                      className={getSeverityColor(error.severity)}
                    >
                      {error.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{error.error}</p>
                  <p className="text-xs text-muted-foreground">{error.timestamp}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* OpenAI Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Erreurs récentes - OpenAI</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-3">
              {stats.openai.errors.map((error, index) => (
                <div key={index} className="border-b border-border pb-2 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">OpenAI API</span>
                    <Badge 
                      variant="outline" 
                      className={getSeverityColor(error.severity)}
                    >
                      {error.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{error.error}</p>
                  <p className="text-xs text-muted-foreground">{error.timestamp}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>État du système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Disponibilité</span>
              <Badge 
                variant={stats.system.uptime >= 99.5 ? "default" : stats.system.uptime >= 99 ? "secondary" : "destructive"}
              >
                {stats.system.uptime}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Utilisateurs actifs</span>
              <Badge variant="outline">{stats.system.activeUsers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Conversations aujourd'hui</span>
              <Badge variant="outline">{stats.system.conversationsToday}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Utilisation mémoire</span>
              <Badge 
                variant={stats.system.memoryUsage <= 75 ? "default" : stats.system.memoryUsage <= 85 ? "secondary" : "destructive"}
              >
                {stats.system.memoryUsage}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}