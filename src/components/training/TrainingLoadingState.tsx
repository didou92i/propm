import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrainingLoadingIndicator } from './TrainingLoadingIndicator';
import { Brain, Clock, Target, X, Zap } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState("Initialisation IA");
  const [progress, setProgress] = useState(0);
  const [subtitle, setSubtitle] = useState("Préparation de votre session d'entraînement");

  useEffect(() => {
    const steps = [
      { name: "Initialisation IA", subtitle: "Préparation de votre session d'entraînement", duration: 2000 },
      { name: "Génération contenu", subtitle: "Création de questions personnalisées", duration: 3000 },
      { name: "Optimisation", subtitle: "Finalisation et vérifications", duration: 1500 }
    ];

    let stepIndex = 0;
    let progressValue = 0;

    const updateProgress = () => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setCurrentStep(step.name);
        setSubtitle(step.subtitle);
        
        const targetProgress = ((stepIndex + 1) / steps.length) * 100;
        const increment = (targetProgress - progressValue) / (step.duration / 100);
        
        const progressTimer = setInterval(() => {
          progressValue += increment;
          setProgress(Math.min(progressValue, targetProgress));
          
          if (progressValue >= targetProgress) {
            clearInterval(progressTimer);
            stepIndex++;
            setTimeout(updateProgress, 200);
          }
        }, 100);
      }
    };

    updateProgress();
  }, []);
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass neomorphism">
        <CardContent className="p-8 text-center space-y-6">
          {/* Enhanced Loading Indicator */}
          <TrainingLoadingIndicator
            step={currentStep}
            progress={progress}
            subtitle={subtitle}
          />

          {/* Training Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="glass">
                {trainingType}
              </Badge>
              <Badge variant="outline" className="glass">
                {level}
              </Badge>
              <Badge variant="outline" className="glass">
                {domain}
              </Badge>
            </div>
          </div>

          {/* Metrics Display */}
          {metrics && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{metrics.averageResponseTime > 0 ? `${metrics.averageResponseTime.toFixed(1)}s` : 'Calcul...'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>Req. #{metrics.requestCount + 1}</span>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full glass hover-lift"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}