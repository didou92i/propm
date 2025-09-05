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
      <Card className="glass-intense neomorphism hover-lift gradient-border border border-primary/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">OpenAI - Tokens utilisés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.openai.tokensUsed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            {stats.openai.requestsCount} requêtes
          </p>
        </CardContent>
      </Card>

      <Card className="glass-intense neomorphism hover-lift gradient-border border border-secondary/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Temps de réponse moyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-secondary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.openai.averageResponseTime}s</div>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            Taux de succès: {stats.openai.successRate}%
          </p>
        </CardContent>
      </Card>

      {/* Edge Functions Metrics */}
      <Card className="glass-intense neomorphism hover-lift gradient-border border border-accent/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Edge Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.edgeFunctions.totalCalls.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            Latence: {stats.edgeFunctions.averageLatency}ms
          </p>
        </CardContent>
      </Card>

      <Card className="glass-intense neomorphism hover-lift gradient-border border border-destructive/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Taux d'erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-destructive via-orange-500 to-red-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.edgeFunctions.errorRate}%</div>
          <Progress 
            value={stats.edgeFunctions.errorRate} 
            className="mt-2" 
            max={10}
          />
        </CardContent>
      </Card>

      {/* Document Processing Metrics */}
      <Card className="glass-intense neomorphism hover-lift gradient-border border border-primary/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Documents traités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.documents.totalProcessed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            {stats.documents.processingQueue} en file d'attente
          </p>
        </CardContent>
      </Card>

      <Card className="glass-intense neomorphism hover-lift gradient-border border border-secondary/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Temps de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-secondary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.documents.averageProcessingTime}s</div>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            Échecs: {stats.documents.failureRate}%
          </p>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card className="glass-intense neomorphism hover-lift gradient-border border border-accent/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Utilisateurs actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.system.activeUsers}</div>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            {stats.system.conversationsToday} conversations aujourd'hui
          </p>
        </CardContent>
      </Card>

      <Card className="glass-intense neomorphism hover-lift gradient-border border border-primary/15 backdrop-blur-xl shadow-glow group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground/90 tracking-wide">Utilisation mémoire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">{stats.system.memoryUsage}%</div>
          <Progress 
            value={stats.system.memoryUsage} 
            className="mt-2"
            max={100}
          />
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            Uptime: {stats.system.uptime}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}