/**
 * Service de mapping des assistants OpenAI avec diagnostic automatique
 * Détection proactive des assistants défaillants et fallback intelligent
 */

interface AssistantConfig {
  id: string;
  getInstructions?: (messageContent: string) => string | undefined;
}

interface AssistantDiagnostic {
  id: string;
  isWorking: boolean;
  lastTested: number;
  failureCount: number;
  avgResponseTime: number;
}

export class AssistantMapper {
  private static readonly assistantMap: Record<string, string> = {
    redacpro: "asst_nVveo2OzbB2h8uHY2oIDpob1",
    cdspro: "asst_ljWenYnbNEERVydsDaeVSHVl",
    arrete: "asst_e4AMY6vpiqgqFwbQuhNCbyeL",
    prepacds: "asst_MxbbQeTimcxV2mYR0KwAPNsu"
  };

  // Assistant de fallback fiable (CDS Pro fonctionne)
  private static readonly FALLBACK_ASSISTANT = "asst_ljWenYnbNEERVydsDaeVSHVl";
  
  // Cache des diagnostics d'assistants
  private static diagnostics: Map<string, AssistantDiagnostic> = new Map();

  static getAssistantId(selectedAgent: string): string {
    const originalId = this.assistantMap[selectedAgent];
    
    if (!originalId) {
      console.warn(`assistant-mapper: agent '${selectedAgent}' non trouvé, utilisation du fallback`);
      return this.FALLBACK_ASSISTANT;
    }

    // Réinitialiser les diagnostics périmés
    this.resetDiagnosticIfStale(originalId);
    
    // Vérifier le diagnostic de l'assistant
    const diagnostic = this.diagnostics.get(originalId);
    
    // Seuil à 3 échecs ET vérifier si récent
    const isRecentFailure = diagnostic && (Date.now() - diagnostic.lastTested < 60000); // < 1 min
    const shouldUseFallback = diagnostic && 
                             !diagnostic.isWorking && 
                             diagnostic.failureCount >= 3 &&  // De 2 à 3
                             isRecentFailure;
    
    if (shouldUseFallback) {
      console.warn(`assistant-mapper: utilisation du fallback pour '${selectedAgent}' (${diagnostic.failureCount} échecs récents)`);
      return this.FALLBACK_ASSISTANT;
    }

    return originalId;
  }

  static getInstructions(agent: string, messageContent: string): string | undefined {
    // Seul l'agent "arrete" a des instructions spécifiques
    if (agent === 'arrete') {
      const text = messageContent.toLowerCase();
      const shouldGenerate = /arr[ée]t[ée]|exemple|g[ée]n[ée]re|r[ée]dige|produis/.test(text);
      if (shouldGenerate) {
        return "Réponds en français. Produis l'arrêté demandé selon la structure réglementaire.";
      }
    }
    
    // Les autres assistants utilisent leurs prompts configurés
    return undefined;
  }

  static recordSuccess(assistantId: string, responseTime: number): void {
    const diagnostic = this.diagnostics.get(assistantId) || {
      id: assistantId,
      isWorking: true,
      lastTested: Date.now(),
      failureCount: 0,
      avgResponseTime: 0
    };

    diagnostic.isWorking = true;
    diagnostic.lastTested = Date.now();
    diagnostic.failureCount = Math.max(0, diagnostic.failureCount - 1); // Réduire le compteur d'échecs
    diagnostic.avgResponseTime = (diagnostic.avgResponseTime + responseTime) / 2;
    
    this.diagnostics.set(assistantId, diagnostic);
    console.log(`assistant-mapper: succès pour ${assistantId} (${responseTime}ms)`);
  }

  static recordFailure(assistantId: string): void {
    const diagnostic = this.diagnostics.get(assistantId) || {
      id: assistantId,
      isWorking: true,
      lastTested: Date.now(),
      failureCount: 0,
      avgResponseTime: 0
    };

    diagnostic.isWorking = false;
    diagnostic.lastTested = Date.now();
    diagnostic.failureCount += 1;
    
    this.diagnostics.set(assistantId, diagnostic);
    console.error(`assistant-mapper: échec pour ${assistantId} (${diagnostic.failureCount} échecs total)`);
  }

  static resetDiagnosticIfStale(assistantId: string): void {
    const diagnostic = this.diagnostics.get(assistantId);
    
    // Réinitialiser si aucun échec depuis 5 minutes
    if (diagnostic && (Date.now() - diagnostic.lastTested > 300000)) {
      console.log(`assistant-mapper: resetting stale diagnostic for ${assistantId}`);
      
      diagnostic.failureCount = 0;
      diagnostic.isWorking = true;
      this.diagnostics.set(assistantId, diagnostic);
    }
  }

  static getOptimizedConfig(assistantId: string): { maxAttempts: number; globalTimeout: number } {
    const diagnostic = this.diagnostics.get(assistantId);
    
    // Configuration par assistant selon leur complexité
    const assistantConfigs: Record<string, { maxAttempts: number; globalTimeout: number }> = {
      'asst_nVveo2OzbB2h8uHY2oIDpob1': { // RedacPro (documents juridiques longs)
        maxAttempts: 25,
        globalTimeout: 30000  // 30 secondes
      },
      'asst_e4AMY6vpiqgqFwbQuhNCbyeL': { // Arrete (génération complexe)
        maxAttempts: 20,
        globalTimeout: 25000  // 25 secondes
      },
      'asst_ljWenYnbNEERVydsDaeVSHVl': { // CDS Pro (fallback fiable)
        maxAttempts: 15,
        globalTimeout: 18000  // 18 secondes
      },
      'asst_MxbbQeTimcxV2mYR0KwAPNsu': { // PrepaCDS (questions rapides)
        maxAttempts: 12,
        globalTimeout: 15000  // 15 secondes
      }
    };
    
    // Utiliser la config spécifique ou fallback
    const specificConfig = assistantConfigs[assistantId];
    if (specificConfig) return specificConfig;
    
    // Config générique pour assistants inconnus
    if (diagnostic && diagnostic.failureCount >= 3) {  // Seuil relevé de 0 à 3
      return {
        maxAttempts: 10,
        globalTimeout: 12000
      };
    }
    
    return {
      maxAttempts: 15,
      globalTimeout: 18000  // De 12s à 18s par défaut
    };
  }

  static getAllAgents(): string[] {
    return Object.keys(this.assistantMap);
  }

  static getDiagnostics(): AssistantDiagnostic[] {
    return Array.from(this.diagnostics.values());
  }
}