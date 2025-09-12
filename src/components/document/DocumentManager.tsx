import { Button } from '@/components/ui/button';
import { useDocumentLogic } from '@/hooks/document/useDocumentLogic';
import { DocumentFilters, DocumentList } from './components';

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

  const deleteDocument = () => {};
  const downloadDocument = () => {};

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 glass-subtle rounded-lg">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentFilters
        searchTerm={searchTerm}
        viewMode={viewMode}
        documents={documents}
        onSemanticSearchResults={handleSemanticSearchResults}
        onTraditionalSearch={(term) => setSearchTerm(term)}
        onViewModeChange={setViewMode}
      />

      <DocumentList
        documents={filteredDocuments}
        viewMode={viewMode}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
        getFileTypeColor={getFileTypeColor}
        getExtractionMethodLabel={getExtractionMethodLabel}
        onDownload={downloadDocument}
        onDelete={deleteDocument}
      />

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={loadDocuments} className="glass-hover">
          Actualiser
        </Button>
      </div>
    </div>
  );
};