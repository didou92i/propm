import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TrainingType, UserLevel, StudyDomain } from "@/types/prepacds";

interface GenerationState {
  isLoading: boolean;
  content: any | null;
  error: string | null;
  source: 'ai' | 'cache' | 'fallback' | null;
  lastRequestId: string | null;
}

interface GenerationMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  lastRequest: number;
  averageResponseTime: number;
}

export const useTrainingContentGenerator = () => {
  const [state, setState] = useState<GenerationState>({
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

  // Fonction de génération avec gestion d'état propre
  const generateContent = useCallback(async (
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain,
    options: {
      forceRefresh?: boolean;
      sessionId?: string;
      timeout?: number;
    } = {}
  ): Promise<any> => {
    const startTime = Date.now();
    const requestId = options.sessionId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[CONTENT_GEN] Début génération:`, {
      trainingType,
      level,
      domain,
      requestId,
      forceRefresh: options.forceRefresh
    });

    // Reset de l'état
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastRequestId: requestId
    }));

    // Mise à jour des métriques
    setMetrics(prev => ({
      ...prev,
      requestCount: prev.requestCount + 1,
      lastRequest: startTime
    }));

    try {
      // Validation des paramètres
      if (!trainingType || !level || !domain) {
        throw new Error('Paramètres de génération manquants');
      }

      // Appel à la nouvelle edge function dédiée
      const { data, error } = await supabase.functions.invoke('generate-training-content', {
        body: {
          trainingType,
          level,
          domain,
          sessionId: requestId,
          options: {
            forceRefresh: options.forceRefresh || false
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la génération');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Réponse invalide du serveur');
      }

      const content = data.content;
      const source = content?.sessionInfo?.source || 'ai';
      
      console.log(`[CONTENT_GEN] Succès:`, {
        requestId,
        source,
        contentKeys: Object.keys(content || {}),
        hasQuestions: !!(content?.questions),
        hasSteps: !!(content?.steps)
      });

      // Validation du contenu généré
      if (!content || Object.keys(content).length === 0) {
        throw new Error('Contenu généré vide');
      }

      // Validation spécifique par type
      if (trainingType === 'qcm' && (!content.questions || content.questions.length === 0)) {
        throw new Error('Questions QCM manquantes dans le contenu généré');
      }

      if (trainingType === 'vrai_faux' && (!content.questions || content.questions.length === 0)) {
        throw new Error('Questions Vrai/Faux manquantes dans le contenu généré');
      }

      if (trainingType === 'cas_pratique' && (!content.steps || content.steps.length === 0)) {
        throw new Error('Étapes cas pratique manquantes dans le contenu généré');
      }

      const responseTime = Date.now() - startTime;

      // Mise à jour de l'état avec succès
      setState({
        isLoading: false,
        content,
        error: null,
        source: source as 'ai' | 'cache' | 'fallback',
        lastRequestId: requestId
      });

      // Mise à jour des métriques
      setMetrics(prev => ({
        ...prev,
        successCount: prev.successCount + 1,
        averageResponseTime: prev.requestCount === 1 
          ? responseTime 
          : (prev.averageResponseTime * (prev.requestCount - 1) + responseTime) / prev.requestCount
      }));

      // Toast de succès avec info sur la source
      const sourceText = source === 'cache' ? 'depuis le cache' : 
                         source === 'ai' ? 'par l\'IA' : 'en mode hors ligne';
      toast.success(`Contenu généré ${sourceText}`, {
        description: `${trainingType} • ${level} • ${domain}`,
        duration: 3000
      });

      return content;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      console.error(`[CONTENT_GEN] Erreur:`, {
        requestId,
        error: errorMessage,
        responseTime,
        trainingType,
        level,
        domain
      });

      // Mise à jour de l'état avec erreur
      setState({
        isLoading: false,
        content: null,
        error: errorMessage,
        source: null,
        lastRequestId: requestId
      });

      // Mise à jour des métriques
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));

      // Toast d'erreur
      toast.error('Erreur de génération', {
        description: errorMessage,
        duration: 5000
      });

      throw error;
    }
  }, []);

  // Fonction pour réinitialiser l'état
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      content: null,
      error: null,
      source: null,
      lastRequestId: null
    });
  }, []);

  // Fonction pour vérifier si une génération est en cours
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