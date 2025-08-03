import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Upload, 
  Search, 
  FileText,
  Sparkles,
  ArrowRight,
  Users,
  BarChart3
} from 'lucide-react';

interface WelcomeCardsProps {
  onStartChat: () => void;
  onUploadDocument: () => void;
  onSemanticSearch: () => void;
  onShowTemplates: () => void;
}

export const WelcomeCards: React.FC<WelcomeCardsProps> = ({
  onStartChat,
  onUploadDocument,
  onSemanticSearch,
  onShowTemplates
}) => {
  const features = [
    {
      icon: MessageSquare,
      title: "Commencer une conversation",
      description: "Posez n'importe quelle question à votre assistant IA spécialisé",
      action: "Démarrer",
      onClick: onStartChat,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Upload,
      title: "Analyser vos documents",
      description: "Uploadez des fichiers PDF, Word, Excel pour les analyser avec l'IA",
      action: "Uploader",
      onClick: onUploadDocument,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Search,
      title: "Retrouver vos documents",
      description: "Recherche intelligente dans tous vos fichiers analysés",
      action: "Rechercher",
      onClick: onSemanticSearch,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: FileText,
      title: "Modèles prêts à l'emploi",
      description: "Templates pré-configurés pour différents types de projets",
      action: "Explorer",
      onClick: onShowTemplates,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  const agents = [
    { name: "Développeur", specialty: "Code & Tech", color: "bg-blue-500" },
    { name: "Marketing", specialty: "Communication", color: "bg-green-500" },
    { name: "Analyste", specialty: "Données & Stats", color: "bg-purple-500" },
    { name: "Designer", specialty: "Créatif & UX", color: "bg-orange-500" }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Bienvenue dans votre assistant IA
        </h1>
        <p className="text-muted-foreground">
          Choisissez comment vous souhaitez commencer
        </p>
      </div>

      {/* Fonctionnalités principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={index} 
              className="glass neomorphism hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              onClick={feature.onClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Recommandé
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {feature.description}
                </CardDescription>
                <Button 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  {feature.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assistants disponibles */}
      <Card className="glass neomorphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assistants spécialisés
          </CardTitle>
          <CardDescription>
            Chaque assistant a été entraîné pour exceller dans son domaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agents.map((agent, index) => (
              <div 
                key={index}
                className="text-center p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className={`w-8 h-8 ${agent.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.specialty}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass text-center p-4">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-xs text-muted-foreground">Disponibilité</div>
        </Card>
        <Card className="glass text-center p-4">
          <div className="text-2xl font-bold text-primary">50+</div>
          <div className="text-xs text-muted-foreground">Formats supportés</div>
        </Card>
        <Card className="glass text-center p-4">
          <div className="text-2xl font-bold text-primary">∞</div>
          <div className="text-xs text-muted-foreground">Possibilités</div>
        </Card>
      </div>
    </div>
  );
};