import { supabase } from "@/integrations/supabase/client";
import type { TrainingType, UserLevel, StudyDomain } from "@/types/prepacds";

export interface ContentGenerationOptions {
  forceRefresh?: boolean;
  sessionId?: string;
  timeout?: number;
}

export interface ContentGenerationResult {
  content: any;
  source: 'ai' | 'cache' | 'fallback';
  sessionId: string;
  timestamp: number;
}

export interface GenerationMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  lastRequest: number;
  averageResponseTime: number;
}

class TrainingContentService {
  private static instance: TrainingContentService;
  private metrics: GenerationMetrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    lastRequest: 0,
    averageResponseTime: 0
  };

  static getInstance(): TrainingContentService {
    if (!TrainingContentService.instance) {
      TrainingContentService.instance = new TrainingContentService();
    }
    return TrainingContentService.instance;
  }

  async generateContent(
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain,
    options: ContentGenerationOptions = {}
  ): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const sessionId = options.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[TrainingService] Génération démarrée:`, {
      trainingType,
      level,
      domain,
      sessionId,
      forceRefresh: options.forceRefresh
    });

    // Mise à jour des métriques
    this.metrics.requestCount++;
    this.metrics.lastRequest = startTime;

    try {
      // Validation des paramètres
      this.validateParameters(trainingType, level, domain);

      // Appel à l'edge function
      const { data, error } = await supabase.functions.invoke('generate-training-content', {
        body: {
          trainingType,
          level,
          domain,
          sessionId,
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
      const responseTime = Date.now() - startTime;

      // Validation du contenu
      this.validateContent(content, trainingType);

      // Mise à jour des métriques de succès
      this.metrics.successCount++;
      this.updateAverageResponseTime(responseTime);

      console.log(`[TrainingService] Génération réussie:`, {
        sessionId,
        source,
        responseTime,
        contentKeys: Object.keys(content || {})
      });

      return {
        content,
        source: source as 'ai' | 'cache' | 'fallback',
        sessionId,
        timestamp: Date.now()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.metrics.errorCount++;
      
      console.error(`[TrainingService] Erreur de génération:`, {
        sessionId,
        error: errorMessage,
        responseTime
      });

      throw new Error(errorMessage);
    }
  }

  private validateParameters(trainingType: TrainingType, level: UserLevel, domain: StudyDomain): void {
    if (!trainingType || !level || !domain) {
      throw new Error('Paramètres de génération manquants');
    }

    const supportedTypes: TrainingType[] = ['qcm', 'vrai_faux', 'cas_pratique'];
    if (!supportedTypes.includes(trainingType)) {
      throw new Error(`Type d'entraînement non supporté: ${trainingType}`);
    }
  }

  private validateContent(content: any, trainingType: TrainingType): void {
    if (!content || Object.keys(content).length === 0) {
      throw new Error('Contenu généré vide');
    }

    switch (trainingType) {
      case 'qcm':
      case 'vrai_faux':
        if (!content.questions || content.questions.length === 0) {
          throw new Error(`Questions ${trainingType} manquantes dans le contenu généré`);
        }
        break;
      case 'cas_pratique':
        if (!content.steps || content.steps.length === 0) {
          throw new Error('Étapes cas pratique manquantes dans le contenu généré');
        }
        break;
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    if (this.metrics.requestCount === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + responseTime) / this.metrics.requestCount;
    }
  }

  getMetrics(): GenerationMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      lastRequest: 0,
      averageResponseTime: 0
    };
  }
}

export const trainingContentService = TrainingContentService.getInstance();