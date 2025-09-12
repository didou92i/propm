import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTemplateLogic } from "@/hooks/document/useTemplateLogic";
import { TemplateCard, TemplateForm } from "./components";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  agentType: "redacpro" | "cdspro" | "arrete" | "all";
  category: "rapport" | "arrete" | "pv" | "note" | "courrier";
  createdAt: Date;
  lastModified: Date;
  usage: number;
}

interface DocumentTemplatesProps {
  selectedAgent: string;
  onUseTemplate: (content: string) => void;
}

export function DocumentTemplates({ selectedAgent, onUseTemplate }: DocumentTemplatesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    content: "",
    agentType: selectedAgent as DocumentTemplate["agentType"],
    category: "rapport" as DocumentTemplate["category"]
  });
  const { toast } = useToast();
  
  const { templates, createTemplate, useTemplate, deleteTemplate, copyTemplate } = useTemplateLogic(selectedAgent);

  const handleCreateTemplate = () => {
    if (createTemplate(newTemplate)) {
      setNewTemplate({
        name: "",
        description: "",
        content: "",
        agentType: selectedAgent as DocumentTemplate["agentType"],
        category: "rapport"
      });
      setIsCreating(false);
    }
  };

  const handleUseTemplate = (template: DocumentTemplate) => {
    useTemplate(template);
    onUseTemplate(template.content);
    toast({
      title: "Modèle appliqué",
      description: `Le modèle "${template.name}" a été inséré dans la conversation`
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Modèles de documents</h3>
          <p className="text-sm text-muted-foreground">
            {templates.length} modèle(s) disponible(s) pour {selectedAgent}
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <TemplateForm
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            template={newTemplate}
            onTemplateChange={setNewTemplate}
            onSubmit={handleCreateTemplate}
          />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={handleUseTemplate}
            onCopy={copyTemplate}
            onEdit={() => {}}
            onDelete={deleteTemplate}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun modèle disponible pour cet agent</p>
          <p className="text-sm">Créez votre premier modèle pour commencer</p>
        </div>
      )}
    </div>
  );
}