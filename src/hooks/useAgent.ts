import { getAgentById } from "@/config/agents";
import type { Agent } from "@/types/agent";

/**
 * Hook pour récupérer les informations d'un agent de manière type-safe
 * @param agentId - Identifiant de l'agent
 * @returns Les informations complètes de l'agent ou undefined
 */
export function useAgent(agentId: string): Agent | undefined {
  return getAgentById(agentId);
}

/**
 * Hook pour récupérer les informations d'un agent avec gestion d'erreur
 * @param agentId - Identifiant de l'agent
 * @returns Les informations de l'agent avec fallback
 */
export function useAgentSafe(agentId: string) {
  const agent = getAgentById(agentId);
  
  return {
    agent,
    name: agent?.name || "Assistant",
    avatar: agent?.avatar || null,
    icon: agent?.icon || null,
    color: agent?.color || "text-primary",
    description: agent?.description || "Assistant IA"
  };
}