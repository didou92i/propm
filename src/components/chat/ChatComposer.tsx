import { useState, useRef, forwardRef } from "react";
import { Send, MoreVertical, RotateCcw, Download, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChatAttachment } from "@/components/chat";
import { ConversationExport } from "@/components/conversation";
import { useRipple } from "@/hooks/useRipple";
import { toast } from "sonner";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

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
      >
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="p-3 flex items-center gap-3 bg-card/50 border border-border/40 rounded-xl backdrop-blur-sm"
                >
                  <Paperclip className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate max-w-40">
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(attachment.file.size / 1024)}KB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              {attachmentError}
            </div>
          )}

          {/* Main Input Container */}
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="relative flex items-end gap-3 p-4 bg-card/50 rounded-2xl border border-border/40 backdrop-blur-sm">
              {/* Attachment Button */}
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
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || processingAttachment}
                className="h-8 w-8 p-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message..."
                  className={cn(
                    "w-full resize-none bg-transparent border-0 outline-none",
                    "text-sm placeholder:text-muted-foreground",
                    "min-h-[24px] max-h-32 py-2 px-0",
                    "focus:ring-0 focus:border-0"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '24px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                size="sm"
                disabled={(!input.trim() && attachments.length === 0) || isLoading || processingAttachment}
                onClick={handleSendClick}
                className={cn(
                  "h-8 w-8 p-0 rounded-full transition-all duration-200",
                  (!input.trim() && attachments.length === 0) || isLoading || processingAttachment
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                )}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Secondary Actions */}
            {(messages.length > 0 || attachments.length > 0) && (
              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
                    >
                      <MoreVertical className="w-3 h-3 mr-1" />
                      Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {messages.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Download className="w-4 h-4 mr-2" />
                            Exporter la conversation
                          </DropdownMenuItem>
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
                    <DropdownMenuItem onClick={handleResetClick}>
                      <RotateCcw className={cn(
                        "w-4 h-4 mr-2",
                        resetButtonClicked && "animate-spin text-success"
                      )} />
                      Réinitialiser le contexte
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }
);

ChatComposer.displayName = "ChatComposer";