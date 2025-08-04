import { AgentPrompt, AgentPromptConfig } from '@/types/prompt';
import { redacproPrompt } from './redacpro';
import { cdsproPrompt } from './cdspro';
import { arretePrompt } from './arrete';
import { prepacdsPrompt } from './prepacds';

/**
 * Configuration centralisée des prompts système pour tous les assistants
 */
export const AGENT_PROMPTS: AgentPromptConfig = {
  redacpro: redacproPrompt,
  cdspro: cdsproPrompt,
  arrete: arretePrompt,
  prepacds: prepacdsPrompt,
};

/**
 * Récupère le prompt système d'un assistant par son ID
 * @param agentId - Identifiant de l'assistant
 * @returns Le prompt de l'assistant ou undefined si non trouvé
 */
export function getAgentPrompt(agentId: string): AgentPrompt | undefined {
  return AGENT_PROMPTS[agentId];
}

/**
 * Récupère uniquement le prompt système d'un assistant
 * @param agentId - Identifiant de l'assistant
 * @returns Le prompt système ou une chaîne par défaut
 */
export function getAgentSystemPrompt(agentId: string): string {
  const prompt = getAgentPrompt(agentId);
  return prompt?.systemPrompt || "Tu es un assistant IA spécialisé. Réponds de manière professionnelle et précise.";
}

/**
 * Vérifie si un assistant a un prompt système configuré
 * @param agentId - Identifiant de l'assistant
 * @returns true si le prompt existe, false sinon
 */
export function hasAgentPrompt(agentId: string): boolean {
  return agentId in AGENT_PROMPTS;
}

/**
 * Récupère la liste de tous les assistants ayant un prompt configuré
 * @returns Tableau des IDs des assistants avec prompts
 */
export function getAvailableAgentIds(): string[] {
  return Object.keys(AGENT_PROMPTS);
}

/**
 * Récupère les informations de contexte d'un assistant
 * @param agentId - Identifiant de l'assistant
 * @returns Les informations de contexte ou undefined
 */
export function getAgentContext(agentId: string): string | undefined {
  const prompt = getAgentPrompt(agentId);
  return prompt?.context;
}

/**
 * Récupère les exemples d'utilisation d'un assistant
 * @param agentId - Identifiant de l'assistant
 * @returns Les exemples ou un tableau vide
 */
export function getAgentExamples(agentId: string): string[] {
  const prompt = getAgentPrompt(agentId);
  return prompt?.examples || [];
}