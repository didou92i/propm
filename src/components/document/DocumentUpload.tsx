import { useState, useCallback } from 'react';
import { Upload, File, Trash2, Eye, Check, AlertCircle, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  metadata?: any;
}

interface DocumentUploadProps {
  onDocumentProcessed?: (documentId: string) => void;
}

export const DocumentUpload = ({ onDocumentProcessed }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return FileText;
  };

  const processFile = async (file: File) => {
    const documentId = crypto.randomUUID();
    const newDoc: Document = {
      id: documentId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    };

    setDocuments(prev => [...prev, newDoc]);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Update progress to show processing
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'processing', progress: 50 }
          : doc
      ));

      // Call the process-document edge function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData
      });

      if (error) throw error;

      // Update document status to ready
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'ready', progress: 100, metadata: data }
          : doc
      ));

      toast({
        title: "Document traité avec succès",
        description: `${file.name} est maintenant disponible pour l'analyse`,
      });

      onDocumentProcessed?.(data.documentId);

    } catch (error) {
      console.error('Error processing document:', error);
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'error', progress: 0 }
          : doc
      ));

      toast({
        title: "Erreur lors du traitement",
        description: `Impossible de traiter ${file.name}`,
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = useCallback((files: FileList) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non supporté",
          description: `${file.name} n'est pas un type de fichier supporté`,
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la taille maximale de 10MB`,
          variant: "destructive"
        });
        return;
      }

      processFile(file);
    });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'ready': return 'default';
      case 'error': return 'destructive';
      case 'processing': return 'secondary';
      case 'uploading': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'ready': return Check;
      case 'error': return AlertCircle;
      default: return File;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card 
        className={`p-8 border-2 border-dashed transition-colors glass-subtle hover-lift ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-border/50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <div className="text-center space-y-4">
          <Upload className={`w-12 h-12 mx-auto transition-colors ${
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <div>
            <h3 className="text-lg font-semibold">Télécharger des documents</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Formats supportés: PDF, Word, Texte, Images (max. 10MB)
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <Button asChild variant="outline" className="hover-glow">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Sélectionner des fichiers
            </label>
          </Button>
        </div>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Documents en cours</h4>
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            const StatusIcon = getStatusIcon(doc.status);
            
            return (
              <Card key={doc.id} className="p-4 glass-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)}
                        </p>
                        <Badge variant={getStatusColor(doc.status)} className="text-xs">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {doc.status === 'uploading' && 'Téléchargement...'}
                          {doc.status === 'processing' && 'Traitement...'}
                          {doc.status === 'ready' && 'Prêt'}
                          {doc.status === 'error' && 'Erreur'}
                        </Badge>
                      </div>
                      {(doc.status === 'uploading' || doc.status === 'processing') && (
                        <Progress value={doc.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.status === 'ready' && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};