import { useState, useRef, forwardRef } from "react";
import { Send, MoreVertical, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChatAttachment } from "@/components/chat";
import { ConversationExport } from "@/components/conversation";
import { useRipple } from "@/hooks/useRipple";
import { toast } from "sonner";
import { Message } from "@/types/chat";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface ChatComposerProps {
  input: string;
  setInput: (value: string) => void;
  attachments: AttachedFile[];
  setAttachments: (attachments: AttachedFile[]) => void;
  messages: Message[];
  selectedAgent: string;
  isLoading: boolean;
  processingAttachment: boolean;
  attachmentError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onResetContext: () => void;
  setAttachmentError: (error: string | null) => void;
}

export const ChatComposer = forwardRef<HTMLDivElement, ChatComposerProps>(
  ({ 
    input, 
    setInput, 
    attachments, 
    setAttachments, 
    messages, 
    selectedAgent, 
    isLoading, 
    processingAttachment, 
    attachmentError,
    onSubmit, 
    onResetContext,
    setAttachmentError
  }, ref) => {
    const [resetButtonClicked, setResetButtonClicked] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createRipple = useRipple('intense');

  const handleSendClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e as any);
  };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      
      files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Fichier trop volumineux", {
            description: `${file.name} dépasse la limite de 10MB`,
          });
          return;
        }

        const attachment: AttachedFile = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };

        setAttachments([...attachments, attachment]);
        setAttachmentError(null);
        
        toast.success("Fichier ajouté", {
          description: `${file.name} sera traité lors de l'envoi`,
        });
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const removeAttachment = (id: string) => {
      const attachment = attachments.find(a => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      setAttachments(attachments.filter(a => a.id !== id));
      setAttachmentError(null);
      
      toast.success("Fichier retiré", {
        description: "Le fichier a été supprimé des pièces jointes",
      });
    };

    const handleResetClick = () => {
      setResetButtonClicked(true);
      onResetContext();
      
      setTimeout(() => {
        setResetButtonClicked(false);
      }, 2000);
      
      toast.success("Contexte réinitialisé", {
        description: "La conversation a été effacée avec succès",
      });
    };

    return (
      <div 
        ref={ref}
        className="fixed bottom-12 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/50 z-50"
      >
        <div className="container mx-auto p-4 max-w-4xl">
          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="p-2 flex items-center gap-2 bg-card border border-border rounded-lg"
              >
                <div className="w-4 h-4 text-primary">📎</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate max-w-32">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(attachment.file.size / 1024)}KB
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => removeAttachment(attachment.id)}
                >
                  ×
                </Button>
              </div>
            ))}
            </div>
          )}

          {/* Error Display */}
          {attachmentError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {attachmentError}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="resize-none min-h-[44px] max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                />
              </div>
              
              <Button
                type="submit"
                size="default"
                disabled={(!input.trim() && attachments.length === 0) || isLoading || processingAttachment}
                onClick={handleSendClick}
                className="h-11 px-4 relative overflow-hidden"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || processingAttachment}
                >
                  📎 Joindre
                </Button>
                
                {messages.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Exporter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <ConversationExport 
                        messages={messages}
                        agentName={selectedAgent}
                      >
                        <div />
                      </ConversationExport>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleResetClick}>
                    <RotateCcw className={`w-4 h-4 mr-2 ${resetButtonClicked ? 'animate-spin text-green-500' : ''}`} />
                    Réinitialiser le contexte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

ChatComposer.displayName = "ChatComposer";