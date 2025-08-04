/**
 * Types pour la gestion des prompts système des assistants
 */

export interface AgentPrompt {
  /** Prompt système principal de l'assistant */
  systemPrompt: string;
  
  /** Contexte d'utilisation et domaine d'expertise */
  context: string;
  
  /** Exemples d'interactions typiques */
  examples: string[];
  
  /** Contraintes et règles spécifiques */
  constraints: string[];
  
  /** Langue de travail */
  language: 'fr' | 'en';
  
  /** Version du prompt pour le suivi des changements */
  version: string;
  
  /** Date de dernière mise à jour */
  lastUpdated: string;
}

export interface AgentPromptConfig {
  [key: string]: AgentPrompt;
}