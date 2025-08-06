import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Clock,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Star
} from 'lucide-react';

interface ProgressData {
  completedExercises: number;
  averageScore: number;
  weakAreas: string[];
  strengths: string[];
  totalStudyTime: number;
  currentStreak: number;
  level: string;
  domain: string;
}

interface PrepaCdsProgressTrackerProps {
  progressData: ProgressData;
}

export function PrepaCdsProgressTracker({ progressData }: PrepaCdsProgressTrackerProps) {
  const {
    completedExercises,
    averageScore,
    weakAreas,
    strengths,
    totalStudyTime,
    currentStreak,
    level,
    domain
  } = progressData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const studyTimeHours = Math.floor(totalStudyTime / 60);
  const studyTimeMinutes = totalStudyTime % 60;

  return (
    <div className="space-y-4">
      {/* Vue d'ensemble des statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-prepacds/5 to-prepacds/10 border-prepacds/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="h-5 w-5 text-prepacds" />
            </div>
            <div className="text-2xl font-bold text-prepacds">{completedExercises}</div>
            <div className="text-xs text-muted-foreground">Exercices</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className={`h-5 w-5 ${getScoreColor(averageScore)}`} />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Score moyen</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950 dark:to-orange-900 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-600">
              {studyTimeHours}h{studyTimeMinutes > 0 && ` ${studyTimeMinutes}m`}
            </div>
            <div className="text-xs text-muted-foreground">Temps d'étude</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950 dark:to-yellow-900 dark:border-yellow-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Jours consécutifs</div>
          </CardContent>
        </Card>
      </div>

      {/* Progression par niveau */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-prepacds" />
            Progression actuelle
          </CardTitle>
          <CardDescription>
            Niveau {level} • Domaine {domain}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Maîtrise du niveau</span>
              <Badge variant={getScoreBadgeVariant(averageScore)}>
                {averageScore.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={averageScore} className="h-2" />
          </div>

          {completedExercises > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Exercices complétés</span>
                <span className="text-sm text-muted-foreground">
                  {completedExercises} / 50 recommandés
                </span>
              </div>
              <Progress value={(completedExercises / 50) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points forts et faibles */}
      <div className="grid md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <Award className="h-5 w-5" />
                Points forts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strengths.map((strength, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                  >
                    {strength}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {weakAreas.length > 0 && (
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                À améliorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((area, index) => (
                  <Badge 
                    key={index} 
                    variant="destructive" 
                    className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommandations intelligentes */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Brain className="h-5 w-5" />
            Recommandations personnalisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {averageScore < 60 && (
              <p className="text-blue-700 dark:text-blue-300">
                💡 Concentrez-vous sur les bases. Révisez les concepts fondamentaux avant de passer aux exercices avancés.
              </p>
            )}
            {averageScore >= 60 && averageScore < 80 && (
              <p className="text-blue-700 dark:text-blue-300">
                🎯 Bon niveau ! Approfondissez vos acquis avec des cas pratiques plus complexes.
              </p>
            )}
            {averageScore >= 80 && (
              <p className="text-blue-700 dark:text-blue-300">
                🏆 Excellent niveau ! Entraînez-vous sur des sujets de concours blancs et des situations complexes.
              </p>
            )}
            {currentStreak === 0 && (
              <p className="text-blue-700 dark:text-blue-300">
                📅 Établissez une routine d'étude quotidienne pour optimiser votre progression.
              </p>
            )}
            {currentStreak >= 7 && (
              <p className="text-blue-700 dark:text-blue-300">
                🔥 Excellente régularité ! Maintenez ce rythme pour maximiser vos chances de réussite.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}