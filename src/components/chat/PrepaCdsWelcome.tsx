import { useState } from "react";
import { GraduationCap, Target, BookOpen, Clock, Trophy, TrendingUp, FileText, HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PrepaCdsControls, TrainingType } from "./PrepaCdsControls";
import { usePrepaCdsEnhancements } from "@/hooks/chat/usePrepaCdsEnhancements";
import { usePrepaCdsChat } from "@/hooks/usePrepaCdsChat";
import type { 
  UserLevel, 
  StudyDomain as ServiceStudyDomain
} from "@/services/prepacds";
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

export function PrepaCdsWelcome({ onSuggestionClick, onSendMessage }: PrepaCdsWelcomeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const { 
    configuration, 
    userProgress, 
    updateLevel, 
    updateDomain, 
    selectTrainingType,
    startSession 
  } = usePrepaCdsEnhancements();
  
const { generateContent, isLoading } = usePrepaCdsChat();
  const { updateConfig } = usePrepaCdsConfig();

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
    updateConfig({ trainingType, level: configuration.level, domain: 'droit_administratif' }); // Default mapping
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

  const stats = [
    { label: "Sessions complétées", value: userProgress.completedExercises || 0, icon: Trophy },
    { label: "Score moyen", value: `${Math.round(userProgress.averageScore)}%`, icon: TrendingUp },
    { label: "Domaines maîtrisés", value: userProgress.strengths.length, icon: Target },
    { label: "Temps d'étude", value: `${userProgress.totalStudyTime}min`, icon: Clock }
  ];

  const quickActions = [
    {
      title: "Questions à choix multiples",
      description: "QCM avec corrections détaillées",
      icon: CheckCircle,
      action: () => handleStartSession("qcm"),
      color: "text-blue-500"
    },
    {
      title: "Vrai ou Faux",
      description: "Affirmations à valider ou invalider",
      icon: HelpCircle,
      action: () => handleStartSession("vrai_faux"),
      color: "text-red-500"
    },
    {
      title: "Cas pratiques",
      description: "Situations de management et rédaction",
      icon: FileText,
      action: () => handleStartSession("cas_pratique"),
      color: "text-green-500"
    },
    {
      title: "Questions ouvertes",
      description: "Développement et argumentation",
      icon: BookOpen,
      action: () => handleStartSession("question_ouverte"),
      color: "text-purple-500"
    },
    {
      title: "Simulation d'oral",
      description: "Préparation entretien jury",
      icon: Target,
      action: () => handleStartSession("simulation_oral"),
      color: "text-orange-500"
    },
    {
      title: "Plan de révision",
      description: "Planning personnalisé d'apprentissage",
      icon: TrendingUp,
      action: () => handleStartSession("plan_revision"),
      color: "text-cyan-500"
    }
  ];

  if (showConfig) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-4 float pulse-glow neomorphism">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Configuration de votre préparation</h2>
          <p className="text-muted-foreground">Personnalisez votre expérience d'apprentissage</p>
        </div>
        
        <PrepaCdsControls
          onLevelChange={updateLevel}
          onDomainChange={(domain: ControlsStudyDomain) => {
            // Map UI domain to service domain
            const map: Record<ControlsStudyDomain, ServiceStudyDomain> = {
              droit_public: 'police_municipale',
              droit_penal: 'procedure_penale',
              management: 'management',
              procedures: 'reglementation',
              redaction: 'droit_administratif',
              culture_generale: 'securite_publique',
            } as const;
            updateDomain(map[domain]);
          }}
          onTrainingTypeSelect={(type: TrainingType) => selectTrainingType(type)}
          onStartSession={handleStartSessionFromControls}
        />
        
        <Button 
          variant="outline" 
          onClick={() => setShowConfig(false)}
          className="w-full"
        >
          Revenir à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête personnalisé */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-6 float pulse-glow neomorphism overflow-hidden">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3 animate-scale-in">
          Prepa CDS
        </h1>
        <p className="text-muted-foreground text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Votre assistant personnel pour réussir les concours de la fonction publique
        </p>
        
        {configuration.level && configuration.domain && (
          <div className="flex justify-center gap-2 mt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Badge variant="secondary" className="glass">
              Niveau {configuration.level}
            </Badge>
            <Badge variant="outline" className="glass">
              {configuration.domain}
            </Badge>
          </div>
        )}
      </div>

      {/* Tableau de progression avancé */}
      <PrepaCdsProgressTracker 
        progressData={{
          completedExercises: userProgress.completedExercises,
          averageScore: userProgress.averageScore,
          weakAreas: userProgress.weakAreas,
          strengths: userProgress.strengths,
          totalStudyTime: userProgress.totalStudyTime,
          currentStreak: 3, // Simulé pour l'instant
          level: configuration.level,
          domain: configuration.domain
        }}
      />

      {/* Actions rapides - Types d'entraînement */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-center">Types d'entraînement disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={action.title}
              className="glass neomorphism-subtle hover-lift cursor-pointer group animate-fade-in ripple-container transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              onClick={action.action}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg glass flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base group-hover:text-prepacds transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Bouton de configuration */}
      <div className="text-center pt-4">
        <Button 
          onClick={() => setShowConfig(true)}
          variant="outline"
          className="glass hover-glow"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Configurer ma préparation
        </Button>
      </div>

      {/* Message d'encouragement contextuel */}
      <Card className="glass border-orange-500/20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {userProgress.completedExercises === 0 
              ? "🎯 Commencez votre première session d'entraînement pour débloquer vos statistiques détaillées !"
              : userProgress.averageScore >= 75
                ? "🏆 Excellents résultats ! Continuez sur cette lancée pour maximiser vos chances de réussite."
                : "💪 Chaque session vous rapproche de votre objectif. Persévérez et les résultats suivront !"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}