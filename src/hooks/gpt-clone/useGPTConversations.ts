import { useState, useEffect } from "react";
import { GPTConversation } from "@/types/gpt-clone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGPTConversations() {
  const [conversations, setConversations] = useState<GPTConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("gpt_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (agentId: string): Promise<GPTConversation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Non authentifié",
          description: "Vous devez être connecté pour créer une conversation",
          variant: "destructive",
        });
        return null;
      }

      const newConversation = {
        title: "Nouvelle conversation",
        agent_id: agentId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("gpt_conversations")
        .insert(newConversation)
        .select()
        .single();

      if (error) throw error;

      const conversation: GPTConversation = {
        id: data.id,
        title: data.title,
        agentId: data.agent_id,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setConversations([conversation, ...conversations]);

      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("gpt_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setConversations(conversations.filter(c => c.id !== id));

      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation",
        variant: "destructive",
      });
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from("gpt_conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setConversations(
        conversations.map(c => c.id === id ? { ...c, title } : c)
      );
    } catch (error) {
      console.error("Error updating conversation title:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le titre",
        variant: "destructive",
      });
    }
  };

  return {
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    reloadConversations: loadConversations,
  };
}
