import { useState } from 'react';
import type { TrainingConfig, TrainingState } from '@/types/training';

/**
 * Hook pour gérer les états et la navigation du système de formation
 * Responsabilité : Gestion des états UI et flux de navigation
 */
export const useTrainingFlow = (initialConfig: TrainingConfig) => {
  const [state, setState] = useState<TrainingState>({
    isTrainingActive: false,
    showConfiguration: false,
    sessionStartTime: 0,
    isStarting: false
  });

  const [configuration, setConfiguration] = useState<TrainingConfig>(initialConfig);

  const startTrainingSession = () => {
    setState(prev => ({ 
      ...prev, 
      sessionStartTime: Date.now(),
      isTrainingActive: true 
    }));
  };

  const endTrainingSession = () => {
    setState(prev => ({ ...prev, isTrainingActive: false }));
  };

  const showConfiguration = () => {
    setState(prev => ({ ...prev, showConfiguration: true }));
  };

  const hideConfiguration = () => {
    setState(prev => ({ ...prev, showConfiguration: false }));
  };

  const setStarting = (isStarting: boolean) => {
    setState(prev => ({ ...prev, isStarting }));
  };

  return {
    // État
    state,
    configuration,
    
    // Setters
    setConfiguration,
    
    // Actions de navigation
    startTrainingSession,
    endTrainingSession,
    showConfiguration,
    hideConfiguration,
    setStarting,
    
    // Computed
    isLoading: state.isStarting
  };
};