import { useState } from "react";
import { FileText, Plus, Edit, Trash2, Copy, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  },
  {
    id: "2",
    name: "Arrêté circulation",
    description: "Modèle d'arrêté pour réglementation de circulation",
    content: `ARRÊTÉ MUNICIPAL N° [NUMERO]

Le Maire de [COMMUNE],

VU le Code général des collectivités territoriales ;
VU le Code de la route ;
VU [AUTRES_REFERENCES] ;

CONSIDÉRANT que [MOTIVATION] ;

ARRÊTE :

Article 1er : [DISPOSITION_PRINCIPALE]

Article 2 : [MODALITES_APPLICATION]

Article 3 : [SANCTIONS]

Article 4 : Le présent arrêté entrera en vigueur le [DATE_EFFET].

Fait à [COMMUNE], le [DATE]

Le Maire,
[NOM_MAIRE]`,
    agentType: "arrete",
    category: "arrete",
    createdAt: new Date(2024, 0, 10),
    lastModified: new Date(2024, 0, 18),
    usage: 32
  },
  {
    id: "3",
    name: "Note de service",
    description: "Modèle de note interne",
    content: `NOTE DE SERVICE N° [NUMERO]

Destinataires : [DESTINATAIRES]
Objet : [OBJET]
Date : [DATE]

[CONTENU_NOTE]

Fait à [COMMUNE], le [DATE]

[SIGNATURE]`,
    agentType: "cdspro",
    category: "note",
    createdAt: new Date(2024, 0, 5),
    lastModified: new Date(2024, 0, 12),
    usage: 28
  }
];

interface DocumentTemplatesProps {
  selectedAgent: string;
  onUseTemplate: (content: string) => void;
}

export function DocumentTemplates({ selectedAgent, onUseTemplate }: DocumentTemplatesProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(initialTemplates);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    content: "",
    agentType: selectedAgent as DocumentTemplate["agentType"],
    category: "rapport" as DocumentTemplate["category"]
  });
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => 
    template.agentType === selectedAgent || template.agentType === "all"
  );

  const categoryIcons = {
    rapport: FileText,
    arrete: FileText,
    pv: FileText,
    note: FileText,
    courrier: FileText
  };

  const categoryColors = {
    rapport: "bg-blue-500",
    arrete: "bg-green-500",
    pv: "bg-red-500",
    note: "bg-yellow-500",
    courrier: "bg-purple-500"
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Erreur",
        description: "Le nom et le contenu sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    const template: DocumentTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
      createdAt: new Date(),
      lastModified: new Date(),
      usage: 0
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: "",
      description: "",
      content: "",
      agentType: selectedAgent as DocumentTemplate["agentType"],
      category: "rapport"
    });
    setIsCreating(false);

    toast({
      title: "Modèle créé",
      description: `Le modèle "${template.name}" a été créé avec succès`
    });
  };

  const handleUseTemplate = (template: DocumentTemplate) => {
    // Incrémenter l'usage
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usage: t.usage + 1, lastModified: new Date() }
        : t
    ));

    onUseTemplate(template.content);

    toast({
      title: "Modèle appliqué",
      description: `Le modèle "${template.name}" a été inséré dans la conversation`
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Modèle supprimé",
      description: "Le modèle a été supprimé avec succès"
    });
  };

  const handleCopyTemplate = (template: DocumentTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copié",
      description: "Le contenu du modèle a été copié dans le presse-papiers"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Modèles de documents</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} modèle(s) disponible(s) pour {selectedAgent}
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass">
            <DialogHeader>
              <DialogTitle>Créer un nouveau modèle</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du modèle</Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Procès-verbal standard"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select 
                    value={newTemplate.category} 
                    onValueChange={(value: DocumentTemplate["category"]) => 
                      setNewTemplate(prev => ({ ...prev, category: value }))
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
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du modèle"
                />
              </div>
              
              <div>
                <Label htmlFor="agentType">Agent cible</Label>
                <Select 
                  value={newTemplate.agentType} 
                  onValueChange={(value: DocumentTemplate["agentType"]) => 
                    setNewTemplate(prev => ({ ...prev, agentType: value }))
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
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu du modèle avec des variables [VARIABLE]"
                  className="min-h-64"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez [VARIABLE] pour les champs à remplir
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Créer le modèle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = categoryIcons[template.category];
          
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${categoryColors[template.category]} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {template.lastModified.toLocaleDateString("fr-FR")}
                  </span>
                  <span>{template.usage} utilisations</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    Utiliser
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyTemplate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun modèle disponible pour cet agent</p>
          <p className="text-sm">Créez votre premier modèle pour commencer</p>
        </div>
      )}
    </div>
  );
}