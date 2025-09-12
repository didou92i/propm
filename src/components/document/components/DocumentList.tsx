import React from 'react';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DocumentCard } from '../DocumentCard';
import { DocumentCluster } from '../DocumentCluster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveCardContainer } from '@/components/ui/responsive-grid';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

interface DocumentListProps {
  documents: DocumentData[];
  viewMode: 'list' | 'grid' | 'cluster';
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  getFileTypeColor: (filetype: string) => "default" | "destructive" | "outline" | "secondary";
  getExtractionMethodLabel: (method: string) => string;
  onDownload: () => void;
  onDelete: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  viewMode,
  formatFileSize,
  formatDate,
  getFileTypeColor,
  getExtractionMethodLabel,
  onDownload,
  onDelete
}) => {
  if (viewMode === 'cluster') {
    return <DocumentCluster onDocumentSelect={() => {}} />;
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3 glass-subtle">
        <TabsTrigger value="all">Tous ({documents.length})</TabsTrigger>
        <TabsTrigger value="recent">Récents</TabsTrigger>
        <TabsTrigger value="relevant">Plus Pertinents</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-3 mt-4">
        {documents.length === 0 ? (
          <Card className="p-8 text-center glass-subtle">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Aucun document trouvé</h3>
          </Card>
        ) : (
          viewMode === 'grid' ? (
            <ResponsiveCardContainer>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  getFileTypeColor={getFileTypeColor}
                  getExtractionMethodLabel={getExtractionMethodLabel}
                />
              ))}
            </ResponsiveCardContainer>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDownload={onDownload}
                  onDelete={onDelete}
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
  );
};