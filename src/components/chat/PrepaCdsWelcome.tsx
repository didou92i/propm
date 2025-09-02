import { useState } from "react";
import { GraduationCap, Target, BookOpen, Clock, Trophy, TrendingUp, FileText, HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PrepaCdsControls } from "./PrepaCdsControls";
import type { TrainingType } from "@/types/prepacds";
import { usePrepaCdsEnhancements } from "@/hooks/chat/usePrepaCdsEnhancements";
import { usePrepaCdsChat } from "@/hooks/usePrepaCdsChat";
import type { UserLevel, StudyDomain as ServiceStudyDomain } from "@/services/prepacds";
import type { StudyDomain as ControlsStudyDomain } from "./PrepaCdsControls";
import { PrepaCdsProgressTracker } from "./PrepaCdsProgressTracker";
import type { Message } from "@/types/chat";
import { toast } from "sonner";
import { usePrepaCdsConfig } from "@/hooks/chat/usePrepaCdsConfig";
import { mapServiceToEdge } from "@/types/prepacds";
interface PrepaCdsWelcomeProps {
  onSuggestionClick: (suggestion: string) => void;
  onSendMessage: (message: Message) => void;
}
export function PrepaCdsWelcome({
  onSuggestionClick,
  onSendMessage
}: PrepaCdsWelcomeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const {
    configuration,
    userProgress,
    updateLevel,
    updateDomain,
    selectTrainingType,
    startSession
  } = usePrepaCdsEnhancements();
  const {
    generateContent,
    isLoading
  } = usePrepaCdsChat();
  const {
    updateConfig
  } = usePrepaCdsConfig();
  const getTrainingPrompt = (trainingType: TrainingType, level: UserLevel, domain: ServiceStudyDomain): string => {
    const prompts: Record<TrainingType, string> = {
      'qcm': `Créez des questions à choix multiples pour mon niveau ${level}, focalisé sur ${domain}. Proposez des QCM avec explications détaillées.`,
      'vrai_faux': `Créez un test Vrai/Faux pour mon niveau ${level} en ${domain}. Chaque réponse doit être justifiée.`,
      'cas_pratique': `Proposez-moi un exercice de management et rédaction pour niveau ${level}. Donnez-moi un cas pratique de gestion d'équipe avec rédaction d'une note de service.`,
      'question_ouverte': `Créez des questions ouvertes pour mon niveau ${level}, focalisé sur ${domain}. Demandez développement et argumentation.`,
      'simulation_oral': `Démarrez une simulation d'entretien oral pour le niveau ${level} dans le domaine ${domain}. Simulez un jury de concours.`,
      'plan_revision': `Créez un plan de révision personnalisé pour mon niveau ${level} en ${domain}. Organisez un planning d'apprentissage structuré.`
    };
    return prompts[trainingType];
  };
  const handleStartSession = (trainingType: TrainingType) => {
    startSession(trainingType);
    updateConfig({
      trainingType,
      level: configuration.level,
      domain: 'droit_administratif'
    }); // Default mapping
    setShowConfig(false);

    // Générer automatiquement le prompt selon le type d'entraînement
    const trainingPrompts: Record<TrainingType, string> = {
      'qcm': `Créez des questions à choix multiples pour mon niveau ${configuration.level}, focalisé sur ${configuration.domain}. Proposez des QCM avec explications détaillées.`,
      'vrai_faux': `Créez un test Vrai/Faux pour mon niveau ${configuration.level} en ${configuration.domain}. Chaque réponse doit être justifiée.`,
      'cas_pratique': `Proposez-moi un exercice de management et rédaction pour niveau ${configuration.level}. Donnez-moi un cas pratique de gestion d'équipe avec rédaction d'une note de service.`,
      'question_ouverte': `Créez des questions ouvertes pour mon niveau ${configuration.level}, focalisé sur ${configuration.domain}. Demandez développement et argumentation.`,
      'simulation_oral': `Démarrez une simulation d'entretien oral pour le niveau ${configuration.level} dans le domaine ${configuration.domain}. Simulez un jury de concours.`,
      'plan_revision': `Créez un plan de révision personnalisé pour mon niveau ${configuration.level} en ${configuration.domain}. Organisez un planning d'apprentissage structuré.`
    };

    // Déclencher automatiquement la session avec le prompt personnalisé
    const sessionPrompt = trainingPrompts[trainingType];
    setTimeout(() => {
      onSuggestionClick(sessionPrompt);
    }, 100);
  };
  const handleStartSessionFromControls = (trainingType: TrainingType) => {
    handleStartSession(trainingType);
    setShowConfig(false);
  };
  const stats = [{
    label: "Sessions complétées",
    value: userProgress.completedExercises || 0,
    icon: Trophy
  }, {
    label: "Score moyen",
    value: `${Math.round(userProgress.averageScore)}%`,
    icon: TrendingUp
  }, {
    label: "Domaines maîtrisés",
    value: userProgress.strengths.length,
    icon: Target
  }, {
    label: "Temps d'étude",
    value: `${userProgress.totalStudyTime}min`,
    icon: Clock
  }];
  const quickActions = [{
    title: "Questions à choix multiples",
    description: "QCM avec corrections détaillées",
    icon: CheckCircle,
    action: () => handleStartSession("qcm"),
    color: "text-blue-500"
  }, {
    title: "Vrai ou Faux",
    description: "Affirmations à valider ou invalider",
    icon: HelpCircle,
    action: () => handleStartSession("vrai_faux"),
    color: "text-red-500"
  }, {
    title: "Cas pratiques",
    description: "Situations de management et rédaction",
    icon: FileText,
    action: () => handleStartSession("cas_pratique"),
    color: "text-green-500"
  }, {
    title: "Questions ouvertes",
    description: "Développement et argumentation",
    icon: BookOpen,
    action: () => handleStartSession("question_ouverte"),
    color: "text-purple-500"
  }, {
    title: "Simulation d'oral",
    description: "Préparation entretien jury",
    icon: Target,
    action: () => handleStartSession("simulation_oral"),
    color: "text-orange-500"
  }, {
    title: "Plan de révision",
    description: "Planning personnalisé d'apprentissage",
    icon: TrendingUp,
    action: () => handleStartSession("plan_revision"),
    color: "text-cyan-500"
  }];
  if (showConfig) {
    return <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-4 float pulse-glow neomorphism">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Configuration de votre préparation</h2>
          <p className="text-muted-foreground">Personnalisez votre expérience d'apprentissage</p>
        </div>
        
        <PrepaCdsControls onLevelChange={updateLevel} onDomainChange={(domain: ControlsStudyDomain) => {
        // Map UI domain to service domain
        const map: Record<ControlsStudyDomain, ServiceStudyDomain> = {
          droit_public: 'police_municipale',
          droit_penal: 'procedure_penale',
          management: 'management',
          procedures: 'reglementation',
          redaction: 'droit_administratif',
          culture_generale: 'securite_publique'
        } as const;
        updateDomain(map[domain]);
      }} onTrainingTypeSelect={(type: TrainingType) => selectTrainingType(type)} onStartSession={handleStartSessionFromControls} />
        
        <Button variant="outline" onClick={() => setShowConfig(false)} className="w-full">
          Revenir à l'accueil
        </Button>
      </div>;
  }
  return;
}