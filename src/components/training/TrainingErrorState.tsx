import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import type { GenerationMetrics } from '@/services/training/trainingContentService';

interface TrainingErrorStateProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  error: string;
  metrics: GenerationMetrics;
  onRetry: () => void;
  onExit: () => void;
}

export function TrainingErrorState({
  trainingType,
  level,
  domain,
  error,
  metrics,
  onRetry,
  onExit
}: TrainingErrorStateProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 max-w-md p-6"
      >
        <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Erreur de génération</h3>
          <p className="text-muted-foreground text-sm">
            {error}
          </p>
          <div className="text-xs text-muted-foreground">
            Configuration: {trainingType} • {level} • {domain}
          </div>
          {metrics.requestCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Tentatives: {metrics.requestCount} | Erreurs: {metrics.errorCount}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
          <Button onClick={onExit} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </motion.div>
    </div>
  );
}