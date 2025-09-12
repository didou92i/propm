import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface NewTemplate {
  name: string;
  description: string;
  content: string;
  agentType: DocumentTemplate["agentType"];
  category: DocumentTemplate["category"];
}

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  template: NewTemplate;
  onTemplateChange: (template: NewTemplate) => void;
  onSubmit: () => void;
  isEditing?: boolean;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  isOpen,
  onClose,
  template,
  onTemplateChange,
  onSubmit,
  isEditing = false
}) => {
  const updateTemplate = (field: keyof NewTemplate, value: string) => {
    onTemplateChange({ ...template, [field]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du modèle</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => updateTemplate('name', e.target.value)}
                placeholder="Ex: Procès-verbal standard"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select 
                value={template.category} 
                onValueChange={(value: DocumentTemplate["category"]) => 
                  updateTemplate('category', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rapport">Rapport</SelectItem>
                  <SelectItem value="arrete">Arrêté</SelectItem>
                  <SelectItem value="pv">Procès-verbal</SelectItem>
                  <SelectItem value="note">Note de service</SelectItem>
                  <SelectItem value="courrier">Courrier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={template.description}
              onChange={(e) => updateTemplate('description', e.target.value)}
              placeholder="Description du modèle"
            />
          </div>
          
          <div>
            <Label htmlFor="agentType">Agent cible</Label>
            <Select 
              value={template.agentType} 
              onValueChange={(value: DocumentTemplate["agentType"]) => 
                updateTemplate('agentType', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redacpro">RedacPro</SelectItem>
                <SelectItem value="cdspro">CDS Pro</SelectItem>
                <SelectItem value="arrete">ArreteTerritorial</SelectItem>
                <SelectItem value="all">Tous les agents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="content">Contenu du modèle</Label>
            <Textarea
              id="content"
              value={template.content}
              onChange={(e) => updateTemplate('content', e.target.value)}
              placeholder="Contenu du modèle avec des variables [VARIABLE]"
              className="min-h-64"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Utilisez [VARIABLE] pour les champs à remplir
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={onSubmit}>
              {isEditing ? 'Modifier' : 'Créer'} le modèle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};