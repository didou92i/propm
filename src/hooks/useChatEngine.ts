import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { Message } from '@/types/chat';

/**
 * Hook composite qui combine toute la logique du chat
 * Simplifie l'utilisation dans les composants
 */
export function useChatEngine(agentId: string) {
  const { streamingState, sendStreamingMessage, cancelStream } = useStreamingChat();
  const { 
    updateConversation, 
    getConversation, 
    getConversationSummary, 
    clearConversation, 
    getAllAgentsWithHistory 
  } = useConversationHistory();
  const { optimizeMessages, cleanupLocalStorage } = usePerformanceOptimization();

  const sendMessage = async (
    messages: Message[],
    userSession: any,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    onError: (error: string) => void
  ) => {
    // Optimise les messages avant envoi
    const optimizedMessages = optimizeMessages(messages);
    
    return sendStreamingMessage(
      optimizedMessages,
      agentId,
      userSession,
      onMessageUpdate,
      onComplete,
      onError
    );
  };

  const loadConversation = () => {
    return getConversation(agentId);
  };

  const saveConversation = (messages: Message[]) => {
    updateConversation(agentId, messages);
  };

  const getAgentSummary = () => {
    return getConversationSummary(agentId);
  };

  const clearAgentConversation = () => {
    clearConversation(agentId);
  };

  return {
    // État du streaming
    streamingState,
    
    // Actions de chat
    sendMessage,
    cancelStream,
    
    // Gestion de l'historique
    loadConversation,
    saveConversation,
    getAgentSummary,
    clearAgentConversation,
    getAllAgentsWithHistory,
    
    // Optimisation
    optimizeMessages,
    cleanupLocalStorage
  };
}