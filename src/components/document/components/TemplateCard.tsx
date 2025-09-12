import React from 'react';
import { FileText, Calendar, Copy, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface TemplateCardProps {
  template: DocumentTemplate;
  onUse: (template: DocumentTemplate) => void;
  onCopy: (template: DocumentTemplate) => void;
  onEdit: (template: DocumentTemplate) => void;
  onDelete: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onUse,
  onCopy,
  onEdit,
  onDelete
}) => {
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

  const Icon = categoryIcons[template.category];

  return (
    <Card className="hover:shadow-md transition-shadow">
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
            onClick={() => onUse(template)}
            className="flex-1"
          >
            Utiliser
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onCopy(template)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(template)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};