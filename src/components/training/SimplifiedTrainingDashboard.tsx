import React from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Target, 
  Clock, 
  Trophy,
  TrendingUp,
  Calendar,
  Play,
  Settings
} from 'lucide-react';
import { useTrainingStats } from '@/hooks/training/useTrainingStats';

interface SimplifiedTrainingDashboardProps {
  onStartTraining?: () => Promise<void>;
  onShowConfiguration?: () => void;
}

export const SimplifiedTrainingDashboard: React.FC<SimplifiedTrainingDashboardProps> = ({
  onStartTraining,
  onShowConfiguration
}) => {
  const { metrics, chartData, achievements, isLoading } = useTrainingStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header avec action principale */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Formation
          </h1>
          <p className="text-muted-foreground">
            Suivez votre progression et continuez votre entraînement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={onStartTraining}
            size="lg"
            className="gradient-agent glass-subtle hover-lift ripple-container shadow-glow transform-3d transition-all duration-300 font-semibold text-white border-0 px-8 py-4"
          >
            <Play className="w-4 h-4 mr-2" />
            Nouvel Entraînement
          </Button>
          
          {onShowConfiguration && (
            <Button
              onClick={onShowConfiguration}
              variant="outline"
              size="lg"
              className="glass-subtle hover-lift ripple-container transition-all duration-300 font-semibold px-8 py-4 border-primary/20 hover:border-primary/40 bg-background/50 hover:bg-primary/5"
            >
              <Settings className="w-4 h-4 mr-2" />
              Entraînement Personnalisé
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{metrics.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Score Moyen</p>
                <p className="text-2xl font-bold">{metrics.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Temps Total</p>
                <p className="text-2xl font-bold">{Math.round(((metrics as any).totalTimeMinutes || 0) / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{metrics.streakDays}j</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par domaine */}
      {chartData.domains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Répartition par Domaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.domains.map((domain, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {domain.name.replace('_', ' ')}
                  </span>
                  <Badge variant="secondary">
                    {domain.value} session{domain.value > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements simples */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Succès Récents
            </CardTitle>
            <CardDescription>
              Vos accomplissements dans l'entraînement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.slice(0, 6).map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-3 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <achievement.icon className={`w-4 h-4 ${
                      achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className={`text-sm font-medium ${
                      achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si pas de données */}
      {metrics.totalSessions === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Commencez votre premier entraînement
            </h3>
            <p className="text-muted-foreground mb-4">
              Démarrez dès maintenant pour suivre votre progression
            </p>
            <Button onClick={onStartTraining}>
              <Play className="w-4 h-4 mr-2" />
              Commencer l'Entraînement
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};