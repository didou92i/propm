import { useAuth } from '@/hooks/useAuth';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { TrainingToastManager } from "@/components/training/TrainingToastManager";
import { toast } from 'sonner';
import type { TrainingConfig } from '@/types/training';

/**
 * Hook pour gérer les actions utilisateur dans le système de formation
 * Responsabilité : Actions métier (démarrer, terminer, quitter)
 */
export const useTrainingActions = () => {
  const { user, signOut } = useAuth();
  const { 
    createSession, 
    completeSession, 
    currentSessionId, 
    refreshSessionData 
  } = useTrainingSession();

  const handleStartTraining = async (
    configuration: TrainingConfig,
    sessionStartTime: number,
    onStart: () => void,
    onStarting: (loading: boolean) => void
  ) => {
    onStarting(true);
    try {
      const sessionId = await createSession(
        configuration.trainingType, 
        configuration.level, 
        configuration.domain
      );
      if (sessionId) {
        onStart();
        TrainingToastManager.sessionStarted(
          configuration.trainingType, 
          configuration.level, 
          configuration.domain
        );
      }
    } catch (error) {
      TrainingToastManager.error(
        'Erreur lors du démarrage', 
        'Veuillez réessayer dans quelques instants'
      );
    } finally {
      onStarting(false);
    }
  };

  const handleTrainingComplete = async (
    score: number, 
    answers: any[],
    sessionStartTime: number,
    onComplete: () => void
  ) => {
    if (currentSessionId) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const success = await completeSession(currentSessionId, duration, score, answers);
      
      if (success) {
        await refreshSessionData();
        TrainingToastManager.sessionCompleted(score, duration);
      }
    }
    onComplete();
  };

  const handleTrainingExit = (onExit: () => void) => {
    onExit();
    TrainingToastManager.sessionInterrupted();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return {
    user,
    currentSessionId,
    handleStartTraining,
    handleTrainingComplete,
    handleTrainingExit,
    handleSignOut
  };
};