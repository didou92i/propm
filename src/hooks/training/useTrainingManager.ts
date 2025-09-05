import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { TrainingToastManager } from "@/components/training/TrainingToastManager";
import { toast } from 'sonner';
import type { TrainingConfig, TrainingState } from '@/types/training';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export const useTrainingManager = (initialConfig: TrainingConfig) => {
  const [state, setState] = useState<TrainingState>({
    isTrainingActive: false,
    showConfiguration: false,
    sessionStartTime: 0,
    isStarting: false
  });

  const [configuration, setConfiguration] = useState<TrainingConfig>(initialConfig);

  const { user, signOut } = useAuth();
  const { 
    createSession, 
    completeSession, 
    currentSessionId, 
    isLoading: sessionLoading,
    sessionData,
    isEmpty,
    refreshSessionData 
  } = useTrainingSession();

  const handleStartTraining = async () => {
    setState(prev => ({ ...prev, isStarting: true }));
    try {
      const sessionId = await createSession(
        configuration.trainingType, 
        configuration.level, 
        configuration.domain
      );
      if (sessionId) {
        setState(prev => ({ 
          ...prev, 
          sessionStartTime: Date.now(),
          isTrainingActive: true 
        }));
        TrainingToastManager.sessionStarted(
          configuration.trainingType, 
          configuration.level, 
          configuration.domain
        );
      }
    } catch (error) {
      TrainingToastManager.error('Erreur lors du démarrage', 'Veuillez réessayer dans quelques instants');
    } finally {
      setState(prev => ({ ...prev, isStarting: false }));
    }
  };

  const handleTrainingComplete = async (score: number, answers: any[]) => {
    if (currentSessionId) {
      const duration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
      const success = await completeSession(currentSessionId, duration, score, answers);
      
      if (success) {
        await refreshSessionData();
        TrainingToastManager.sessionCompleted(score, duration);
      }
    }
    setState(prev => ({ ...prev, isTrainingActive: false }));
  };

  const handleTrainingExit = () => {
    setState(prev => ({ ...prev, isTrainingActive: false }));
    TrainingToastManager.sessionInterrupted();
  };

  const handleShowConfiguration = () => {
    setState(prev => ({ ...prev, showConfiguration: true }));
  };

  const handleConfigurationBack = () => {
    setState(prev => ({ ...prev, showConfiguration: false }));
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
    // État
    state,
    configuration,
    user,
    currentSessionId,
    sessionLoading,
    sessionData,
    isEmpty,
    
    // Actions
    setConfiguration,
    handleStartTraining,
    handleTrainingComplete,
    handleTrainingExit,
    handleShowConfiguration,
    handleConfigurationBack,
    handleSignOut,
    
    // Utilitaires
    isLoading: state.isStarting || sessionLoading
  };
};