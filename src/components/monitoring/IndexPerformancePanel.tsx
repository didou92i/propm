import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Database, Clock } from 'lucide-react';
import { useIndexMonitoring } from '@/hooks/search/useIndexMonitoring';

export const IndexPerformancePanel = () => {
  const {
    indexStats,
    isLoading,
    benchmarks,
    getIndexPerformance,
    getAverageSearchTime,
    getIndexUtilization
  } = useIndexMonitoring();

  useEffect(() => {
    getIndexPerformance();
  }, [getIndexPerformance]);

  const utilization = getIndexUtilization();
  const avgSearchTime = getAverageSearchTime();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Performance des Index Vectoriels
              </CardTitle>
              <CardDescription>
                Monitoring des index HNSW et IVFFlat
              </CardDescription>
            </div>
            <Button
              onClick={getIndexPerformance}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Documents Index */}
          {indexStats?.documents_index && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Index Documents (HNSW)</h4>
                <Badge variant={utilization?.documents.utilization === 'Active' ? 'default' : 'secondary'}>
                  {utilization?.documents.utilization}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Scans</p>
                  <p className="font-mono font-semibold">{indexStats.documents_index.scans}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tuples lues</p>
                  <p className="font-mono font-semibold">{indexStats.documents_index.tuples_read}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taille index</p>
                  <p className="font-mono font-semibold">{indexStats.documents_index.index_size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Efficacité</p>
                  <p className="font-mono font-semibold">{utilization?.documents.efficiency}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Job Posts Index */}
          {indexStats?.job_posts_index && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Index Offres (IVFFlat)</h4>
                <Badge variant={utilization?.job_posts.utilization === 'Active' ? 'default' : 'secondary'}>
                  {utilization?.job_posts.utilization}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Scans</p>
                  <p className="font-mono font-semibold">{indexStats.job_posts_index.scans}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tuples lues</p>
                  <p className="font-mono font-semibold">{indexStats.job_posts_index.tuples_read}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taille index</p>
                  <p className="font-mono font-semibold">{indexStats.job_posts_index.index_size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Efficacité</p>
                  <p className="font-mono font-semibold">{utilization?.job_posts.efficiency}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Benchmarks */}
          {benchmarks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <h4 className="font-semibold">Benchmarks Récents</h4>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Temps moyen</p>
                  <p className="font-mono font-semibold text-lg">
                    {avgSearchTime.toFixed(0)}ms
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recherches</p>
                  <p className="font-mono font-semibold text-lg">{benchmarks.length}</p>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <Badge variant={avgSearchTime < 100 ? 'default' : avgSearchTime < 500 ? 'secondary' : 'destructive'}>
                    {avgSearchTime < 100 ? 'Excellent' : avgSearchTime < 500 ? 'Acceptable' : 'Lent'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {indexStats?.recommendations && indexStats.recommendations.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold text-sm">Recommandations</h4>
              <ul className="space-y-1">
                {indexStats.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
