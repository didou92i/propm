import { FileText, Download, Trash2, HardDrive, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DocumentData {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

interface DocumentCardProps {
  doc: DocumentData;
  onDownload: (doc: DocumentData) => void;
  onDelete: (documentId: string) => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  getFileTypeColor: (filetype: string) => "default" | "destructive" | "outline" | "secondary";
  getExtractionMethodLabel: (method: string) => string;
}

export const DocumentCard = ({ 
  doc, 
  onDownload, 
  onDelete, 
  formatFileSize, 
  formatDate, 
  getFileTypeColor, 
  getExtractionMethodLabel 
}: DocumentCardProps) => (
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
            {doc.similarity && (
              <Badge variant="secondary" className="text-xs">
                {(doc.similarity * 100).toFixed(0)}% pertinent
              </Badge>
            )}
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
          onClick={() => onDownload(doc)}
          title="Télécharger le texte extrait"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(doc.id)}
          title="Supprimer le document"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
);