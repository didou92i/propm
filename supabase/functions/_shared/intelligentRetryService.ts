/**
 * Service de retry intelligent pour les Edge Functions
 * Classification d'erreurs et stratégies de retry adaptées
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

export type ErrorType = 'TEMPORARY' | 'PERMANENT' | 'RATE_LIMIT' | 'UNKNOWN';

class IntelligentRetryService {
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  };

  /**
   * Exécuter avec retry intelligent basé sur le type d'erreur
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: string
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        const duration = Date.now() - startTime;
        
        if (attempt > 1) {
          console.log(`[RETRY-SUCCESS] ${context || 'Operation'} succeeded on attempt ${attempt}`, {
            totalDuration: `${duration}ms`,
            attempts: attempt
          });
        }
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration: duration
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorType = this.classifyError(lastError);
        
        console.log(`[RETRY-ATTEMPT] ${context || 'Operation'} failed on attempt ${attempt}`, {
          error: lastError.message,
          errorType,
          willRetry: attempt <= finalConfig.maxRetries && this.shouldRetry(errorType)
        });

        // Ne pas retry sur les erreurs permanentes
        if (!this.shouldRetry(errorType)) {
          console.log(`[RETRY-ABORT] ${context || 'Operation'} aborted due to ${errorType} error`);
          break;
        }

        // Pas de retry sur la dernière tentative
        if (attempt > finalConfig.maxRetries) {
          break;
        }

        // Calculer le délai avant le prochain retry
        const delay = this.calculateDelay(attempt, finalConfig, errorType);
        await this.sleep(delay);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.error(`[RETRY-FAILED] ${context || 'Operation'} failed after ${finalConfig.maxRetries + 1} attempts`, {
      totalDuration: `${totalDuration}ms`,
      finalError: lastError.message
    });

    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxRetries + 1,
      totalDuration
    };
  }

  /**
   * Classifier le type d'erreur pour adapter la stratégie de retry
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    // Erreurs de rate limiting
    if (message.includes('rate limit') || message.includes('429') || message.includes('quota')) {
      return 'RATE_LIMIT';
    }
    
    // Erreurs temporaires
    if (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    ) {
      return 'TEMPORARY';
    }
    
    // Erreurs permanentes
    if (
      message.includes('400') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('404') ||
      message.includes('invalid') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('not found')
    ) {
      return 'PERMANENT';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Déterminer si un retry doit être tenté
   */
  private shouldRetry(errorType: ErrorType): boolean {
    switch (errorType) {
      case 'TEMPORARY':
      case 'RATE_LIMIT':
      case 'UNKNOWN':
        return true;
      case 'PERMANENT':
        return false;
      default:
        return false;
    }
  }

  /**
   * Calculer le délai avant le prochain retry
   */
  private calculateDelay(attempt: number, config: RetryConfig, errorType: ErrorType): number {
    let baseDelay = config.baseDelay;
    
    // Délai plus long pour rate limiting
    if (errorType === 'RATE_LIMIT') {
      baseDelay = Math.max(baseDelay, 5000); // Minimum 5s pour rate limit
    }
    
    // Backoff exponentiel
    const exponentialDelay = baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    let delay = Math.min(exponentialDelay, config.maxDelay);
    
    // Ajouter du jitter pour éviter les pics de charge
    if (config.jitter) {
      const jitterAmount = delay * 0.1;
      delay += (Math.random() * 2 - 1) * jitterAmount;
    }
    
    return Math.max(delay, 100); // Minimum 100ms
  }

  /**
   * Wrapper pour les opérations OpenAI
   */
  async retryOpenAIOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = {
      maxRetries: 2, // Plus conservateur pour OpenAI
      baseDelay: 2000,
      maxDelay: 15000,
      ...customConfig
    };

    const result = await this.executeWithRetry(
      operation,
      config,
      `OpenAI-${operationName}`
    );

    if (!result.success) {
      throw result.error || new Error(`Failed after ${result.attempts} attempts`);
    }

    return result.result!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const intelligentRetryService = new IntelligentRetryService();