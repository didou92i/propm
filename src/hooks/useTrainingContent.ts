import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { trainingContentService, type ContentGenerationOptions, type GenerationMetrics } from '@/services/training/trainingContentService';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface TrainingContentState {
  isLoading: boolean;
  content: any | null;
  error: string | null;
  source: 'ai' | 'cache' | 'fallback' | null;
  lastRequestId: string | null;
}

export const useTrainingContent = () => {
  const [state, setState] = useState<TrainingContentState>({
    isLoading: false,
    content: null,
    error: null,
    source: null,
    lastRequestId: null
  });

  const [metrics, setMetrics] = useState<GenerationMetrics>({
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    lastRequest: 0,
    averageResponseTime: 0
  });

  const generateContent = useCallback(async (
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain,
    options: ContentGenerationOptions = {}
  ): Promise<any> => {
    const requestId = options.sessionId || `req-${Date.now()}`;
    
    console.log(`[useTrainingContent] Génération démarrée:`, {
      trainingType,
      level,
      domain,
      requestId
    });

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastRequestId: requestId
    }));

    try {
      const result = await trainingContentService.generateContent(
        trainingType,
        level,
        domain,
        options
      );

      setState({
        isLoading: false,
        content: result.content,
        error: null,
        source: result.source,
        lastRequestId: requestId
      });

      // Mise à jour des métriques depuis le service
      setMetrics(trainingContentService.getMetrics());

      // Toast de succès avec info sur la source
      const sourceText = result.source === 'cache' ? 'depuis le cache' : 
                         result.source === 'ai' ? 'par l\'IA' : 'en mode hors ligne';
      toast.success(`Contenu généré ${sourceText}`, {
        description: `${trainingType} • ${level} • ${domain}`,
        duration: 3000
      });

      return result.content;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      setState({
        isLoading: false,
        content: null,
        error: errorMessage,
        source: null,
        lastRequestId: requestId
      });

      // Mise à jour des métriques
      setMetrics(trainingContentService.getMetrics());

      // Toast d'erreur
      toast.error('Erreur de génération', {
        description: errorMessage,
        duration: 5000
      });

      throw error;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      content: null,
      error: null,
      source: null,
      lastRequestId: null
    });
    
    // Reset des métriques du service
    trainingContentService.resetMetrics();
    setMetrics({
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      lastRequest: 0,
      averageResponseTime: 0
    });
  }, []);

  const isGenerating = useCallback((requestId?: string) => {
    if (!requestId) return state.isLoading;
    return state.isLoading && state.lastRequestId === requestId;
  }, [state.isLoading, state.lastRequestId]);

  return {
    // État
    ...state,
    
    // Actions
    generateContent,
    resetState,
    isGenerating,
    
    // Métriques
    metrics,
    
    // Utilitaires
    hasContent: !!state.content,
    isFromCache: state.source === 'cache',
    isFromAI: state.source === 'ai',
    isFromFallback: state.source === 'fallback'
  };
};