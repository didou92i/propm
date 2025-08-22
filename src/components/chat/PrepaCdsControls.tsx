import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, TrendingUp, FileText, CheckCircle, HelpCircle, Play, Zap } from 'lucide-react';
import { usePrepaCdsConfig } from "@/hooks/chat/usePrepaCdsConfig";
import { mapUiToEdge, mapEdgeToUi } from "@/types/prepacds";
import { TrainingExperiencePlayer } from '@/components/training';

export type UserLevel = 'debutant' | 'intermediaire' | 'avance';
export type TrainingType = 
  | 'qcm'
  | 'vrai_faux'
  | 'cas_pratique'
  | 'question_ouverte'
  | 'simulation_oral'
  | 'plan_revision';
export type StudyDomain = 'droit_public' | 'droit_penal' | 'management' | 'procedures' | 'redaction' | 'culture_generale';

interface PrepaCdsControlsProps {
  onLevelChange: (level: UserLevel) => void;
  onTrainingTypeSelect: (type: TrainingType) => void;
  onDomainChange: (domain: StudyDomain) => void;
  onStartSession: (trainingType: TrainingType) => void;
}

interface TrainingSession {
  id: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  progress: number;
  score?: number;
}

const trainingTypeLabels: Record<TrainingType, { label: string; icon: React.ReactNode; description: string }> = {
  qcm: { 
    label: 'Questions à choix multiples', 
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'QCM avec corrections détaillées' 
  },
  vrai_faux: { 
    label: 'Vrai ou Faux', 
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Affirmations à valider ou invalider' 
  },
  cas_pratique: { 
    label: 'Cas pratiques', 
    icon: <FileText className="h-4 w-4" />,
    description: 'Situations de management et rédaction' 
  },
  question_ouverte: { 
    label: 'Questions ouvertes', 
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Développement et argumentation' 
  },
  simulation_oral: { 
    label: 'Simulation d\'oral', 
    icon: <Target className="h-4 w-4" />,
    description: 'Préparation entretien jury' 
  },
  plan_revision: { 
    label: 'Plan de révision', 
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Planning personnalisé d\'apprentissage' 
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
  const { config, updateConfig } = usePrepaCdsConfig();
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>(config.level);
  const [selectedDomain, setSelectedDomain] = useState<StudyDomain>(mapEdgeToUi(config.domain));
  const [selectedTrainingType, setSelectedTrainingType] = useState<TrainingType | null>(config.trainingType);
  const [showTrainingPlayer, setShowTrainingPlayer] = useState(false);

const handleLevelChange = (level: UserLevel) => {
  setSelectedLevel(level);
  updateConfig({ level });
  onLevelChange(level);
};

const handleDomainChange = (domain: StudyDomain) => {
  setSelectedDomain(domain);
  updateConfig({ domain: mapUiToEdge(domain) });
  onDomainChange(domain);
};

const handleTrainingTypeSelect = (type: TrainingType) => {
  setSelectedTrainingType(type);
  updateConfig({ trainingType: type });
  onTrainingTypeSelect(type);
};

  const handleStartSession = () => {
    if (selectedTrainingType) {
      setShowTrainingPlayer(true);
      onStartSession(selectedTrainingType);
    }
  };

  const handleTrainingComplete = (session: TrainingSession) => {
    console.log('Session terminée:', session);
    setShowTrainingPlayer(false);
  };

  const handleTrainingExit = () => {
    setShowTrainingPlayer(false);
  };

  // Si le player d'entraînement est actif, l'afficher
  if (showTrainingPlayer && selectedTrainingType) {
    return (
      <TrainingExperiencePlayer
        trainingType={selectedTrainingType}
        level={selectedLevel}
        domain={selectedDomain}
        onComplete={handleTrainingComplete}
        onExit={handleTrainingExit}
      />
    );
  }

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
          className="w-full gap-2 bg-gradient-to-r from-prepacds-primary to-prepacds-accent hover:from-prepacds-accent hover:to-prepacds-primary transition-all duration-300"
          size="lg"
        >
          <Zap className="h-4 w-4" />
          {selectedTrainingType ? '🚀 Lancer l\'expérience interactive' : 'Sélectionnez un type d\'entraînement'}
        </Button>
      </CardContent>
    </Card>
  );
}