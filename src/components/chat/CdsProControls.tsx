import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Users, Calculator } from 'lucide-react';

interface CdsProControlsProps {
  onContextChange: (context: CommuneContext) => void;
  onPriorityChange: (priority: Priority) => void;
  onTemplateSelect: (template: DocumentTemplate) => void;
}

export type CommuneContext = 'rural' | 'moyenne' | 'metropole';
export type Priority = 'urgence' | 'conformite' | 'optimisation' | 'planification';
export type DocumentTemplate = 'note_service' | 'rapport_interne' | 'courrier_officiel' | 'procedure';

const COMMUNE_CONTEXTS = {
  rural: { label: 'Commune rurale (<5k hab.)', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  moyenne: { label: 'Ville moyenne (5k-50k hab.)', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  metropole: { label: 'Grande agglomération (>50k hab.)', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' }
};

const PRIORITIES = {
  urgence: { label: 'Urgence opérationnelle', icon: AlertTriangle, color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  conformite: { label: 'Conformité juridique', icon: FileText, color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  optimisation: { label: 'Optimisation administrative', icon: Calculator, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  planification: { label: 'Planification stratégique', icon: Users, color: 'bg-green-500/10 text-green-700 dark:text-green-400' }
};

const DOCUMENT_TEMPLATES = {
  note_service: 'Note de service',
  rapport_interne: 'Rapport interne',
  courrier_officiel: 'Courrier officiel',
  procedure: 'Procédure opérationnelle'
};

export function CdsProControls({ onContextChange, onPriorityChange, onTemplateSelect }: CdsProControlsProps) {
  const [selectedContext, setSelectedContext] = useState<CommuneContext>('moyenne');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('conformite');

  const handleContextChange = (context: CommuneContext) => {
    setSelectedContext(context);
    onContextChange(context);
  };

  const handlePriorityChange = (priority: Priority) => {
    setSelectedPriority(priority);
    onPriorityChange(priority);
  };

  return (
    <div className="space-y-4 p-4 border border-border/40 rounded-lg bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">CDS Pro - Configuration</span>
      </div>

      {/* Contexte territorial */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Contexte territorial
        </label>
        <Select value={selectedContext} onValueChange={handleContextChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COMMUNE_CONTEXTS).map(([key, context]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Badge className={context.color} variant="secondary">
                    {context.label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priorité de traitement */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Priorité de traitement
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRIORITIES).map(([key, priority]) => {
            const Icon = priority.icon;
            return (
              <Button
                key={key}
                variant={selectedPriority === key ? "default" : "outline"}
                size="sm"
                onClick={() => handlePriorityChange(key as Priority)}
                className="justify-start h-auto p-2"
              >
                <Icon className="h-3 w-3 mr-2" />
                <span className="text-xs">{priority.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Templates de documents */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Templates administratifs
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DOCUMENT_TEMPLATES).map(([key, template]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => onTemplateSelect(key as DocumentTemplate)}
              className="justify-start h-auto p-2 text-xs"
            >
              <FileText className="h-3 w-3 mr-2" />
              {template}
            </Button>
          ))}
        </div>
      </div>

      {/* Indicateur de sécurité */}
      <div className="pt-2 border-t border-border/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Mode sécurisé - Police municipale uniquement</span>
        </div>
      </div>
    </div>
  );
}