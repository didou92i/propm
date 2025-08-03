import { useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="relative group">
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none border border-border/40 bg-background/50 backdrop-blur-sm focus:border-primary/50 transition-all duration-200"
            placeholder="Modifiez votre texte ici..."
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            >
              <X className="w-3 h-3 mr-1" />
              Annuler
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="h-8 px-3 bg-primary hover:bg-primary/90"
            >
              <Save className="w-3 h-3 mr-1" />
              Sauvegarder
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ctrl+Entrée pour sauvegarder • Échap pour annuler
          </p>
        </div>
      ) : (
        <div className="relative">
          <MarkdownRenderer
            content={content}
            isAssistant={isAssistant}
            enableTypewriter={enableTypewriter}
            onTypingComplete={onTypingComplete}
          />
          {isAssistant && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent/50 hover:scale-105 backdrop-blur-sm border border-border/20"
              title="Modifier ce message"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}