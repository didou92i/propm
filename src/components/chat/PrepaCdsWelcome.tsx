import { GraduationCap, Target, BookOpen, Clock, Trophy, TrendingUp, FileText, HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types/chat";

interface PrepaCdsWelcomeProps {
  onSuggestionClick: (suggestion: string) => void;
  onSendMessage: (message: Message) => void;
}

export function PrepaCdsWelcome({
  onSuggestionClick,
  onSendMessage
}: PrepaCdsWelcomeProps) {

  const quickActions = [{
    title: "Questions à choix multiples",
    description: "QCM avec corrections détaillées",
    icon: CheckCircle,
    prompt: "Créez des questions à choix multiples pour la préparation CDS avec explications détaillées.",
    color: "text-blue-500"
  }, {
    title: "Vrai ou Faux",
    description: "Affirmations à valider ou invalider",
    icon: HelpCircle,
    prompt: "Créez un test Vrai/Faux pour la préparation CDS. Chaque réponse doit être justifiée.",
    color: "text-red-500"
  }, {
    title: "Cas pratiques",
    description: "Situations de management et rédaction",
    icon: FileText,
    prompt: "Proposez-moi un cas pratique de management et rédaction pour la préparation CDS.",
    color: "text-green-500"
  }, {
    title: "Questions ouvertes",
    description: "Développement et argumentation",
    icon: BookOpen,
    prompt: "Créez des questions ouvertes pour la préparation CDS nécessitant développement et argumentation.",
    color: "text-purple-500"
  }, {
    title: "Simulation d'oral",
    description: "Préparation entretien jury",
    icon: Target,
    prompt: "Démarrez une simulation d'entretien oral pour la préparation CDS. Simulez un jury de concours.",
    color: "text-orange-500"
  }, {
    title: "Plan de révision",
    description: "Planning personnalisé d'apprentissage",
    icon: TrendingUp,
    prompt: "Créez un plan de révision personnalisé pour la préparation CDS avec planning structuré.",
    color: "text-cyan-500"
  }];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full gradient-agent-animated flex items-center justify-center mx-auto mb-4 float pulse-glow neomorphism">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">Prépa CDS Interactive</h2>
        <p className="text-muted-foreground">Choisissez votre type d'entraînement pour commencer</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Card 
            key={index}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 glass neomorphism-subtle hover-lift"
            onClick={() => onSuggestionClick(action.prompt)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background/50 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                {action.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 Cliquez sur une carte pour commencer immédiatement votre entraînement
        </p>
      </div>
    </div>
  );
}