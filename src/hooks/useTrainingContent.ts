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
    averageResponseTime: 0,
    cacheHitRate: 0,
    diversityScore: 0,
    lastContentHash: null
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

    // Timeout de 60 secondes avec fallback automatique (GPT-5 peut prendre du temps)
    const TIMEOUT_MS = 60000;
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Timeout: génération trop longue'));
      }, TIMEOUT_MS);
    });

    try {
      // Course entre la génération et le timeout
      const result = await Promise.race([
        trainingContentService.generateContent(
          trainingType,
          level,
          domain,
          options
        ),
        timeoutPromise
      ]);

      clearTimeout(timeoutId!);

      // 🔍 DEBUG: Logger le contenu reçu de l'API
      console.log('📡 useTrainingContent - Réponse API reçue:', {
        hasResult: !!result,
        source: result.source,
        hasContent: !!result.content,
        contentKeys: result.content ? Object.keys(result.content) : [],
        questionsCount: result.content?.questions?.length || 0,
        fullResult: result
      });

      setState({
        isLoading: false,
        content: result.content,
        error: null,
        source: result.source,
        lastRequestId: requestId
      });

      console.log('✅ useTrainingContent - State mis à jour avec le contenu');

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
      clearTimeout(timeoutId!);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const isTimeout = errorMessage.includes('Timeout');
      
      console.warn(`[useTrainingContent] Erreur (${isTimeout ? 'timeout' : 'autre'}):`, errorMessage);
      
      // Fallback automatique vers le contenu statique si timeout ou erreur
      try {
        console.log(`[useTrainingContent] Fallback vers contenu statique...`);
        
        // Importer le service de contenu statique
        const { contentLoader } = await import('@/services/training/contentLoader');
        const fallbackContent = await contentLoader.generateContent(
          trainingType,
          domain,
          level,
          options
        );

        setState({
          isLoading: false,
          content: fallbackContent,
          error: null,
          source: 'fallback',
          lastRequestId: requestId
        });

        // Toast d'info pour le fallback
        toast.info(
          isTimeout ? 'Génération trop longue, contenu statique utilisé' : 'Contenu statique utilisé',
          {
            description: `${trainingType} • ${level} • ${domain}`,
            duration: 4000
          }
        );

        return fallbackContent;

      } catch (fallbackError) {
        // Si même le fallback échoue, on affiche l'erreur
        console.error('[useTrainingContent] Fallback échoué:', fallbackError);
        
        setState({
          isLoading: false,
          content: null,
          error: errorMessage,
          source: null,
          lastRequestId: requestId
        });

        // Mise à jour des métriques
        setMetrics(trainingContentService.getMetrics());

        // Toast d'erreur finale
        toast.error('Impossible de générer du contenu', {
          description: errorMessage,
          duration: 5000
        });

        throw error;
      }
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
      averageResponseTime: 0,
      cacheHitRate: 0,
      diversityScore: 0,
      lastContentHash: null
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