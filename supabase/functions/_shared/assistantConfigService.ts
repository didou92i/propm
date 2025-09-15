/**
 * Service de configuration des assistants OpenAI
 */

export interface AssistantConfig {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  model?: string;
  tools?: any[];
  fileIds?: string[];
}

export class AssistantConfigService {
  private static readonly ASSISTANT_MAPPINGS = {
    redacpro: {
      id: "asst_nVveo2OzbB2h8uHY2oIDpob1",
      name: "RedacPro",
      description: "Assistant spécialisé en rédaction administrative",
      model: "gpt-4.1-2025-04-14"
    },
    cdspro: {
      id: "asst_ljWenYnbNEERVydsDaeVSHVl",
      name: "CDS Pro",
      description: "Assistant spécialisé en sécurité et chef de service",
      model: "gpt-4.1-2025-04-14"
    },
    arrete: {
      id: "asst_e4AMY6vpiqgqFwbQuhNCbyeL",
      name: "Arrêté Territorial",
      description: "Assistant spécialisé en arrêtés territoriaux",
      model: "gpt-4.1-2025-04-14"
    },
    prepacds: {
      id: "asst_MxbbQeTimcxV2mYR0KwAPNsu",
      name: "PrepaCDS",
      description: "Assistant spécialisé en préparation concours CDS",
      model: "gpt-4.1-2025-04-14"
    }
  };

  /**
   * Obtenir la configuration d'un assistant
   */
  static getAssistantConfig(agentName: string): AssistantConfig {
    const config = this.ASSISTANT_MAPPINGS[agentName as keyof typeof this.ASSISTANT_MAPPINGS];
    
    if (!config) {
      console.warn(`Assistant non trouvé: ${agentName}, utilisation de redacpro par défaut`);
      return this.ASSISTANT_MAPPINGS.redacpro;
    }

    return config;
  }

  /**
   * Obtenir l'ID d'un assistant
   */
  static getAssistantId(agentName: string): string {
    return this.getAssistantConfig(agentName).id;
  }

  /**
   * Obtenir les instructions contextuelles pour un assistant
   */
  static getContextualInstructions(
    agentName: string, 
    userMessage: string,
    additionalContext?: string
  ): string | undefined {
    const baseConfig = this.getAssistantConfig(agentName);
    
    // Instructions spécifiques par agent
    const specificInstructions = {
      redacpro: this.getRedacProInstructions(userMessage),
      cdspro: this.getCdsProInstructions(userMessage),
      arrete: this.getArreteInstructions(userMessage),
      prepacds: this.getPrepaCdsInstructions(userMessage)
    };

    const instructions = specificInstructions[agentName as keyof typeof specificInstructions];
    
    if (additionalContext) {
      return `${instructions}\n\nContexte additionnel: ${additionalContext}`;
    }

    return instructions;
  }

  /**
   * Vérifier si un assistant existe et est actif
   */
  static async validateAssistant(assistantId: string, openAIApiKey: string): Promise<{
    isValid: boolean;
    error?: string;
    assistantInfo?: any;
  }> {
    try {
      const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: `Assistant inaccessible: ${response.status}`
        };
      }

      const assistantData = await response.json();
      
      return {
        isValid: true,
        assistantInfo: {
          id: assistantData.id,
          name: assistantData.name,
          model: assistantData.model,
          instructions: assistantData.instructions?.substring(0, 100) + '...'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Erreur de validation: ${error.message}`
      };
    }
  }

  /**
   * Obtenir la liste de tous les assistants disponibles
   */
  static getAllAssistants(): { [key: string]: AssistantConfig } {
    return this.ASSISTANT_MAPPINGS;
  }

  /**
   * Instructions spécifiques pour RedacPro
   */
  private static getRedacProInstructions(userMessage: string): string {
    const messageLength = userMessage.length;
    const hasLegalTerms = /\b(arrêté|décret|loi|article|code|juridique|réglementation)\b/i.test(userMessage);
    
    let instructions = `Tu es RedacPro, assistant spécialisé en rédaction administrative française. `;
    
    if (hasLegalTerms) {
      instructions += `Le message contient des termes juridiques, assure-toi de la précision réglementaire. `;
    }
    
    if (messageLength > 500) {
      instructions += `Le message est détaillé, structure ta réponse clairement avec des sections. `;
    }
    
    instructions += `Privilégie la clarté, la conformité administrative et la précision juridique.`;
    
    return instructions;
  }

  /**
   * Instructions spécifiques pour CDS Pro
   */
  private static getCdsProInstructions(userMessage: string): string {
    const hasSecurityTerms = /\b(sécurité|police|surveillance|contrôle|intervention)\b/i.test(userMessage);
    const hasManagementTerms = /\b(équipe|management|organisation|planification|gestion)\b/i.test(userMessage);
    
    let instructions = `Tu es CDS Pro, assistant spécialisé en chef de service de police municipale. `;
    
    if (hasSecurityTerms) {
      instructions += `Concentre-toi sur les aspects sécuritaires et opérationnels. `;
    }
    
    if (hasManagementTerms) {
      instructions += `Insiste sur les bonnes pratiques de management et d'organisation. `;
    }
    
    instructions += `Adopte une approche pragmatique et professionnelle.`;
    
    return instructions;
  }

  /**
   * Instructions spécifiques pour Arrêté Territorial
   */
  private static getArreteInstructions(userMessage: string): string {
    const hasUrbanismTerms = /\b(urbanisme|construction|permis|zone|territoire)\b/i.test(userMessage);
    const hasRegulationTerms = /\b(circulation|stationnement|marché|manifestation)\b/i.test(userMessage);
    
    let instructions = `Tu es l'assistant Arrêté Territorial, spécialisé en réglementation territoriale. `;
    
    if (hasUrbanismTerms) {
      instructions += `Concentre-toi sur les aspects d'urbanisme et d'aménagement. `;
    }
    
    if (hasRegulationTerms) {
      instructions += `Focalise sur la réglementation de circulation et les autorisations. `;
    }
    
    instructions += `Assure la conformité réglementaire et la précision juridique.`;
    
    return instructions;
  }

  /**
   * Instructions spécifiques pour PrepaCDS
   */
  private static getPrepaCdsInstructions(userMessage: string): string {
    const hasQuizTerms = /\b(quiz|qcm|test|évaluation|exercice)\b/i.test(userMessage);
    const hasStudyTerms = /\b(cours|révision|apprentissage|formation|concours)\b/i.test(userMessage);
    
    let instructions = `Tu es PrepaCDS, assistant spécialisé en préparation au concours de Chef de Service. `;
    
    if (hasQuizTerms) {
      instructions += `Prépare du contenu d'évaluation structuré et progressif. `;
    }
    
    if (hasStudyTerms) {
      instructions += `Organise le contenu pédagogique de manière claire et méthodique. `;
    }
    
    instructions += `Adopte une approche pédagogique et encourageante pour la réussite au concours.`;
    
    return instructions;
  }

  /**
   * Obtenir les outils recommandés pour un assistant
   */
  static getRecommendedTools(agentName: string): string[] {
    const toolMappings = {
      redacpro: ['document_analysis', 'legal_search', 'template_generator'],
      cdspro: ['security_assessment', 'team_management', 'incident_analysis'],
      arrete: ['regulation_checker', 'territory_analysis', 'legal_validation'],
      prepacds: ['quiz_generator', 'study_planner', 'progress_tracker']
    };

    return toolMappings[agentName as keyof typeof toolMappings] || [];
  }

  /**
   * Formater les métadonnées d'un assistant pour les logs
   */
  static formatAssistantMetadata(agentName: string): {
    assistantId: string;
    assistantName: string;
    model: string;
    capabilities: string[];
  } {
    const config = this.getAssistantConfig(agentName);
    const tools = this.getRecommendedTools(agentName);
    
    return {
      assistantId: config.id,
      assistantName: config.name,
      model: config.model || 'gpt-4.1-2025-04-14',
      capabilities: tools
    };
  }
}