import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  RotateCcw,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface SessionState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  trainingType: string;
  startTime: Date | null;
  timeElapsed: number;
  exercisesCompleted: number;
  currentScore: number;
  status: 'idle' | 'active' | 'paused' | 'completed';
}

interface PrepaCdsSessionMgmtProps {
  sessionState: SessionState;
  onStartSession: () => void;
  onPauseSession: () => void;
  onEndSession: () => void;
  onNextStep: () => void;
  onRestartSession: () => void;
}

export function PrepaCdsSessionMgmt({
  sessionState,
  onStartSession,
  onPauseSession,
  onEndSession,
  onNextStep,
  onRestartSession
}: PrepaCdsSessionMgmtProps) {
  const {
    isActive,
    currentStep,
    totalSteps,
    trainingType,
    timeElapsed,
    exercisesCompleted,
    currentScore,
    status
  } = sessionState;

  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const timeElapsedMinutes = Math.floor(timeElapsed / 60);
  const timeElapsedSeconds = timeElapsed % 60;

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Session en cours';
      case 'paused': return 'Session en pause';
      case 'completed': return 'Session terminée';
      default: return 'Prêt à commencer';
    }
  };

  const getTrainingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'analyse_documents': 'Analyse documentaire',
      'questionnaire_droit': 'Questionnaire de droit',
      'management_redaction': 'Management & rédaction',
      'entrainement_mixte': 'Entraînement mixte',
      'evaluation_connaissances': 'Évaluation des connaissances',
      'vrai_faux': 'Vrai ou Faux',
      'evaluation_note_service': 'Note de service'
    };
    return labels[type] || type;
  };

  if (!isActive && status === 'idle') {
    return (
      <Card className="bg-gradient-to-br from-prepacds/5 to-prepacds/10 border-prepacds/20">
        <CardHeader className="text-center">
          <CardTitle className="text-lg text-prepacds">
            Gestion de session
          </CardTitle>
          <CardDescription>
            Aucune session active. Sélectionnez un type d'entraînement pour commencer.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onStartSession} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Démarrer une nouvelle session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-prepacds/5 to-prepacds/10 border-prepacds/20">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-prepacds flex items-center gap-2">
            <Target className="h-5 w-5" />
            Session active
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-prepacds/10 text-prepacds">
            {getTrainingTypeLabel(trainingType)}
          </Badge>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {timeElapsedMinutes}:{timeElapsedSeconds.toString().padStart(2, '0')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progression de la session */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">
              {currentStep} / {totalSteps}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Statistiques en temps réel */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">{exercisesCompleted}</div>
            <div className="text-xs text-muted-foreground">Complétés</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{currentScore.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Score actuel</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-600">{timeElapsedMinutes}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
        </div>

        {/* Contrôles de session */}
        <div className="flex gap-2">
          {status === 'active' && (
            <>
              <Button variant="outline" size="sm" onClick={onPauseSession} className="flex-1">
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button variant="outline" size="sm" onClick={onNextStep} className="flex-1">
                <SkipForward className="h-4 w-4 mr-1" />
                Suivant
              </Button>
            </>
          )}

          {status === 'paused' && (
            <Button onClick={onStartSession} className="flex-1">
              <Play className="h-4 w-4 mr-1" />
              Reprendre
            </Button>
          )}

          {(status === 'active' || status === 'paused') && (
            <Button variant="destructive" size="sm" onClick={onEndSession}>
              <Square className="h-4 w-4 mr-1" />
              Terminer
            </Button>
          )}

          {status === 'completed' && (
            <Button variant="outline" onClick={onRestartSession} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Nouvelle session
            </Button>
          )}
        </div>

        {/* Alertes et conseils */}
        {status === 'active' && currentStep > 0 && (
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {currentScore >= 80 ? (
                    "Excellent niveau ! Maintenez cette qualité de réponses."
                  ) : currentScore >= 60 ? (
                    "Bon travail ! Concentrez-vous sur l'analyse détaillée."
                  ) : (
                    "Prenez le temps de bien réfléchir avant de répondre."
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}