import { useState } from "react";
import { GraduationCap, Target, BookOpen, Clock, Trophy, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PrepaCdsControls } from "./PrepaCdsControls";
import { usePrepaCdsEnhancements } from "@/hooks/chat/usePrepaCdsEnhancements";
import type { 
  UserLevel, 
  StudyDomain as ServiceStudyDomain, 
  TrainingType 
} from "@/services/prepaCdsService";
import type { StudyDomain as ControlsStudyDomain } from "./PrepaCdsControls";

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

  const handleStartSession = (type: TrainingType) => {
    startSession(type);
    setShowConfig(false);
    
    // Générer le message approprié selon le type d'entraînement
    const trainingMessages: Record<string, string> = {
      "qcm": "Je souhaite commencer un entraînement QCM adapté à mon niveau",
      "cas_pratique": "Générez-moi un cas pratique pour m'entraîner",
      "plan_revision": "Créez un plan de révision personnalisé selon mes besoins",
      "oral": "Simulez un entretien oral pour ma préparation",
      "vrai_faux": "Proposez-moi des questions vrai/faux pour réviser",
      "question_ouverte": "Donnez-moi une question ouverte pour approfondir",
      "evaluation": "Évaluez mes progrès et donnez-moi des conseils"
    };
    
    onSuggestionClick(trainingMessages[type]);
  };

  const stats = [
    { label: "Sessions complétées", value: userProgress.completedExercises || 0, icon: Trophy },
    { label: "Score moyen", value: `${Math.round(userProgress.averageScore)}%`, icon: TrendingUp },
    { label: "Domaines maîtrisés", value: userProgress.strengths.length, icon: Target },
    { label: "Temps d'étude", value: `${userProgress.totalStudyTime}min`, icon: Clock }
  ];

  const quickActions = [
    {
      title: "Entraînement QCM",
      description: "Questions à choix multiples adaptées",
      icon: Target,
      action: () => handleStartSession("qcm" as TrainingType),
      color: "text-orange-500"
    },
    {
      title: "Cas Pratique",
      description: "Situations concrètes à analyser",
      icon: FileText,
      action: () => handleStartSession("cas_pratique" as TrainingType),
      color: "text-blue-500"
    },
    {
      title: "Plan de Révision",
      description: "Stratégie personnalisée d'apprentissage",
      icon: BookOpen,
      action: () => handleStartSession("plan_revision" as TrainingType),
      color: "text-green-500"
    },
    {
      title: "Simulation Orale",
      description: "Préparation aux entretiens",
      icon: GraduationCap,
      action: () => handleStartSession("oral" as TrainingType),
      color: "text-purple-500"
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
          onTrainingTypeSelect={(type: string) => selectTrainingType(type as TrainingType)}
          onStartSession={() => setShowConfig(false)}
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

      {/* Statistiques utilisateur */}
      {userProgress.completedExercises > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {stats.map((stat, index) => (
            <Card key={stat.label} className="glass neomorphism-subtle hover-lift">
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-orange-500">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progression globale */}
      {userProgress.completedExercises > 0 && (
        <Card className="glass neomorphism hover-glow animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Votre progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Score moyen</span>
                  <span className="font-medium">{Math.round(userProgress.averageScore)}%</span>
                </div>
                <Progress value={userProgress.averageScore} className="h-2" />
              </div>
              
              {userProgress.strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Domaines de force:</p>
                  <div className="flex flex-wrap gap-1">
                    {userProgress.strengths.slice(0, 3).map((strength, index) => (
                      <Badge key={index} variant="secondary" className="text-xs glass">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <Card 
            key={action.title}
            className="glass neomorphism-subtle hover-lift cursor-pointer group animate-fade-in ripple-container"
            style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            onClick={action.action}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg glass flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-orange-500 transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
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