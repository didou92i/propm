import { supabase } from "@/integrations/supabase/client";
import type { TrainingType, UserLevel, StudyDomain } from "@/types/prepacds";
import { ContentFallbackService } from './contentFallback';

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
  cacheHitRate: number;
  diversityScore: number;
  lastContentHash: string | null;
}

class TrainingContentService {
  private static instance: TrainingContentService;
  private metrics: GenerationMetrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    lastRequest: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    diversityScore: 0,
    lastContentHash: null
  };
  
  private contentHistory: string[] = [];

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
      
      // Calcul de la diversité du contenu
      const contentHash = this.calculateContentHash(content);
      const diversityScore = this.calculateDiversityScore(contentHash);
      
      // Mise à jour des métriques de succès
      this.metrics.successCount++;
      this.metrics.diversityScore = diversityScore;
      this.metrics.lastContentHash = contentHash;
      this.updateAverageResponseTime(responseTime);
      
      // Mise à jour du taux de hit cache
      this.metrics.cacheHitRate = source === 'cache' ? 
        (this.metrics.cacheHitRate * (this.metrics.requestCount - 1) + 1) / this.metrics.requestCount :
        (this.metrics.cacheHitRate * (this.metrics.requestCount - 1)) / this.metrics.requestCount;

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

      // Utiliser le fallback en cas d'erreur
      console.log('[FALLBACK] Utilisation du contenu de secours');
      const fallbackContent = ContentFallbackService.generateFallbackContent(
        trainingType, 
        level, 
        domain
      );
      
      const enhancedFallback = ContentFallbackService.enhanceFallbackContent(
        fallbackContent, 
        sessionId
      );
      
      return {
        content: enhancedFallback,
        source: 'fallback' as const,
        sessionId,
        timestamp: Date.now()
      };
    }
  }

  private validateParameters(trainingType: TrainingType, level: UserLevel, domain: StudyDomain): void {
    if (!trainingType || !level || !domain) {
      throw new Error('Paramètres de génération manquants');
    }

    const supportedTypes: TrainingType[] = ['qcm', 'vrai_faux', 'cas_pratique', 'question_ouverte'];
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
      case 'question_ouverte':
        if (!content.questions || content.questions.length === 0) {
          throw new Error('Questions ouvertes manquantes dans le contenu généré');
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
      averageResponseTime: 0,
      cacheHitRate: 0,
      diversityScore: 0,
      lastContentHash: null
    };
    this.contentHistory = [];
  }
  
  private calculateContentHash(content: any): string {
    // Calcul simple d'un hash basé sur le contenu principal
    const contentStr = JSON.stringify(content?.questions || content?.steps || content);
    let hash = 0;
    for (let i = 0; i < contentStr.length; i++) {
      const char = contentStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  }
  
  private calculateDiversityScore(contentHash: string): number {
    // Ajouter le hash à l'historique
    this.contentHistory.push(contentHash);
    
    // Garder seulement les 10 derniers contenus
    if (this.contentHistory.length > 10) {
      this.contentHistory.shift();
    }
    
    // Calculer le score de diversité (pourcentage de contenus uniques)
    const uniqueHashes = new Set(this.contentHistory);
    return (uniqueHashes.size / this.contentHistory.length) * 100;
  }
}

export const trainingContentService = TrainingContentService.getInstance();