import { useState } from "react";
import { Edit, Save, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";

interface EditableMessageProps {
  content: string;
  onContentChange: (newContent: string) => void;
  isAssistant: boolean;
  enableTypewriter?: boolean;
  onTypingComplete?: () => void;
}

export function EditableMessage({ 
  content, 
  onContentChange, 
  isAssistant, 
  enableTypewriter, 
  onTypingComplete 
}: EditableMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedContent.trim() !== content) {
      onContentChange(editedContent.trim());
      toast({
        title: "Message modifié",
        description: "Les modifications ont été sauvegardées avec succès.",
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <>
      <div className="relative group">
        <MarkdownRenderer
          content={content}
          isAssistant={isAssistant}
          enableTypewriter={enableTypewriter}
          onTypingComplete={onTypingComplete}
        />
        {isAssistant && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-6 px-2 text-xs hover:bg-accent/50 border border-border/20 backdrop-blur-sm"
              title="Modifier ce message"
            >
              <Edit className="w-3 h-3 mr-1" />
              Modifier
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Modifier le message
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-1 gap-4 min-h-0">
            {/* Éditeur */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Édition</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 px-2 text-xs"
                >
                  {showPreview ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {showPreview ? "Cacher aperçu" : "Aperçu"}
                </Button>
              </div>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none min-h-[300px] font-mono text-sm"
                placeholder="Modifiez votre texte markdown ici..."
                autoFocus
              />
            </div>

            {/* Aperçu */}
            {showPreview && (
              <div className="flex-1 flex flex-col border-l pl-4">
                <div className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Aperçu</span>
                </div>
                <div className="flex-1 overflow-auto p-4 border rounded-md bg-muted/20">
                  <MarkdownRenderer
                    content={editedContent}
                    isAssistant={true}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Ctrl+Entrée pour sauvegarder • Échap pour annuler
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}