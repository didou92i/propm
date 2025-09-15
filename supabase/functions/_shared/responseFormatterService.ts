/**
 * Service de formatage standardisé pour les réponses
 */

export interface ResponseMeta {
  status: 'OK' | 'ERROR' | 'WARNING';
  timestamp: string;
  serverSessionId?: string;
  clientSessionId?: string;
  responseTime?: number;
  [key: string]: any;
}

export interface StandardResponse<T = any> {
  success: boolean;
  content?: T;
  error?: string;
  details?: string;
  meta: ResponseMeta;
}

export class ResponseFormatterService {
  /**
   * Formater une réponse de succès
   */
  static success<T>(
    content: T,
    meta: Partial<ResponseMeta> = {}
  ): StandardResponse<T> {
    return {
      success: true,
      content,
      meta: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  /**
   * Formater une réponse d'erreur
   */
  static error(
    error: string,
    details?: string,
    meta: Partial<ResponseMeta> = {}
  ): StandardResponse {
    return {
      success: false,
      error,
      ...(details && { details }),
      meta: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  /**
   * Formater une réponse d'avertissement
   */
  static warning<T>(
    content: T,
    warning: string,
    meta: Partial<ResponseMeta> = {}
  ): StandardResponse<T> {
    return {
      success: true,
      content,
      error: warning,
      meta: {
        status: 'WARNING',
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  /**
   * Créer une Response HTTP standardisée
   */
  static createHttpResponse(
    data: StandardResponse,
    status: number = 200,
    corsHeaders: Record<string, string> = {}
  ): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Gérer les erreurs et créer une réponse appropriée
   */
  static handleError(
    error: Error | any,
    corsHeaders: Record<string, string> = {},
    sessionId?: string
  ): Response {
    console.error('Service error:', error);
    
    const errorResponse = this.error(
      error.message || 'Une erreur inattendue est survenue',
      error.stack || 'Pas de stack trace disponible',
      {
        errorType: error.constructor.name,
        ...(sessionId && { serverSessionId: sessionId })
      }
    );

    return this.createHttpResponse(errorResponse, 200, corsHeaders);
  }

  /**
   * Valider et formater les paramètres de requête
   */
  static validateRequest(
    requestData: any,
    requiredFields: string[]
  ): { isValid: boolean; error?: string; data?: any } {
    const missing = requiredFields.filter(field => !requestData[field]);
    
    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Paramètres manquants: ${missing.join(', ')}`
      };
    }

    return {
      isValid: true,
      data: requestData
    };
  }

  /**
   * Ajouter des métadonnées de performance
   */
  static addPerformanceMetrics(
    response: StandardResponse,
    startTime: number,
    additionalMetrics: Record<string, any> = {}
  ): StandardResponse {
    const responseTime = Date.now() - startTime;
    
    return {
      ...response,
      meta: {
        ...response.meta,
        responseTime,
        performance: {
          responseTimeMs: responseTime,
          ...additionalMetrics
        }
      }
    };
  }

  /**
   * Créer un contenu de fallback pour les erreurs
   */
  static createFallbackContent(
    trainingType: string,
    level: string,
    domain: string,
    sessionId: string
  ): any {
    const fallbackContent = {
      questions: [{
        id: 'fallback-error',
        question: 'Cette question de démonstration apparaît en cas d\'erreur technique.',
        options: ['Réessayer', 'Continuer', 'Quitter', 'Support'],
        correctAnswer: 0,
        explanation: 'Le système a généré un contenu de démonstration suite à une erreur technique.',
        difficulty: level
      }],
      sessionInfo: {
        id: sessionId,
        trainingType,
        level,
        domain,
        createdAt: new Date().toISOString(),
        estimatedDuration: 5,
        isErrorFallback: true
      }
    };

    return this.warning(
      fallbackContent,
      'Contenu de fallback généré suite à une erreur technique',
      {
        status: 'WARNING',
        fallbackReason: 'technical_error',
        originalSessionId: sessionId
      }
    );
  }

  /**
   * Nettoyer le contenu JSON de OpenAI
   */
  static cleanOpenAIResponse(content: string): string {
    let cleanContent = content.trim();
    
    // Supprimer les blocs de code markdown si présents
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Chercher le premier { et le dernier } pour extraire le JSON
    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
    }
    
    return cleanContent;
  }

  /**
   * Valider et parser le JSON de manière sécurisée
   */
  static safeParseJSON(content: string): { success: boolean; data?: any; error?: string } {
    try {
      const cleanedContent = this.cleanOpenAIResponse(content);
      const parsed = JSON.parse(cleanedContent);
      return { success: true, data: parsed };
    } catch (error) {
      return { 
        success: false, 
        error: `JSON parsing failed: ${error.message}`,
        data: null
      };
    }
  }
}