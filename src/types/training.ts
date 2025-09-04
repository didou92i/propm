import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export interface TrainingSession {
  id: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  content?: any;
  isActive: boolean;
  progress: number;
  score?: number;
}

export interface TrainingConfig {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
}

export interface TrainingHandlers {
  onStartTraining: () => Promise<void>;
  onTrainingComplete: (score: number, answers: any[]) => Promise<void>;
  onTrainingExit: () => void;
  onShowConfiguration: () => void;
  onConfigurationBack: () => void;
}

export interface TrainingState {
  isTrainingActive: boolean;
  showConfiguration: boolean;
  sessionStartTime: number;
  isStarting: boolean;
}