import React, { lazy, Suspense } from 'react';
import { TrainingLoadingState } from './TrainingLoadingState';

// Lazy loading du TrainingDashboard
const TrainingDashboard = lazy(() => 
  import('./organisms/TrainingDashboard').then(module => ({ 
    default: module.TrainingDashboard 
  }))
);

interface LazyTrainingDashboardProps {
  sessionData: any;
  onStartTraining?: () => Promise<void>;
  isEmpty?: boolean;
}

/**
 * Version lazy-loaded du TrainingDashboard avec fallback optimisé
 */
export const LazyTrainingDashboard: React.FC<LazyTrainingDashboardProps> = (props) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    }>
      <TrainingDashboard {...props} />
    </Suspense>
  );
};