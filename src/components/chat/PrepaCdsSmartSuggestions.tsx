import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Target,
  BookOpen,
  FileText,
  Clock,
  Award,
  ChevronRight
} from 'lucide-react';

interface UserProfile {
  level: string;
  domain: string;
  averageScore: number;
  completedExercises: number;
  weakAreas: string[];
  strengths: string[];
  lastSessionDate: Date | null;
  totalStudyTime: number;
}

interface Suggestion {
  id: string;
  type: 'improvement' | 'next_step' | 'review' | 'challenge';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  estimatedTime: number;
  difficulty: string;
}

interface PrepaCdsSmartSuggestionsProps {
  userProfile: UserProfile;
  onSuggestionClick: (suggestion: string) => void;
}

export function PrepaCdsSmartSuggestions({ userProfile, onSuggestionClick }: PrepaCdsSmartSuggestionsProps) {
  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const { level, domain, averageScore, completedExercises, weakAreas, strengths, lastSessionDate } = userProfile;

    // Suggestions basées sur le score
    if (averageScore < 60) {
      suggestions.push({
        id: 'basics_review',
        type: 'improvement',
        title: 'Révision des fondamentaux',
        description: 'Renforcez vos bases avant de progresser',
        action: `Créez-moi un plan de révision des concepts de base en ${domain} pour niveau ${level}. Focalisez sur les notions essentielles avec des exemples simples.`,
        priority: 'high',
        icon: <BookOpen className="h-4 w-4" />,
        estimatedTime: 30,
        difficulty: 'Facile'
      });
    } else if (averageScore >= 60 && averageScore < 80) {
      suggestions.push({
        id: 'intermediate_practice',
        type: 'next_step',
        title: 'Cas pratiques intermédiaires',
        description: 'Approfondissez avec des situations concrètes',
        action: `Proposez-moi des cas pratiques de niveau intermédiaire en ${domain}. Variez les situations pour tester ma compréhension.`,
        priority: 'high',
        icon: <Target className="h-4 w-4" />,
        estimatedTime: 25,
        difficulty: 'Intermédiaire'
      });
    } else {
      suggestions.push({
        id: 'advanced_challenge',
        type: 'challenge',
        title: 'Défi expert',
        description: 'Situations complexes et jurisprudence',
        action: `Créez un défi expert en ${domain} avec des cas complexes, de la jurisprudence récente et des situations d'exception.`,
        priority: 'medium',
        icon: <Award className="h-4 w-4" />,
        estimatedTime: 45,
        difficulty: 'Expert'
      });
    }

    // Suggestions basées sur les points faibles
    if (weakAreas.length > 0) {
      suggestions.push({
        id: 'weak_areas_focus',
        type: 'improvement',
        title: 'Travail ciblé',
        description: `Focus sur ${weakAreas[0]}`,
        action: `Créez un entraînement spécialisé sur "${weakAreas[0]}" avec des exercices progressifs et des explications détaillées.`,
        priority: 'high',
        icon: <TrendingUp className="h-4 w-4" />,
        estimatedTime: 20,
        difficulty: level === 'debutant' ? 'Facile' : 'Intermédiaire'
      });
    }

    // Suggestions basées sur l'activité
    const daysSinceLastSession = lastSessionDate 
      ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceLastSession && daysSinceLastSession >= 3) {
      suggestions.push({
        id: 'comeback_session',
        type: 'review',
        title: 'Session de reprise',
        description: 'Révision douce après une pause',
        action: `Organisez une session de reprise douce après ${daysSinceLastSession} jours d'arrêt. Mélangez révision et nouveaux exercices.`,
        priority: 'medium',
        icon: <Clock className="h-4 w-4" />,
        estimatedTime: 15,
        difficulty: 'Révision'
      });
    }

    // Suggestions basées sur les forces
    if (strengths.length > 0 && averageScore >= 70) {
      suggestions.push({
        id: 'cross_domain',
        type: 'challenge',
        title: 'Exercice transversal',
        description: `Combinez ${strengths[0]} avec d'autres domaines`,
        action: `Créez un exercice transversal combinant "${strengths[0]}" avec d'autres domaines du concours pour élargir mes compétences.`,
        priority: 'low',
        icon: <Brain className="h-4 w-4" />,
        estimatedTime: 35,
        difficulty: 'Avancé'
      });
    }

    // Suggestions de nouveaux types d'entraînement
    if (completedExercises >= 5) {
      suggestions.push({
        id: 'new_format',
        type: 'next_step',
        title: 'Nouveau format',
        description: 'Essayez l\'oral ou la rédaction',
        action: 'Proposez-moi une simulation d\'entretien oral pour le concours CDS avec des questions variées et une grille d\'évaluation.',
        priority: 'medium',
        icon: <FileText className="h-4 w-4" />,
        estimatedTime: 30,
        difficulty: 'Oral'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const suggestions = generateSuggestions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Priorité haute';
      case 'medium': return 'Priorité moyenne';
      case 'low': return 'Optionnel';
      default: return priority;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Lightbulb className="h-5 w-5" />
          Suggestions personnalisées
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          Recommandations basées sur votre profil et vos performances
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-4">
            <Brain className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Continuez à vous entraîner pour recevoir des suggestions personnalisées !
            </p>
          </div>
        ) : (
          suggestions.slice(0, 4).map((suggestion, index) => (
            <Card 
              key={suggestion.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 group"
              onClick={() => onSuggestionClick(suggestion.action)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    {suggestion.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                        {suggestion.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                      >
                        {getPriorityLabel(suggestion.priority)}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {suggestion.estimatedTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {suggestion.difficulty}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {suggestions.length > 4 && (
          <Button 
            variant="outline" 
            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => onSuggestionClick("Montrez-moi toutes mes suggestions personnalisées avec des recommandations détaillées.")}
          >
            Voir plus de suggestions ({suggestions.length - 4} autres)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}