// Hook principal simplifié (NOUVELLE ARCHITECTURE)
export { useTrainingPage } from '../useTrainingPage';

// Hooks optimisés (legacy mais toujours utilisés)
export { useOptimizedTrainingManager } from './useOptimizedTrainingManager';
export { useTrainingFlow } from './useTrainingFlow';
export { useTrainingActions } from './useTrainingActions';
export { useTrainingStats } from './useTrainingStats';

// Hooks de configuration
export { useTrainingConfiguration } from './useTrainingConfiguration';

// Hook legacy (deprecated, utilisez useOptimizedTrainingManager)
export { useTrainingManager } from './useTrainingManager';