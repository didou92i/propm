import { useState } from "react";
import { GraduationCap, Target, BookOpen, Clock, Trophy, TrendingUp, FileText, HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PrepaCdsControls, TrainingType } from "./PrepaCdsControls";
import { usePrepaCdsEnhancements } from "@/hooks/chat/usePrepaCdsEnhancements";
import type { 
  UserLevel, 
  StudyDomain as ServiceStudyDomain
} from "@/services/prepaCdsService";
import type { StudyDomain as ControlsStudyDomain } from "./PrepaCdsControls";
import { PrepaCdsProgressTracker } from "./PrepaCdsProgressTracker";

interface PrepaCdsWelcomeProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function PrepaCdsWelcome({ onSuggestionClick }: PrepaCdsWelcomeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const { 
    configuration, 
    userProgress, 
    updateLevel, 
    updateDomain, 
    selectTrainingType,
    startSession 
  } = usePrepaCdsEnhancements();

  const handleStartSession = (trainingType: TrainingType) => {
    startSession(trainingType);
    setShowConfig(false);
    
    // Générer automatiquement le prompt selon le type d'entraînement
    const trainingPrompts: Record<TrainingType, string> = {
      'analyse_documents': `Générez un exercice d'analyse documentaire pour mon niveau ${configuration.level} en ${configuration.domain}. Proposez-moi des documents administratifs réalistes à analyser avec une méthodologie de synthèse.`,
      'questionnaire_droit': `Créez un questionnaire de droit pour mon niveau ${configuration.level}, focalisé sur ${configuration.domain}. Posez-moi des questions précises avec explications détaillées.`,
      'management_redaction': `Proposez-moi un exercice de management et rédaction pour niveau ${configuration.level}. Donnez-moi un cas pratique de gestion d'équipe avec rédaction d'une note de service.`,
      'entrainement_mixte': `Lancez un entraînement mixte combinant documents et questions pour mon profil ${configuration.level} en ${configuration.domain}. Alternez analyse documentaire et questionnaire.`,
      'evaluation_connaissances': `Démarrez une évaluation de connaissances avec 10 questions pour niveau ${configuration.level} dans le domaine ${configuration.domain}. Variez les types de questions.`,
      'vrai_faux': `Créez un test Vrai/Faux de 15 questions pour mon niveau ${configuration.level} en ${configuration.domain}. Chaque réponse doit être justifiée.`,
      'evaluation_note_service': `Proposez-moi l'analyse d'une note de service administrative pour niveau ${configuration.level}. Donnez-moi une note réaliste à examiner et critiquer.`
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
      title: "Questionnaire de droit",
      description: "Questions précises en droit public et pénal",
      icon: BookOpen,
      action: () => handleStartSession("questionnaire_droit"),
      color: "text-blue-500"
    },
    {
      title: "Analyse de documents",
      description: "Note de synthèse méthodologique",
      icon: FileText,
      action: () => handleStartSession("analyse_documents"),
      color: "text-green-500"
    },
    {
      title: "Management & rédaction",
      description: "Cas pratiques de gestion d'équipe",
      icon: Target,
      action: () => handleStartSession("management_redaction"),
      color: "text-purple-500"
    },
    {
      title: "Évaluation 10 questions",
      description: "Test de connaissances générales",
      icon: CheckCircle,
      action: () => handleStartSession("evaluation_connaissances"),
      color: "text-orange-500"
    },
    {
      title: "Vrai ou Faux",
      description: "15 affirmations à valider",
      icon: HelpCircle,
      action: () => handleStartSession("vrai_faux"),
      color: "text-red-500"
    },
    {
      title: "Entraînement mixte",
      description: "Documents + questions alternés",
      icon: TrendingUp,
      action: () => handleStartSession("entrainement_mixte"),
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
          onDomainChange={(domain: ControlsStudyDomain) => updateDomain(domain as ServiceStudyDomain)}
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