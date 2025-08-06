import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, TrendingUp, FileText, CheckCircle, HelpCircle, Play } from 'lucide-react';

export type UserLevel = 'debutant' | 'intermediaire' | 'avance';
export type TrainingType = 'analyse_documents' | 'questionnaire_droit' | 'management_redaction' | 'entrainement_mixte' | 'evaluation_connaissances' | 'vrai_faux' | 'evaluation_note_service';
export type StudyDomain = 'droit_public' | 'droit_penal' | 'management' | 'procedures' | 'redaction' | 'culture_generale';

interface PrepaCdsControlsProps {
  onLevelChange: (level: UserLevel) => void;
  onTrainingTypeSelect: (type: TrainingType) => void;
  onDomainChange: (domain: StudyDomain) => void;
  onStartSession: (trainingType: TrainingType) => void;
}

const trainingTypeLabels: Record<TrainingType, { label: string; icon: React.ReactNode; description: string }> = {
  analyse_documents: { 
    label: 'Analyse de documents', 
    icon: <FileText className="h-4 w-4" />,
    description: 'Note de synthèse à partir de documents' 
  },
  questionnaire_droit: { 
    label: 'Questionnaire de droit', 
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Droit public et pénal' 
  },
  management_redaction: { 
    label: 'Management & rédaction', 
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Exercices de gestion et rapports' 
  },
  entrainement_mixte: { 
    label: 'Entraînement mixte', 
    icon: <Target className="h-4 w-4" />,
    description: 'Documents + questions' 
  },
  evaluation_connaissances: { 
    label: '10 questions d\'évaluation', 
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Test de connaissances générales' 
  },
  vrai_faux: { 
    label: 'Vrai ou Faux', 
    icon: <HelpCircle className="h-4 w-4" />,
    description: '15 questions rapides' 
  },
  evaluation_note_service: { 
    label: 'Évaluation note de service', 
    icon: <FileText className="h-4 w-4" />,
    description: 'Analyse d\'une note administrative' 
  }
};

const levelLabels: Record<UserLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé'
};

const domainLabels: Record<StudyDomain, string> = {
  droit_public: 'Droit public',
  droit_penal: 'Droit pénal',
  management: 'Management',
  procedures: 'Procédures',
  redaction: 'Rédaction',
  culture_generale: 'Culture générale'
};

export function PrepaCdsControls({ onLevelChange, onTrainingTypeSelect, onDomainChange, onStartSession }: PrepaCdsControlsProps) {
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>('intermediaire');
  const [selectedDomain, setSelectedDomain] = useState<StudyDomain>('droit_public');
  const [selectedTrainingType, setSelectedTrainingType] = useState<TrainingType | null>(null);

  const handleLevelChange = (level: UserLevel) => {
    setSelectedLevel(level);
    onLevelChange(level);
  };

  const handleDomainChange = (domain: StudyDomain) => {
    setSelectedDomain(domain);
    onDomainChange(domain);
  };

  const handleTrainingTypeSelect = (type: TrainingType) => {
    setSelectedTrainingType(type);
    onTrainingTypeSelect(type);
  };

  const handleStartSession = () => {
    if (selectedTrainingType) {
      // Passer le type d'entraînement sélectionné au parent
      onStartSession(selectedTrainingType);
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Configuration Prepa CDS
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Personnalisez votre entraînement pour optimiser votre préparation au concours
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Niveau et domaine */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Niveau actuel</label>
            <Select value={selectedLevel} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez votre niveau" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Domaine prioritaire</label>
            <Select value={selectedDomain} onValueChange={handleDomainChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisissez un domaine" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(domainLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Types d'entraînement */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Type d'entraînement</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(trainingTypeLabels).map(([type, config]) => (
              <Button
                key={type}
                variant={selectedTrainingType === type ? "default" : "outline"}
                className="h-auto p-4 justify-start text-left"
                onClick={() => handleTrainingTypeSelect(type as TrainingType)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {config.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Configuration actuelle */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          <Badge variant="secondary" className="gap-1">
            <Target className="h-3 w-3" />
            {levelLabels[selectedLevel]}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {domainLabels[selectedDomain]}
          </Badge>
          {selectedTrainingType && (
            <Badge variant="default" className="gap-1">
              {trainingTypeLabels[selectedTrainingType].icon}
              {trainingTypeLabels[selectedTrainingType].label}
            </Badge>
          )}
        </div>

        {/* Bouton de démarrage */}
        <Button 
          onClick={handleStartSession}
          disabled={!selectedTrainingType}
          className="w-full gap-2"
          size="lg"
        >
          <Play className="h-4 w-4" />
          {selectedTrainingType ? 'Démarrer la session' : 'Sélectionnez un type d\'entraînement'}
        </Button>
      </CardContent>
    </Card>
  );
}