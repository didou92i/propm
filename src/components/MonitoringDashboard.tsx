import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Clock, Zap, Database, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface MonitoringStats {
  openai: {
    tokensUsed: number;
    tokensLimit: number;
    requestsToday: number;
    averageResponseTime: number;
    errorRate: number;
  };
  edgeFunctions: {
    totalInvocations: number;
    successRate: number;
    averageExecutionTime: number;
    memoryUsage: number;
    errors: Array<{
      function: string;
      message: string;
      timestamp: Date;
      severity: "low" | "medium" | "high";
    }>;
  };
  documents: {
    totalProcessed: number;
    processingSuccessRate: number;
    averageProcessingTime: number;
    storageUsed: number;
  };
  system: {
    uptime: number;
    lastIncident: Date | null;
    activeUsers: number;
    conversationsToday: number;
  };
}

export function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats>({
    openai: {
      tokensUsed: 45670,
      tokensLimit: 100000,
      requestsToday: 234,
      averageResponseTime: 1850,
      errorRate: 2.1
    },
    edgeFunctions: {
      totalInvocations: 1247,
      successRate: 97.8,
      averageExecutionTime: 245,
      memoryUsage: 67,
      errors: [
        {
          function: "chat-openai",
          message: "Rate limit exceeded",
          timestamp: new Date(Date.now() - 300000),
          severity: "medium"
        },
        {
          function: "process-document",
          message: "File size exceeds limit",
          timestamp: new Date(Date.now() - 600000),
          severity: "low"
        }
      ]
    },
    documents: {
      totalProcessed: 89,
      processingSuccessRate: 94.4,
      averageProcessingTime: 3200,
      storageUsed: 245
    },
    system: {
      uptime: 99.2,
      lastIncident: new Date(Date.now() - 86400000 * 3),
      activeUsers: 12,
      conversationsToday: 156
    }
  });

  const [refreshing, setRefreshing] = useState(false);

  const refreshStats = async () => {
    setRefreshing(true);
    // Simulation d'un appel API pour récupérer les vraies statistiques
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // En réalité, ces données viendraient de votre système de monitoring
    setStats(prev => ({
      ...prev,
      openai: {
        ...prev.openai,
        tokensUsed: prev.openai.tokensUsed + Math.floor(Math.random() * 100),
        requestsToday: prev.openai.requestsToday + Math.floor(Math.random() * 5)
      }
    }));
    
    setRefreshing(false);
  };

  useEffect(() => {
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getHealthStatus = () => {
    const issues = [];
    
    if (stats.openai.errorRate > 5) issues.push("Taux d'erreur OpenAI élevé");
    if (stats.edgeFunctions.successRate < 95) issues.push("Fonctions Edge instables");
    if (stats.documents.processingSuccessRate < 90) issues.push("Traitement de documents défaillant");
    if (stats.system.uptime < 99) issues.push("Disponibilité système faible");
    
    return {
      status: issues.length === 0 ? "healthy" : issues.length < 2 ? "warning" : "critical",
      issues
    };
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* En-tête avec statut général */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Monitoring & Analytics
          </h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel du système
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={health.status === "healthy" ? "default" : health.status === "warning" ? "secondary" : "destructive"}
            className="flex items-center gap-1"
          >
            {health.status === "healthy" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {health.status === "healthy" ? "Système sain" : 
             health.status === "warning" ? "Surveillance" : "Critique"}
          </Badge>
          
          <button
            onClick={refreshStats}
            disabled={refreshing}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {refreshing ? "..." : "Actualiser"}
          </button>
        </div>
      </div>

      {/* Alertes critiques */}
      {health.issues.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problèmes détectés:</strong> {health.issues.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OpenAI Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens OpenAI</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.openai.tokensUsed.toLocaleString()}
            </div>
            <Progress 
              value={(stats.openai.tokensUsed / stats.openai.tokensLimit) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.openai.tokensUsed / stats.openai.tokensLimit) * 100)}% utilisés
            </p>
          </CardContent>
        </Card>

        {/* Temps de réponse */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openai.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Moyenne sur 24h
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.edgeFunctions.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Edge Functions
            </p>
          </CardContent>
        </Card>

        {/* Documents traités */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Traités aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détails des métriques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilisation OpenAI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              OpenAI Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Requêtes aujourd'hui</span>
              <Badge variant="outline">{stats.openai.requestsToday}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Taux d'erreur</span>
              <Badge variant={stats.openai.errorRate > 5 ? "destructive" : "secondary"}>
                {stats.openai.errorRate}%
              </Badge>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Utilisation tokens</span>
                <span className="text-sm text-muted-foreground">
                  {stats.openai.tokensUsed} / {stats.openai.tokensLimit}
                </span>
              </div>
              <Progress value={(stats.openai.tokensUsed / stats.openai.tokensLimit) * 100} />
            </div>
          </CardContent>
        </Card>

        {/* Erreurs récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Erreurs récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {stats.edgeFunctions.errors.length > 0 ? (
                <div className="space-y-3">
                  {stats.edgeFunctions.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{error.function}</span>
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(error.severity)}
                        >
                          {error.severity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {error.message}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {error.timestamp.toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune erreur récente</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Métriques système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Métriques système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.system.uptime}%</div>
              <div className="text-sm text-muted-foreground">Disponibilité</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.system.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.system.conversationsToday}</div>
              <div className="text-sm text-muted-foreground">Conversations/jour</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.edgeFunctions.memoryUsage}%</div>
              <div className="text-sm text-muted-foreground">Mémoire utilisée</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}