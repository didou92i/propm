import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { supabaseVectorStore } from '@/services/llama/supabaseVectorStore';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Play } from 'lucide-react';

interface IndexPerformanceData {
  documents_index?: {
    index_name?: string;
    scans?: number;
    tuples_read?: number;
    tuples_fetched?: number;
    index_size?: string;
    table_size?: string;
  };
  job_posts_index?: any;
  recommendations?: string[];
}

interface ValidationResult {
  search: {
    time: number;
    resultsCount: number;
    status: 'excellent' | 'acceptable' | 'slow';
    query: string;
  };
  indexUsage: {
    status: 'active' | 'inactive';
    scans: number;
    tuplesRead: number;
    indexName: string;
  };
  documents: {
    totalDocuments: number;
    indexedByLlama: number;
    percentage: number;
  };
  performance: {
    indexSize: string;
    tableSize: string;
    recommendations: string[];
  };
}

export const IndexValidation = () => {
  const [results, setResults] = useState<ValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest('Initialisation...');
    
    try {
      // Test 1: Recherche sémantique avec mesure de performance
      setCurrentTest('Test de recherche sémantique HNSW...');
      setProgress(10);
      
      const testQuery = 'arrêté municipal police';
      const searchStart = performance.now();
      const searchResults = await supabaseVectorStore.query(testQuery, 5);
      const searchTime = performance.now() - searchStart;
      
      setProgress(30);
      
      // Test 2: Vérifier les statistiques d'index
      setCurrentTest('Vérification utilisation index HNSW...');
      const { data: rawIndexStats, error: indexError } = await supabase.rpc('get_index_performance');
      
      if (indexError) {
        console.error('Erreur lors de la récupération des stats:', indexError);
      }
      
      // Cast vers le type approprié
      const indexStats = (rawIndexStats as unknown) as IndexPerformanceData;
      
      setProgress(60);
      
      // Test 3: Compter les documents indexés
      setCurrentTest('Comptage des documents indexés...');
      const stats = await supabaseVectorStore.getStats();
      
      setProgress(80);
      
      // Analyse des résultats
      const indexUsageStatus = indexStats?.documents_index?.scans > 0 ? 'active' : 'inactive';
      const searchStatus: 'excellent' | 'acceptable' | 'slow' = 
        searchTime < 100 ? 'excellent' : searchTime < 500 ? 'acceptable' : 'slow';
      
      const percentage = stats.totalDocuments > 0 
        ? Math.round((stats.indexedByLlama / stats.totalDocuments) * 100)
        : 0;
      
      // Générer des recommandations
      const recommendations: string[] = [];
      if (searchTime > 500) {
        recommendations.push('⚠️ Temps de recherche élevé - Considérez augmenter ef_construction');
      }
      if (indexUsageStatus === 'inactive') {
        recommendations.push('🔴 Index HNSW non utilisé - Vérifiez la configuration RPC');
      }
      if (percentage < 50) {
        recommendations.push('📊 Moins de 50% des documents indexés avec LlamaIndex');
      }
      if (searchResults.length === 0) {
        recommendations.push('⚠️ Aucun résultat trouvé - Vérifiez les embeddings');
      }
      if (recommendations.length === 0) {
        recommendations.push('✅ Tous les tests sont conformes aux standards');
      }
      
      setProgress(100);
      setCurrentTest('Validation terminée !');
      
      setResults({
        search: {
          time: searchTime,
          resultsCount: searchResults.length,
          status: searchStatus,
          query: testQuery
        },
        indexUsage: {
          status: indexUsageStatus,
          scans: indexStats?.documents_index?.scans || 0,
          tuplesRead: indexStats?.documents_index?.tuples_read || 0,
          indexName: indexStats?.documents_index?.index_name || 'N/A'
        },
        documents: {
          totalDocuments: stats.totalDocuments,
          indexedByLlama: stats.indexedByLlama,
          percentage
        },
        performance: {
          indexSize: indexStats?.documents_index?.index_size || 'N/A',
          tableSize: indexStats?.documents_index?.table_size || 'N/A',
          recommendations
        }
      });
      
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      setCurrentTest('Erreur lors de la validation');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'acceptable':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'slow':
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      excellent: 'default',
      active: 'default',
      acceptable: 'secondary',
      slow: 'destructive',
      inactive: 'destructive'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Validation des Index Vectoriels HNSW
        </CardTitle>
        <CardDescription>
          Tests automatisés de performance et d'utilisation des index optimisés
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bouton de lancement */}
        <div className="flex gap-4 items-center">
          <Button 
            onClick={runValidation} 
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Lancer les Tests de Validation
              </>
            )}
          </Button>
          
          {isRunning && (
            <div className="flex-1 space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{currentTest}</p>
            </div>
          )}
        </div>

        {/* Résultats de validation */}
        {results && (
          <div className="space-y-4 mt-6">
            {/* Test de recherche */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  {getStatusIcon(results.search.status)}
                  Test de Recherche Sémantique
                </h3>
                {getStatusBadge(results.search.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Temps de recherche</p>
                  <p className="font-mono font-semibold">{results.search.time.toFixed(0)}ms</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Résultats trouvés</p>
                  <p className="font-mono font-semibold">{results.search.resultsCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Requête de test</p>
                  <code className="text-xs bg-muted p-1 rounded">{results.search.query}</code>
                </div>
              </div>
            </div>

            {/* Utilisation de l'index */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  {getStatusIcon(results.indexUsage.status)}
                  Utilisation de l'Index HNSW
                </h3>
                {getStatusBadge(results.indexUsage.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom de l'index</p>
                  <p className="font-mono text-xs">{results.indexUsage.indexName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scans effectués</p>
                  <p className="font-mono font-semibold">{results.indexUsage.scans}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tuples lus</p>
                  <p className="font-mono font-semibold">{results.indexUsage.tuplesRead}</p>
                </div>
              </div>
            </div>

            {/* Documents indexés */}
            <div className="p-4 border rounded-lg space-y-2">
              <h3 className="font-semibold">📊 Documents Indexés</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total documents</p>
                  <p className="font-mono font-semibold">{results.documents.totalDocuments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Indexés LlamaIndex</p>
                  <p className="font-mono font-semibold">
                    {results.documents.indexedByLlama} ({results.documents.percentage}%)
                  </p>
                </div>
              </div>
              <Progress value={results.documents.percentage} className="mt-2" />
            </div>

            {/* Performance */}
            <div className="p-4 border rounded-lg space-y-2">
              <h3 className="font-semibold">⚡ Performance de l'Index</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Taille de l'index</p>
                  <p className="font-mono font-semibold">{results.performance.indexSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taille de la table</p>
                  <p className="font-mono font-semibold">{results.performance.tableSize}</p>
                </div>
              </div>
            </div>

            {/* Recommandations */}
            <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
              <h3 className="font-semibold">💡 Recommandations</h3>
              <ul className="space-y-1 text-sm">
                {results.performance.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Message initial */}
        {!results && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Cliquez sur "Lancer les Tests" pour valider les performances des index HNSW</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
