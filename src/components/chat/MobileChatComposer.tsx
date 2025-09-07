import { useState, useRef, forwardRef } from "react";
import { Send, MoreVertical, RotateCcw, Download, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { ChatAttachment } from "@/components/chat";
import { ConversationExport } from "@/components/conversation";
import { EnhancedButton, MobileTouchOptimized } from "@/components/ui/enhanced-mobile-support";
import { useRipple } from "@/hooks/useRipple";
import { toast } from "sonner";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface MobileChatComposerProps {
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

export const MobileChatComposer = forwardRef<HTMLDivElement, MobileChatComposerProps>(
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
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createRipple = useRipple('intense');
    const isMobile = useIsMobile();

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
      <MobileTouchOptimized withHaptic>
        <div ref={ref} className="px-3 py-2 pb-4 bg-background/20 backdrop-blur-md border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            {/* Attachments Display */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="px-3 py-2 flex items-center gap-2 bg-muted rounded-lg text-sm"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-32">{attachment.file.name}</span>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-muted-foreground hover:text-foreground ml-1 h-4 w-4 p-0 min-h-0"
                    >
                      ×
                    </EnhancedButton>
                  </div>
                ))}
              </div>
            )}

            {/* Error Display */}
            {attachmentError && (
              <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {attachmentError}
              </div>
            )}

            {/* Main Input Container */}
            <form onSubmit={onSubmit}>
              <div className="relative flex items-end gap-2 p-3 border border-white/5 rounded-2xl bg-background/30 backdrop-blur-md shadow-sm hover:border-white/10 transition-all duration-300">
                {/* Attachment Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
                  className="hidden"
                />
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || processingAttachment}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0 min-w-8"
                >
                  <Paperclip className="w-4 h-4" />
                </EnhancedButton>

                {/* Text Input */}
                <div className="flex-1 px-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message..."
                    className={cn(
                      "w-full resize-none bg-transparent border-0 outline-none",
                      "text-sm placeholder:text-muted-foreground",
                      "min-h-[24px] max-h-40 py-1 px-0",
                      "focus:ring-0 focus:border-0",
                      isMobile && "touch-manipulation"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        if (form && (!input.trim() && attachments.length === 0) === false && !isLoading && !processingAttachment) {
                          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                          form.dispatchEvent(submitEvent);
                        }
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
                      target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                    }}
                  />
                </div>
                
                <EnhancedButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={(!input.trim() && attachments.length === 0) || isLoading || processingAttachment}
                  onClick={handleSendClick}
                  withRipple
                  className={cn(
                    "h-8 w-8 p-0 rounded-full shrink-0 min-w-8",
                    (!input.trim() && attachments.length === 0) || isLoading || processingAttachment
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  )}
                >
                  <Send className="w-4 h-4" />
                </EnhancedButton>
              </div>

              {/* Secondary Actions for Mobile */}
              {(messages.length > 0 || attachments.length > 0) && (
                <div className="flex justify-center gap-2 mt-4">
                  {messages.length > 0 && (
                    <MobileDialog
                      open={exportDialogOpen}
                      onOpenChange={setExportDialogOpen}
                      title="Exporter la conversation"
                      trigger={
                        <EnhancedButton 
                          variant="outline" 
                          size="sm"
                          withRipple
                          className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Exporter
                        </EnhancedButton>
                      }
                    >
                      <ConversationExport 
                        messages={messages}
                        agentName={selectedAgent}
                      >
                        <div />
                      </ConversationExport>
                    </MobileDialog>
                  )}
                  
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={handleResetClick}
                    withRipple
                    className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
                  >
                    <RotateCcw className={cn(
                      "w-3 h-3 mr-1",
                      resetButtonClicked && "animate-spin text-success"
                    )} />
                    Réinitialiser
                  </EnhancedButton>
                </div>
              )}
            </form>
          </div>
        </div>
      </MobileTouchOptimized>
    );
  }
);

MobileChatComposer.displayName = "MobileChatComposer";