import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';

interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  status: string;
  progress: number;
}

export function useStreamingChat() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    status: '',
    progress: 0
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendStreamingMessage = useCallback(async (
    messages: Message[],
    selectedAgent: string,
    userSession: any,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    onError: (error: string) => void
  ) => {
    try {
      setStreamingState({
        isStreaming: true,
        currentContent: '',
        status: 'Connexion...',
        progress: 0
      });

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Progress simulation
      setStreamingState(prev => ({ ...prev, status: 'Traitement...', progress: 20 }));
      
      const { data, error } = await supabase.functions.invoke('chat-openai', {
        body: {
          messages,
          selectedAgent,
          userSession
        }
      });

      if (error) {
        throw new Error(`Erreur: ${error.message}`);
      }

      // Simulate progress for better UX
      setStreamingState(prev => ({ ...prev, status: 'Finalisation...', progress: 80 }));
      
      // Brief delay to show progress
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data && data.content) {
        setStreamingState(prev => ({
          ...prev,
          currentContent: data.content,
          status: 'Terminé',
          progress: 100,
          isStreaming: false
        }));
        onMessageUpdate(data.content, true);
        onComplete(data.content, data.threadId);
      }

    } catch (error) {
      logger.error('Chat error', error, 'useStreamingChat');
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        status: 'Erreur',
        progress: 0
      }));
      onError(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingState({
      isStreaming: false,
      currentContent: '',
      status: 'Annulé',
      progress: 0
    });
  }, []);

  return {
    streamingState,
    sendStreamingMessage,
    cancelStream
  };
}