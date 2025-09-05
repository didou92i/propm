import { useCallback } from 'react';
import { useTrainingFlow } from './useTrainingFlow';
import { useTrainingActions } from './useTrainingActions';
import { useTrainingStats } from './useTrainingStats';
import type { TrainingConfig } from '@/types/training';

/**
 * Hook principal optimisé pour gérer l'ensemble du système de formation
 * Composition des hooks spécialisés avec optimisations de performance
 */
export const useOptimizedTrainingManager = (initialConfig: TrainingConfig) => {
  // Hooks spécialisés
  const {
    state,
    configuration,
    setConfiguration,
    startTrainingSession,
    endTrainingSession,
    showConfiguration,
    hideConfiguration,
    setStarting,
    isLoading: flowLoading
  } = useTrainingFlow(initialConfig);

  const {
    user,
    currentSessionId,
    handleStartTraining: actionStartTraining,
    handleTrainingComplete: actionTrainingComplete,
    handleTrainingExit: actionTrainingExit,
    handleSignOut
  } = useTrainingActions();

  const {
    sessionData,
    isEmpty,
    metrics,
    chartData,
    achievements,
    progressMetrics,
    isLoading: statsLoading,
    refreshSessionData
  } = useTrainingStats();

  // Actions optimisées avec useCallback
  const handleStartTraining = useCallback(async () => {
    await actionStartTraining(
      configuration,
      state.sessionStartTime,
      startTrainingSession,
      setStarting
    );
  }, [configuration, state.sessionStartTime, actionStartTraining, startTrainingSession, setStarting]);

  const handleTrainingComplete = useCallback(async (score: number, answers: any[]) => {
    await actionTrainingComplete(
      score,
      answers,
      state.sessionStartTime,
      endTrainingSession
    );
  }, [state.sessionStartTime, actionTrainingComplete, endTrainingSession]);

  const handleTrainingExit = useCallback(() => {
    actionTrainingExit(endTrainingSession);
  }, [actionTrainingExit, endTrainingSession]);

  const handleShowConfiguration = useCallback(() => {
    showConfiguration();
  }, [showConfiguration]);

  const handleConfigurationBack = useCallback(() => {
    hideConfiguration();
  }, [hideConfiguration]);

  // État agrégé
  const aggregatedState = {
    ...state,
    isEmpty,
    hasData: !isEmpty,
    isLoading: flowLoading || statsLoading
  };

  return {
    // État
    state: aggregatedState,
    configuration,
    user,
    currentSessionId,
    
    // Données enrichies
    sessionData,
    metrics,
    chartData,
    achievements,
    progressMetrics,
    
    // Actions optimisées
    setConfiguration,
    handleStartTraining,
    handleTrainingComplete,
    handleTrainingExit,
    handleShowConfiguration,
    handleConfigurationBack,
    handleSignOut,
    refreshSessionData,
    
    // Utilitaires
    isLoading: aggregatedState.isLoading
  };
};