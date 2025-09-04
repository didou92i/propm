import React, { useState, useEffect } from 'react';
import { TrainingHeader } from './TrainingHeader';
import { TrainingLoadingState } from './TrainingLoadingState';
import { TrainingErrorState } from './TrainingErrorState';
import { TrainingContentRenderer } from './TrainingContentRenderer';
import { useTrainingContent } from '@/hooks/useTrainingContent';
import { getStaticContent } from '@/data/trainingData';
import { validateTrainingContent, normalizeTrainingContent } from '@/utils/trainingValidation';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import { logger } from '@/utils/logger';

interface SimpleTrainingPlayerProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  onComplete: (score: number, answers: any[]) => void;
  onExit: () => void;
}

export function SimpleTrainingPlayer({
  trainingType,
  level,
  domain,
  onComplete,
  onExit
}: SimpleTrainingPlayerProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionId] = useState(`training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Utilisation du hook refactorisé
  const {
    isLoading,
    content,
    error,
    source,
    generateContent,
    resetState,
    metrics,
    hasContent,
    isFromCache,
    isFromAI,
    isFromFallback
  } = useTrainingContent();

  // Charger le contenu au montage
  useEffect(() => {
    // Production: removed debug logging
    
    const loadContent = async () => {
      try {
        await generateContent(trainingType, level, domain, { sessionId });
        setIsActive(true);
      } catch (error) {
        logger.error('Échec génération primaire', error, 'SimpleTrainingPlayer');
        
        // Fallback vers contenu statique uniquement en cas d'échec complet
        const staticContent = getStaticContent(trainingType, domain, level);
        
        if (staticContent) {
          let formattedContent;
          if (trainingType === 'qcm' || trainingType === 'vrai_faux') {
            formattedContent = { questions: staticContent };
          } else {
            formattedContent = staticContent;
          }
          
          const normalizedContent = normalizeTrainingContent(formattedContent, trainingType);
          const validation = validateTrainingContent(normalizedContent, trainingType);
          
          if (validation.isValid) {
            // On utilise directement les données statiques sans passer par le hook
            setIsActive(true);
          } else {
            logger.error('Fallback statique invalide', validation.errors, 'SimpleTrainingPlayer');
          }
        }
      }
    };

    loadContent();
  }, [trainingType, level, domain, sessionId, generateContent]);

  // Timer pour mesurer le temps d'entraînement
  useEffect(() => {
    if (!isActive || isLoading) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isLoading]);

  const handleComplete = (score: number, answers: any[]) => {
    // Production: removed debug logging
    setIsActive(false);
    onComplete(score, answers);
  };

  const handleExit = () => {
    // Production: removed debug logging
    setIsActive(false);
    resetState();
    onExit();
  };

  const handleRetry = async () => {
    // Production: removed debug logging
    setTimeElapsed(0);
    try {
      await generateContent(trainingType, level, domain, { 
        sessionId: `retry-${Date.now()}`,
        forceRefresh: true 
      });
      setIsActive(true);
    } catch (error) {
      logger.error('Retry failed', error, 'SimpleTrainingPlayer');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <TrainingLoadingState
        trainingType={trainingType}
        level={level}
        domain={domain}
        metrics={metrics}
        onCancel={handleExit}
      />
    );
  }

  if (error && !hasContent) {
    return (
      <TrainingErrorState
        trainingType={trainingType}
        level={level}
        domain={domain}
        error={error}
        metrics={metrics}
        onRetry={handleRetry}
        onExit={handleExit}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      <TrainingHeader
        trainingType={trainingType}
        level={level}
        domain={domain}
        source={source}
        timeElapsed={timeElapsed}
        isActive={isActive}
        averageResponseTime={metrics.averageResponseTime}
        onExit={handleExit}
      />

      <div className="pt-20 h-full overflow-auto">
        <TrainingContentRenderer
          trainingType={trainingType}
          level={level}
          domain={domain}
          content={content}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </div>
    </div>
  );
}