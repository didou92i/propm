import { useState, useEffect, useCallback } from "react";
import { GPTMessage } from "@/types/gpt-clone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { gptChatService } from "@/services/gpt-clone/gptChatService";

export function useGPTChat(conversationId: string | null, agentId: string) {
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("gpt_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("timestamp", { ascending: true });

      if (error) throw error;

      const loadedMessages: GPTMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: msg.timestamp,
        agentId: msg.agent_id,
        metadata: msg.metadata as any,
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (
    convId: string,
    role: "user" | "assistant",
    content: string,
    metadata?: any
  ): Promise<GPTMessage | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const newMessage = {
        conversation_id: convId,
        role,
        content,
        timestamp: new Date().toISOString(),
        agent_id: role === "assistant" ? agentId : undefined,
        metadata: metadata || {},
      };

      const { data, error } = await supabase
        .from("gpt_messages")
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        conversationId: data.conversation_id,
        role: data.role as "user" | "assistant",
        content: data.content,
        timestamp: data.timestamp,
        agentId: data.agent_id,
        metadata: data.metadata as any,
      };
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) {
        toast({
          title: "Erreur",
          description: "Aucune conversation sélectionnée",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsStreaming(true);

        // Save user message
        const userMessage = await saveMessage(conversationId, "user", content);
        if (!userMessage) throw new Error("Failed to save user message");

        setMessages((prev) => [...prev, userMessage]);

        // Update conversation title if first message
        if (messages.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          await supabase
            .from("gpt_conversations")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        // Create temporary assistant message for streaming
        const tempAssistantMessage: GPTMessage = {
          id: `temp-${Date.now()}`,
          conversationId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
          agentId,
        };

        setMessages((prev) => [...prev, tempAssistantMessage]);

        // Stream response
        let fullResponse = "";
        await gptChatService.streamChat(
          conversationId,
          content,
          agentId,
          (chunk) => {
            fullResponse += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantMessage.id
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
          }
        );

        // Save final assistant message
        const assistantMessage = await saveMessage(
          conversationId,
          "assistant",
          fullResponse,
          { model: agentId }
        );

        if (assistantMessage) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMessage.id ? assistantMessage : msg
            )
          );
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer le message",
          variant: "destructive",
        });

        // Remove temporary message on error
        setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId, agentId, messages.length, toast]
  );

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
    reloadMessages: () => conversationId && loadMessages(conversationId),
  };
}
