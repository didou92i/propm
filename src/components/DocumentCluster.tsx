
import { useState, useEffect } from 'react';
import { FileText, Users, Sparkles, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentCluster {
  id: string;
  theme: string;
  documents: Array<{
    id: string;
    filename: string;
    content: string;
    metadata: any;
    similarity: number;
  }>;
  centroid: number[];
  coherenceScore: number;
}

interface DocumentClusterProps {
  onDocumentSelect?: (documentId: string) => void;
  maxClusters?: number;
}

export const DocumentCluster = ({ onDocumentSelect, maxClusters = 5 }: DocumentClusterProps) => {
  const [clusters, setClusters] = useState<DocumentCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocumentClusters();
  }, []);

  const loadDocumentClusters = async () => {
    try {
      setLoading(true);

      // Get all documents with embeddings
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .not('embedding', 'is', null)
        .order('metadata->>processed_at', { ascending: false })
        .limit(50); // Limit for performance

      if (error) throw error;

      if (!documents || documents.length < 3) {
        setClusters([]);
        return;
      }

      // Generate clusters using k-means-like approach
      const documentClusters = await generateClusters(documents, Math.min(maxClusters, Math.floor(documents.length / 3)));
      setClusters(documentClusters);

    } catch (error) {
      console.error('Error loading document clusters:', error);
      toast({
        title: "Erreur de clustering",
        description: "Impossible de générer les clusters de documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateClusters = async (documents: any[], numClusters: number): Promise<DocumentCluster[]> => {
    // Simple clustering algorithm based on embedding similarity
    const clusters: DocumentCluster[] = [];
    const usedDocuments = new Set<string>();

    for (let i = 0; i < numClusters && usedDocuments.size < documents.length; i++) {
      // Find seed document (not yet used)
      const seedDoc = documents.find(doc => !usedDocuments.has(doc.id));
      if (!seedDoc) break;

      // Find similar documents to seed
      const clusterDocs = [];
      clusterDocs.push(seedDoc);
      usedDocuments.add(seedDoc.id);

      // Find documents similar to the seed
      for (const doc of documents) {
        if (usedDocuments.has(doc.id) || clusterDocs.length >= 8) continue;

        const similarity = cosineSimilarity(seedDoc.embedding, doc.embedding);
        if (similarity > 0.7 && clusterDocs.length < 8) {
          clusterDocs.push(doc);
          usedDocuments.add(doc.id);
        }
      }

      if (clusterDocs.length >= 2) {
        // Generate theme from document contents
        const theme = await generateClusterTheme(clusterDocs);
        
        clusters.push({
          id: `cluster_${i}`,
          theme,
          documents: clusterDocs.map(doc => ({
            id: doc.id,
            filename: doc.metadata?.filename || 'Sans nom',
            content: doc.content,
            metadata: doc.metadata,
            similarity: cosineSimilarity(seedDoc.embedding, doc.embedding)
          })),
          centroid: calculateCentroid(clusterDocs.map(doc => doc.embedding)),
          coherenceScore: calculateCoherenceScore(clusterDocs)
        });
      }
    }

    return clusters.sort((a, b) => b.coherenceScore - a.coherenceScore);
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const calculateCentroid = (embeddings: number[][]): number[] => {
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }
    
    return centroid.map(val => val / embeddings.length);
  };

  const calculateCoherenceScore = (documents: any[]): number => {
    if (documents.length < 2) return 0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        totalSimilarity += cosineSimilarity(documents[i].embedding, documents[j].embedding);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  };

  const generateClusterTheme = async (documents: any[]): Promise<string> => {
    // Extract keywords from filenames and content
    const filenames = documents.map(doc => doc.metadata?.filename || '').join(' ');
    const contentSample = documents
      .map(doc => doc.content.substring(0, 200))
      .join(' ');

    // Simple keyword extraction (in a real app, you might use NLP)
    const text = (filenames + ' ' + contentSample).toLowerCase();
    
    const themes = [
      { keywords: ['rapport', 'police', 'procès'], theme: 'Rapports de Police' },
      { keywords: ['arrêté', 'municipal', 'réglementation'], theme: 'Arrêtés Municipaux' },
      { keywords: ['contravention', 'amende', 'infraction'], theme: 'Contraventions' },
      { keywords: ['événement', 'manifestation', 'organisation'], theme: 'Événements' },
      { keywords: ['courrier', 'correspondance', 'lettre'], theme: 'Correspondance' },
      { keywords: ['procédure', 'instruction', 'directive'], theme: 'Procédures' }
    ];

    for (const themeData of themes) {
      if (themeData.keywords.some(keyword => text.includes(keyword))) {
        return themeData.theme;
      }
    }

    return 'Documents Connexes';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 glass-subtle">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <Card className="p-8 text-center glass-subtle">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-2">Clustering en cours</h3>
        <p className="text-sm text-muted-foreground">
          Les clusters apparaîtront automatiquement avec plus de documents
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Documents par Thème</h3>
        <Badge variant="outline" className="text-xs">
          {clusters.length} cluster{clusters.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {clusters.map((cluster) => (
        <Card key={cluster.id} className="glass-subtle hover-lift">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {cluster.theme}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {cluster.documents.length} document{cluster.documents.length > 1 ? 's' : ''} • 
                  Cohérence: {(cluster.coherenceScore * 100).toFixed(0)}%
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCluster(
                  selectedCluster === cluster.id ? null : cluster.id
                )}
                className="p-2"
              >
                <ChevronRight 
                  className={`w-4 h-4 transition-transform ${
                    selectedCluster === cluster.id ? 'rotate-90' : ''
                  }`} 
                />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {cluster.documents.slice(0, 3).map((doc, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {doc.filename.length > 20 
                    ? doc.filename.substring(0, 20) + '...' 
                    : doc.filename
                  }
                </Badge>
              ))}
              {cluster.documents.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{cluster.documents.length - 3} autres
                </Badge>
              )}
            </div>

            {selectedCluster === cluster.id && (
              <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
                {cluster.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentSelect?.(doc.id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors glass-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{doc.filename}</h5>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {doc.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Similarité: {(doc.similarity * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
