import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentCluster } from './DocumentCluster';
import { DocumentCard } from './DocumentCard';
import { DocumentSearchBar } from './DocumentSearchBar'; 
import { DocumentViewModeSelector } from './DocumentViewModeSelector';
import { useDocumentLogic } from '@/hooks/document/useDocumentLogic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveCardContainer } from '@/components/ui/responsive-grid';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

export const DocumentManager = () => {
  const {
    documents,
    filteredDocuments,
    loading,
    viewMode,
    searchTerm,
    setViewMode,
    setSearchTerm,
    setFilteredDocuments,
    loadDocuments
  } = useDocumentLogic();

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

  const getFileTypeColor = (filetype: string): "default" | "destructive" | "outline" | "secondary" => {
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

  const handleSemanticSearchResults = (results: DocumentData[]) => {
    setFilteredDocuments(results.length > 0 ? results : documents);
  };

  const handleTraditionalSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredDocuments(documents);
      return;
    }
    const filtered = documents.filter(doc =>
      doc.metadata.filename.toLowerCase().includes(term.toLowerCase()) ||
      doc.content.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  const deleteDocument = () => {};
  const downloadDocument = () => {};

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 glass-subtle">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DocumentSearchBar 
          onSemanticSearchResults={handleSemanticSearchResults}
          searchTerm={searchTerm}
          onTraditionalSearch={handleTraditionalSearch}
        />
        
        <div className="flex items-center justify-between">
          <DocumentViewModeSelector 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {viewMode === 'cluster' ? (
        <DocumentCluster onDocumentSelect={() => {}} />
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-subtle">
            <TabsTrigger value="all">Tous ({filteredDocuments.length})</TabsTrigger>
            <TabsTrigger value="recent">Récents</TabsTrigger>
            <TabsTrigger value="relevant">Plus Pertinents</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredDocuments.length === 0 ? (
              <Card className="p-8 text-center glass-subtle">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Aucun document trouvé</h3>
              </Card>
            ) : (
              viewMode === 'grid' ? (
                <ResponsiveCardContainer>
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onDownload={downloadDocument}
                      onDelete={deleteDocument}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      getFileTypeColor={getFileTypeColor}
                      getExtractionMethodLabel={getExtractionMethodLabel}
                    />
                  ))}
                </ResponsiveCardContainer>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onDownload={downloadDocument}
                      onDelete={deleteDocument}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                      getFileTypeColor={getFileTypeColor}
                      getExtractionMethodLabel={getExtractionMethodLabel}
                    />
                  ))}
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={loadDocuments} className="glass-hover">
          Actualiser
        </Button>
      </div>
    </div>
  );
};