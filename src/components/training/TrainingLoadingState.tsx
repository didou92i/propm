import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import type { GenerationMetrics } from '@/services/training/trainingContentService';

interface TrainingLoadingStateProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  metrics: GenerationMetrics;
  onCancel: () => void;
}

export function TrainingLoadingState({
  trainingType,
  level,
  domain,
  metrics,
  onCancel
}: TrainingLoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 max-w-md p-6"
      >
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <Bot className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
            <Bot className="w-5 h-5 text-primary" />
            Génération de contenu PrepaCDS
          </h3>
          <p className="text-muted-foreground">
            {trainingType} • {level} • {domain}
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Connexion à l'assistant spécialisé...</div>
            {metrics.requestCount > 0 && (
              <div className="flex justify-center gap-4">
                <span>Requêtes: {metrics.requestCount}</span>
                <span>Succès: {metrics.successCount}</span>
                {metrics.errorCount > 0 && (
                  <span className="text-destructive">Erreurs: {metrics.errorCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Button onClick={onCancel} variant="outline" size="sm">
          Annuler
        </Button>
      </motion.div>
    </div>
  );
}