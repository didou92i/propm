
import { FileText, Image, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface MessageWithAttachmentsProps {
  attachments?: MessageAttachment[];
  className?: string;
}

export const MessageWithAttachments = ({ attachments, className }: MessageWithAttachmentsProps) => {
  if (!attachments || attachments.length === 0) return null;

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

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => {
          const FileIcon = getFileIcon(attachment.type);
          
          return (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/30"
            >
              <FileIcon className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate max-w-32">
                  {attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              {attachment.url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <Badge variant="secondary" className="text-xs">
        📎 {attachments.length} document{attachments.length > 1 ? 's' : ''} joint{attachments.length > 1 ? 's' : ''}
      </Badge>
    </div>
  );
};
