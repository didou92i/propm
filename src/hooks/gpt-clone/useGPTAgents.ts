import { useState, useEffect } from "react";
import { GPTAgent } from "@/types/gpt-clone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Default agents configuration
const DEFAULT_AGENTS: GPTAgent[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Le modèle le plus puissant d'OpenAI",
    provider: "openai",
    model: "gpt-4-turbo-preview",
    icon: "🚀",
    color: "#10a37f",
    temperature: 0.7,
    maxTokens: 4000,
    isActive: true,
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
    },
  },
  {
    id: "gpt-3.5",
    name: "GPT-3.5 Turbo",
    description: "Rapide et efficace pour la plupart des tâches",
    provider: "openai",
    model: "gpt-3.5-turbo",
    icon: "⚡",
    color: "#74aa9c",
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    capabilities: {
      streaming: true,
      functionCalling: true,
    },
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Le modèle le plus puissant d'Anthropic",
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    icon: "🧠",
    color: "#cc785c",
    temperature: 0.7,
    maxTokens: 4000,
    isActive: true,
    capabilities: {
      streaming: true,
      vision: true,
    },
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "Équilibre idéal entre performance et rapidité",
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    icon: "💫",
    color: "#d97757",
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    capabilities: {
      streaming: true,
      vision: true,
    },
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    description: "Modèle français performant",
    provider: "mistral",
    model: "mistral-large-latest",
    icon: "🇫🇷",
    color: "#ff7000",
    temperature: 0.7,
    maxTokens: 3000,
    isActive: true,
    capabilities: {
      streaming: true,
      functionCalling: true,
    },
  },
];

export function useGPTAgents() {
  const [agents, setAgents] = useState<GPTAgent[]>(DEFAULT_AGENTS);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Use default agents if not authenticated
        setAgents(DEFAULT_AGENTS);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("gpt_agents")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading agents:", error);
        // Fallback to default agents
        setAgents(DEFAULT_AGENTS);
      } else if (data && data.length > 0) {
        const loadedAgents: GPTAgent[] = data.map((agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          provider: agent.provider as any,
          model: agent.model,
          apiKey: agent.api_key,
          baseUrl: agent.base_url,
          systemPrompt: agent.system_prompt,
          temperature: agent.temperature,
          maxTokens: agent.max_tokens,
          topP: agent.top_p,
          icon: agent.icon,
          color: agent.color,
          isActive: agent.is_active,
          capabilities: agent.capabilities as any,
          metadata: agent.metadata,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at,
        }));
        setAgents(loadedAgents);
      } else {
        // Use defaults if no custom agents
        setAgents(DEFAULT_AGENTS);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
      setAgents(DEFAULT_AGENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (agent: Omit<GPTAgent, "id" | "createdAt" | "updatedAt">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Non authentifié",
          description: "Vous devez être connecté pour créer un agent",
          variant: "destructive",
        });
        return null;
      }

      const newAgent = {
        name: agent.name,
        description: agent.description,
        provider: agent.provider,
        model: agent.model,
        api_key: agent.apiKey,
        base_url: agent.baseUrl,
        system_prompt: agent.systemPrompt,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        top_p: agent.topP,
        icon: agent.icon,
        color: agent.color,
        is_active: agent.isActive ?? true,
        capabilities: agent.capabilities,
        metadata: agent.metadata,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("gpt_agents")
        .insert(newAgent)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Agent créé",
        description: `L'agent ${agent.name} a été créé avec succès`,
      });

      loadAgents();
      return data;
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'agent",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<GPTAgent>) => {
    try {
      const { error } = await supabase
        .from("gpt_agents")
        .update({
          name: updates.name,
          description: updates.description,
          model: updates.model,
          api_key: updates.apiKey,
          base_url: updates.baseUrl,
          system_prompt: updates.systemPrompt,
          temperature: updates.temperature,
          max_tokens: updates.maxTokens,
          top_p: updates.topP,
          icon: updates.icon,
          color: updates.color,
          is_active: updates.isActive,
          capabilities: updates.capabilities,
          metadata: updates.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Agent mis à jour",
        description: "Les modifications ont été enregistrées",
      });

      loadAgents();
    } catch (error) {
      console.error("Error updating agent:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'agent",
        variant: "destructive",
      });
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("gpt_agents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Agent supprimé",
        description: "L'agent a été supprimé avec succès",
      });

      loadAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'agent",
        variant: "destructive",
      });
    }
  };

  return {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    reloadAgents: loadAgents,
  };
}
