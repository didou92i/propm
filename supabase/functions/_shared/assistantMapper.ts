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

    // Vérifier le diagnostic de l'assistant
    const diagnostic = this.diagnostics.get(originalId);
    const shouldUseFallback = diagnostic && !diagnostic.isWorking && diagnostic.failureCount >= 2;
    
    if (shouldUseFallback) {
      console.warn(`assistant-mapper: utilisation du fallback pour '${selectedAgent}' (${diagnostic.failureCount} échecs)`);
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

  static getOptimizedConfig(assistantId: string): { maxAttempts: number; globalTimeout: number } {
    const diagnostic = this.diagnostics.get(assistantId);
    
    // Configuration réduite pour les assistants problématiques
    if (diagnostic && diagnostic.failureCount > 0) {
      return {
        maxAttempts: 8,        // Réduit de 15 à 8
        globalTimeout: 8000    // Réduit de 12s à 8s
      };
    }
    
    // Configuration standard pour les assistants fiables
    return {
      maxAttempts: 15,
      globalTimeout: 12000
    };
  }

  static getAllAgents(): string[] {
    return Object.keys(this.assistantMap);
  }

  static getDiagnostics(): AssistantDiagnostic[] {
    return Array.from(this.diagnostics.values());
  }
}