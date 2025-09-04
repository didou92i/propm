import { useState } from 'react';
import { DEFAULT_TRAINING_CONFIG } from '@/config/training';
import type { TrainingConfig } from '@/types/training';

export const useTrainingConfiguration = (initialConfig?: Partial<TrainingConfig>) => {
  const [configuration, setConfiguration] = useState<TrainingConfig>({
    ...DEFAULT_TRAINING_CONFIG,
    ...initialConfig
  });

  const updateConfiguration = (updates: Partial<TrainingConfig>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  };

  const resetConfiguration = () => {
    setConfiguration(DEFAULT_TRAINING_CONFIG);
  };

  return {
    configuration,
    setConfiguration,
    updateConfiguration,
    resetConfiguration
  };
};