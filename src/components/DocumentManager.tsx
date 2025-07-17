import { useState, useEffect } from 'react';
import { FileText, Search, Trash2, Download, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
}

export const DocumentManager = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeColor = (filetype: string) => {
    if (filetype.includes('pdf')) return 'destructive';
    if (filetype.includes('image')) return 'secondary';
    if (filetype.includes('text')) return 'outline';
    return 'default';
  };

  const getExtractionMethodLabel = (method: string) => {
    switch (method) {
      case 'ocr': return 'OCR';
      case 'vision_api': return 'Vision IA';
      case 'direct': return 'Direct';
      default: return 'Inconnu';
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('metadata->>processed_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const downloadDocument = (doc: DocumentData) => {
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `${doc.metadata.filename}_extracted.txt`;
    globalThis.document.body.appendChild(a);
    a.click();
    globalThis.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc =>
    doc.metadata.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 glass-subtle">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 glass-subtle"
        />
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <Card className="p-8 text-center glass-subtle">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">
              {searchTerm ? 'Aucun document trouvé' : 'Aucun document'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm 
                ? 'Essayez avec d\'autres termes de recherche'
                : 'Téléchargez vos premiers documents pour commencer'
              }
            </p>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4 glass-subtle hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{doc.metadata.filename}</h4>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                      <Badge variant={getFileTypeColor(doc.metadata.filetype)} className="text-xs">
                        {doc.metadata.filetype.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getExtractionMethodLabel(doc.metadata.extraction_method)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{formatFileSize(doc.metadata.filesize)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(doc.metadata.processed_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {doc.content.substring(0, 150)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={() => downloadDocument(doc)}
                    title="Télécharger le texte extrait"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteDocument(doc.id)}
                    title="Supprimer le document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={loadDocuments} className="glass-hover">
          Actualiser
        </Button>
      </div>
    </div>
  );
};