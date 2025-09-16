/**
 * Service Circuit Breaker pour les appels OpenAI
 * Prévient les cascades d'échecs et offre des fallbacks
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

export interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

class CircuitBreakerService {
  private circuits = new Map<string, CircuitBreakerState>();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 secondes
    monitoringWindow: 60000  // 1 minute
  };

  /**
   * Exécuter une opération avec protection circuit breaker
   */
  async executeWithBreaker<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const state = this.getCircuitState(circuitName);

    // Vérifier l'état du circuit
    if (state.status === 'OPEN') {
      if (Date.now() < state.nextAttemptTime) {
        console.log(`[CIRCUIT-BREAKER] ${circuitName}: Circuit OPEN, using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${circuitName}`);
      } else {
        // Passer en HALF_OPEN pour tester
        this.updateCircuitState(circuitName, {
          ...state,
          status: 'HALF_OPEN'
        });
      }
    }

    try {
      const result = await operation();
      
      // Success - réinitialiser ou maintenir CLOSED
      if (state.status === 'HALF_OPEN') {
        console.log(`[CIRCUIT-BREAKER] ${circuitName}: Recovery successful, circuit CLOSED`);
      }
      
      this.updateCircuitState(circuitName, {
        status: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      });

      return result;

    } catch (error) {
      const newFailureCount = state.failureCount + 1;
      const now = Date.now();

      console.error(`[CIRCUIT-BREAKER] ${circuitName}: Failure ${newFailureCount}/${finalConfig.failureThreshold}`, {
        error: error.message
      });

      if (newFailureCount >= finalConfig.failureThreshold) {
        // Ouvrir le circuit
        console.error(`[CIRCUIT-BREAKER] ${circuitName}: Circuit OPEN for ${finalConfig.recoveryTimeout}ms`);
        
        this.updateCircuitState(circuitName, {
          status: 'OPEN',
          failureCount: newFailureCount,
          lastFailureTime: now,
          nextAttemptTime: now + finalConfig.recoveryTimeout
        });

        if (fallback) {
          console.log(`[CIRCUIT-BREAKER] ${circuitName}: Using fallback`);
          return await fallback();
        }
      } else {
        // Incrémenter le compteur d'échecs
        this.updateCircuitState(circuitName, {
          ...state,
          failureCount: newFailureCount,
          lastFailureTime: now
        });
      }

      throw error;
    }
  }

  /**
   * Obtenir l'état actuel d'un circuit
   */
  getCircuitState(circuitName: string): CircuitBreakerState {
    if (!this.circuits.has(circuitName)) {
      this.circuits.set(circuitName, {
        status: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      });
    }
    return this.circuits.get(circuitName)!;
  }

  /**
   * Forcer la fermeture d'un circuit (reset manual)
   */
  resetCircuit(circuitName: string): void {
    this.updateCircuitState(circuitName, {
      status: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    });
    console.log(`[CIRCUIT-BREAKER] ${circuitName}: Circuit manually reset`);
  }

  /**
   * Obtenir les statistiques de tous les circuits
   */
  getAllCircuitStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {};
    for (const [name, state] of this.circuits.entries()) {
      stats[name] = { ...state };
    }
    return stats;
  }

  /**
   * Nettoyer les circuits inactifs
   */
  cleanupInactiveCircuits(): void {
    const now = Date.now();
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [name, state] of this.circuits.entries()) {
      if (state.lastFailureTime > 0 && now - state.lastFailureTime > inactiveThreshold) {
        this.circuits.delete(name);
        console.log(`[CIRCUIT-BREAKER] Cleaned up inactive circuit: ${name}`);
      }
    }
  }

  private updateCircuitState(circuitName: string, newState: CircuitBreakerState): void {
    this.circuits.set(circuitName, newState);
  }
}

export const circuitBreakerService = new CircuitBreakerService();

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
  circuitBreakerService.cleanupInactiveCircuits();
}, 5 * 60 * 1000);