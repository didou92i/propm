import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  Clock, 
  User, 
  AlertCircle, 
  Info, 
  Bug,
  Zap,
  Activity,
  BarChart3
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { useBetaAnalytics } from '@/hooks/useBetaAnalytics';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'performance' | 'user' | 'beta';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
}

export function BetaLogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [componentFilter, setComponentFilter] = useState<string>('all');
  const [isRealTime, setIsRealTime] = useState(true);
  
  const { metrics, userJourney, generateReport, exportData } = useBetaAnalytics();

  // Charger les logs depuis le buffer
  const loadLogs = () => {
    const bufferedLogs = logger.getBufferedLogs();
    const storedLogs = logger.loadLogsFromStorage();
    const allLogs = [...storedLogs, ...bufferedLogs];
    
    // Dédupliquer et trier par timestamp
    const uniqueLogs = allLogs.filter((log, index, self) => 
      self.findIndex(l => l.timestamp === log.timestamp && l.message === log.message) === index
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setLogs(uniqueLogs);
  };

  // Filtrer les logs
  const filterLogs = useMemo(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.component?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (componentFilter !== 'all') {
      filtered = filtered.filter(log => log.component === componentFilter);
    }

    return filtered;
  }, [logs, searchTerm, levelFilter, componentFilter]);

  // Mettre à jour les logs filtrés
  useEffect(() => {
    setFilteredLogs(filterLogs);
  }, [filterLogs]);

  // Mise à jour en temps réel
  useEffect(() => {
    loadLogs();
    
    if (isRealTime) {
      const interval = setInterval(loadLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  // Obtenir la liste des composants uniques
  const uniqueComponents = useMemo(() => {
    const components = new Set(logs.map(log => log.component).filter(Boolean));
    return Array.from(components).sort();
  }, [logs]);

  // Obtenir l'icône pour le niveau de log
  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      case 'performance': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'user': return <User className="w-4 h-4 text-green-500" />;
      case 'beta': return <Activity className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  // Obtenir la couleur du badge pour le niveau
  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'beta': return 'outline';
      default: return 'default';
    }
  };

  // Formater les données pour affichage
  const formatLogData = (data: any) => {
    if (!data) return null;
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Export personnalisé des logs
  const handleExport = () => {
    const exportData = {
      logs: filteredLogs,
      filters: { searchTerm, levelFilter, componentFilter },
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      filteredLogs: filteredLogs.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beta-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Vider les logs
  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    setFilteredLogs([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Logs Beta - Monitoring Avancé</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel et analytics de la version beta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className={isRealTime ? 'bg-green-500/10 border-green-500' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            {isRealTime ? 'Temps Réel ON' : 'Temps Réel OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs en Temps Réel</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Beta</TabsTrigger>
          <TabsTrigger value="journey">Parcours Utilisateur</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtres */}
          <Card className="glass-subtle border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>

                <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as LogLevel | 'all')}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="error">Erreurs</SelectItem>
                    <SelectItem value="warn">Avertissements</SelectItem>
                    <SelectItem value="info">Informations</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={componentFilter} onValueChange={setComponentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Composant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les composants</SelectItem>
                    {uniqueComponents.map(component => (
                      <SelectItem key={component} value={component}>
                        {component}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline">
                    {filteredLogs.length} / {logs.length} logs
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleClearLogs}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des logs */}
          <Card className="glass-intense border-primary/30">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        {getLogIcon(log.level)}
                        <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                          {log.level}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          {log.component && (
                            <Badge variant="outline" className="text-xs">
                              {log.component}
                            </Badge>
                          )}
                          {log.route && (
                            <Badge variant="secondary" className="text-xs">
                              {log.route}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm font-medium text-foreground">
                          {log.message}
                        </div>

                        {log.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Détails
                            </summary>
                            <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                              {formatLogData(log.data)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun log trouvé avec les filtres actuels
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="glass-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Taux d'Erreur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.errorRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.recentErrors.length} erreurs récentes
                </p>
              </CardContent>
            </Card>

            <Card className="glass-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(userJourney.totalDuration / 1000 / 60)}min
                </div>
                <p className="text-xs text-muted-foreground">
                  {userJourney.actions.length} actions
                </p>
              </CardContent>
            </Card>

            <Card className="glass-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.performanceMetrics.averageLoadTime.toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Temps de chargement moyen
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-subtle">
              <CardHeader>
                <CardTitle className="text-lg">Features les Plus Utilisées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.mostUsedFeatures.slice(0, 5).map(feature => (
                    <div key={feature.name} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{feature.name}</span>
                      <Badge variant="secondary">{feature.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-subtle">
              <CardHeader>
                <CardTitle className="text-lg">Erreurs Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.recentErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex justify-between items-start gap-2">
                      <span className="text-sm text-foreground line-clamp-2">{error.message}</span>
                      <Badge variant="destructive">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <Card className="glass-subtle">
            <CardHeader>
              <CardTitle className="text-lg">Parcours Utilisateur Actuel</CardTitle>
              <p className="text-sm text-muted-foreground">
                Session: {userJourney.sessionId} - Route: {userJourney.currentRoute}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {userJourney.actions.slice().reverse().map((action, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded bg-background/30">
                      <div className="text-xs text-muted-foreground font-mono min-w-[60px]">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-foreground flex-1">
                        {action.action}
                      </div>
                      {action.component && (
                        <Badge variant="outline" className="text-xs">
                          {action.component}
                        </Badge>
                      )}
                      {action.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {action.duration}ms
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}