import { useCallback, useMemo, useReducer } from 'react';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useSSEStreamingChat } from '@/hooks/useSSEStreamingChat';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { Message } from '@/types/chat';

// État optimisé pour le chat
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  typingMessageId: string | null;
}

type ChatAction = 
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TYPING'; payload: string | null }
  | { type: 'RESET' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TYPING':
      return { ...state, typingMessageId: action.payload };
    case 'RESET':
      return { messages: [], isLoading: false, error: null, typingMessageId: null };
    default:
      return state;
  }
};

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  typingMessageId: null
};

/**
 * Hook de chat optimisé avec useReducer pour de meilleures performances
 * Support JSON (chat-openai-stream) et SSE (chat-completions-optimized)
 */
export function useOptimizedChatEngine(agentId: string, useSSE: boolean = false) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Sélection intelligente du hook de streaming
  const jsonStreaming = useStreamingChat();
  const sseStreaming = useSSEStreamingChat();  
  const { streamingState, sendStreamingMessage, cancelStream } = useSSE ? sseStreaming : jsonStreaming;
  const { 
    updateConversation, 
    getConversation, 
    getConversationSummary, 
    clearConversation, 
    getAllAgentsWithHistory 
  } = useConversationHistory();
  const { optimizeMessages, cleanupLocalStorage, debounce } = usePerformanceOptimization();

  // Callbacks optimisés avec useCallback
  const setMessages = useCallback((messages: Message[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setTyping = useCallback((messageId: string | null) => {
    dispatch({ type: 'SET_TYPING', payload: messageId });
  }, []);

  // Fonction d'envoi de message optimisée avec choix du protocole
  const sendMessage = useCallback(async (
    userSession: any,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    onError: (error: string) => void
  ) => {
    // Optimise les messages avant envoi
    const optimizedMessages = optimizeMessages(state.messages);
    
    console.log(`Using ${useSSE ? 'SSE' : 'JSON'} streaming for agent: ${agentId}`);
    
    // Pass empty enrichedContent as this hook doesn't handle attachments
    return sendStreamingMessage(
      optimizedMessages,
      agentId,
      userSession,
      '', // enrichedContent - empty for generic hook
      onMessageUpdate,
      onComplete,
      onError
    );
  }, [optimizeMessages, state.messages, sendStreamingMessage, agentId, useSSE]);

  // Actions optimisées
  const loadConversation = useCallback(() => {
    const conversation = getConversation(agentId);
    if (conversation) {
      setMessages(conversation);
    }
    return conversation;
  }, [agentId, getConversation, setMessages]);

  const saveConversation = useCallback(
    debounce((messages: Message[]) => {
      updateConversation(agentId, messages);
    }, 500),
    [agentId, updateConversation, debounce]
  );

  const getAgentSummary = useCallback(() => {
    return getConversationSummary(agentId);
  }, [agentId, getConversationSummary]);

  const clearAgentConversation = useCallback(() => {
    clearConversation(agentId);
    dispatch({ type: 'RESET' });
  }, [agentId, clearConversation]);

  // Mémoisation des valeurs calculées
  const optimizedMessages = useMemo(() => 
    optimizeMessages(state.messages), 
    [state.messages, optimizeMessages]
  );

  const messageCount = useMemo(() => 
    state.messages.length, 
    [state.messages.length]
  );

  const hasMessages = useMemo(() => 
    state.messages.length > 0, 
    [state.messages.length]
  );

  // Nettoyage automatique
  const performCleanup = useCallback(() => {
    cleanupLocalStorage();
  }, [cleanupLocalStorage]);

  return {
    // État
    ...state,
    streamingState,
    optimizedMessages,
    messageCount,
    hasMessages,
    
    // Actions
    setMessages,
    addMessage,
    setLoading,
    setError,
    setTyping,
    sendMessage,
    cancelStream,
    
    // Gestion de l'historique
    loadConversation,
    saveConversation,
    getAgentSummary,
    clearAgentConversation,
    getAllAgentsWithHistory,
    
    // Optimisation
    performCleanup
  };
}