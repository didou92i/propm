/**
 * Service de mapping des assistants OpenAI
 * Extraction sécurisée de la configuration des assistants depuis chat-openai-stream
 */

interface AssistantConfig {
  id: string;
  getInstructions?: (messageContent: string) => string | undefined;
}

export class AssistantMapper {
  private static readonly assistantMap: Record<string, string> = {
    redacpro: "asst_nVveo2OzbB2h8uHY2oIDpob1",
    cdspro: "asst_ljWenYnbNEERVydsDaeVSHVl",
    arrete: "asst_e4AMY6vpiqgqFwbQuhNCbyeL",
    prepacds: "asst_MxbbQeTimcxV2mYR0KwAPNsu"
  };

  static getAssistantId(selectedAgent: string): string {
    return this.assistantMap[selectedAgent] || this.assistantMap.redacpro;
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

  static getAllAgents(): string[] {
    return Object.keys(this.assistantMap);
  }
}