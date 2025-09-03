import { Bot, FileText, Calculator, MessageSquare, Search, Briefcase, GraduationCap } from "lucide-react";
import { getAgentPrompt, hasAgentPrompt } from "./prompts";
import type { Agent } from "@/types/agent";

export const AGENTS: Agent[] = [
  { 
    id: "redacpro", 
    name: "RedacPro", 
    icon: Bot, 
    color: "text-blue-400",
    avatar: "/lovable-uploads/190796cd-907b-454f-aea2-f482b263655d.png",
    description: "Expert en rédaction juridique et procédures de police municipale"
  },
  { 
    id: "cdspro", 
    name: "CDS Pro", 
    icon: FileText, 
    color: "text-purple-400",
    avatar: "/lovable-uploads/321ab54b-a748-42b7-b5e3-22717904fe90.png",
    description: "Expert en code de la sécurité"
  },
  { 
    id: "arrete", 
    name: "ArreteTerritorial", 
    icon: MessageSquare, 
    color: "text-green-400",
    avatar: "/lovable-uploads/47594ea7-a3ab-47c8-b4f5-6081c3b7f039.png",
    description: "Expert en rédaction d'arrêtés municipaux conformes au droit français"
  },
  { 
    id: "prepacds", 
    name: "Prepa CDS", 
    icon: GraduationCap, 
    color: "text-orange-400",
    avatar: "/lovable-uploads/67da1939-3215-457e-bc29-ea5425cd6aea.png",
    description: "Assistant de préparation CDS"
  },
];

export const TOOLS: Agent[] = [
  { 
    id: "salary", 
    name: "Simulateur de salaire", 
    icon: Calculator, 
    color: "text-yellow-400",
    description: "Calcul des salaires et charges"
  },
  { 
    id: "natif", 
    name: "Pro NATINF", 
    icon: Search, 
    color: "text-cyan-400",
    description: "Recherche avancée dans la base NATINF"
  },
  { 
    id: "jobs", 
    name: "Nous recrutons", 
    icon: Briefcase, 
    color: "text-blue-400",
    description: "Mini job-board : publier et consulter des offres"
  },
];

export const ALL_AGENTS: Agent[] = [...AGENTS, ...TOOLS];

export const getAgentById = (id: string): Agent | undefined => {
  return ALL_AGENTS.find(agent => agent.id === id);
};

/**
 * Récupère un assistant avec ses informations de prompt
 * @param id - Identifiant de l'assistant
 * @returns L'assistant avec ses infos de prompt ou undefined
 */
export const getAgentWithPrompt = (id: string) => {
  const agent = getAgentById(id);
  if (!agent) return undefined;
  
  const promptInfo = getAgentPrompt(id);
  return {
    ...agent,
    prompt: promptInfo,
    hasPrompt: hasAgentPrompt(id)
  };
};

/**
 * Récupère tous les assistants avec indication de leurs prompts
 * @returns Tableau des assistants avec infos de prompt
 */
export const getAllAgentsWithPromptInfo = () => {
  return ALL_AGENTS.map(agent => ({
    ...agent,
    hasPrompt: hasAgentPrompt(agent.id),
    prompt: getAgentPrompt(agent.id)
  }));
};