
import { useState } from 'react';
import { X, FileText, Image, Paperclip, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface ChatAttachmentProps {
  attachments: AttachedFile[];
  onAttachmentsChange: (attachments: AttachedFile[]) => void;
  disabled?: boolean;
}

export const ChatAttachment = ({ attachments, onAttachmentsChange, disabled }: ChatAttachmentProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList) => {
    const newAttachments: AttachedFile[] = [];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non supporté",
          description: `${file.name} n'est pas un type de fichier supporté`,
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la taille maximale de 10MB`,
          variant: "destructive"
        });
        return;
      }

      const attachment: AttachedFile = {
        id: crypto.randomUUID(),
        file,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          onAttachmentsChange([...attachments, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push(attachment);
      }
    });

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && !disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.file.type);
            
            return (
              <Card key={attachment.id} className="p-2 flex items-center gap-2 bg-background">
                <FileIcon className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate max-w-32">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file.size)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attachment Button */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInput}
          className="hidden"
          id="chat-file-upload"
          disabled={disabled}
        />
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          disabled={disabled}
        >
          <label 
            htmlFor="chat-file-upload" 
            className="cursor-pointer flex items-center justify-center"
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Paperclip className={`w-4 h-4 ${isDragOver ? 'text-primary' : ''}`} />
          </label>
        </Button>
      </div>
    </div>
  );
};
