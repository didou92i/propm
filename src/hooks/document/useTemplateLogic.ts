import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

const initialTemplates: DocumentTemplate[] = [
  {
    id: "1",
    name: "Procès-verbal standard",
    description: "Modèle de PV pour infractions routières",
    content: `PROCÈS-VERBAL D'INFRACTION

Date : [DATE]
Lieu : [LIEU]
Agent verbalisateur : [AGENT]

INFRACTION CONSTATÉE :
Nature : [NATURE_INFRACTION]
Article de loi : [ARTICLE]

CONTREVENANT :
Nom : [NOM]
Prénom : [PRENOM]
Adresse : [ADRESSE]

FAITS :
[DESCRIPTION_FAITS]

TÉMOINS :
[TEMOINS]

L'agent verbalisateur,
[SIGNATURE]`,
    agentType: "redacpro",
    category: "pv",
    createdAt: new Date(2024, 0, 15),
    lastModified: new Date(2024, 0, 20),
    usage: 45
  }
];

export const useTemplateLogic = (selectedAgent: string) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(initialTemplates);
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => 
    template.agentType === selectedAgent || template.agentType === "all"
  );

  const createTemplate = (newTemplate: NewTemplate) => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Erreur",
        description: "Le nom et le contenu sont obligatoires",
        variant: "destructive"
      });
      return false;
    }

    const template: DocumentTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
      createdAt: new Date(),
      lastModified: new Date(),
      usage: 0
    };

    setTemplates(prev => [...prev, template]);
    toast({
      title: "Modèle créé",
      description: `Le modèle "${template.name}" a été créé avec succès`
    });
    return true;
  };

  const useTemplate = (template: DocumentTemplate) => {
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usage: t.usage + 1, lastModified: new Date() }
        : t
    ));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Modèle supprimé",
      description: "Le modèle a été supprimé avec succès"
    });
  };

  const copyTemplate = (template: DocumentTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copié",
      description: "Le contenu du modèle a été copié dans le presse-papiers"
    });
  };

  return {
    templates: filteredTemplates,
    createTemplate,
    useTemplate,
    deleteTemplate,
    copyTemplate
  };
};