import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';

interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  isTyping: boolean;
}

export function useStreamingChat() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    isTyping: false
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
        isTyping: true
      });

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Use streaming endpoint
      const { data, error } = await supabase.functions.invoke('chat-openai-stream', {
        body: {
          messages,
          selectedAgent,
          userSession
        }
      });

      if (error) {
        throw new Error(`Erreur: ${error.message}`);
      }

      // Handle streaming response
      if (data && data.content) {
        // Simulate real-time streaming by revealing text progressively
        const content = data.content;
        let currentIndex = 0;
        
        const revealNextChunk = () => {
          if (currentIndex < content.length && !abortControllerRef.current?.signal.aborted) {
            // Reveal 1-3 characters at a time for natural typing effect
            const chunkSize = Math.floor(Math.random() * 3) + 1;
            const nextChunk = content.slice(0, currentIndex + chunkSize);
            currentIndex += chunkSize;
            
            setStreamingState(prev => ({
              ...prev,
              currentContent: nextChunk,
              isTyping: currentIndex < content.length
            }));
            
            onMessageUpdate(nextChunk, currentIndex >= content.length);
            
            if (currentIndex < content.length) {
              // Variable delay for natural typing rhythm
              const delay = Math.random() * 15 + 10; // 10-25ms per character - plus rapide
              setTimeout(revealNextChunk, delay);
            } else {
              // Finished streaming
              setStreamingState(prev => ({
                ...prev,
                isStreaming: false,
                isTyping: false
              }));
              onComplete(content, data.threadId);
            }
          }
        };
        
        // Start the streaming effect
        setTimeout(revealNextChunk, 100);
      }

    } catch (error) {
      logger.error('Chat error', error, 'useStreamingChat');
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        isTyping: false
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
      isTyping: false
    });
  }, []);

  return {
    streamingState,
    sendStreamingMessage,
    cancelStream
  };
}