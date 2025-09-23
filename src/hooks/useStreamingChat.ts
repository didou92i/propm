import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';
import { usePerformanceMonitor } from '@/hooks/performance/usePerformanceMonitor';

interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  isTyping: boolean;
  performance?: {
    firstTokenLatency: number;
    tokenCount: number;
    tokensPerSecond: number;
  };
}

export function useStreamingChat() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    isTyping: false
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { startSession, endSession, getOptimizedParams } = usePerformanceMonitor();

  const sendStreamingMessage = useCallback(async (
    messages: Message[],
    selectedAgent: string,
    userSession: any,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    onError: (error: string) => void
  ) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageLength = messages[messages.length - 1]?.content?.length || 0;
    
    // Start performance monitoring
    const optimizedParams = startSession(sessionId, messageLength, selectedAgent);
    
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

      // Immediate user feedback
      onMessageUpdate('L\'assistant traite votre demande...', false);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session non disponible');
      }

      // Utiliser chat-openai-stream pour compatibilité JSON
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

      if (data && data.content) {
        // Simulate streaming for better UX with optimized chat completions
        const content = data.content;
        let currentIndex = 0;
        
        const revealNextChunk = () => {
          if (currentIndex < content.length && !abortControllerRef.current?.signal.aborted) {
            const chunkSize = Math.max(3, Math.min(8, Math.floor(Math.random() * 5) + 3));
            const nextChunk = content.slice(0, currentIndex + chunkSize);
            currentIndex += chunkSize;
            
            setStreamingState(prev => ({
              ...prev,
              currentContent: nextChunk,
              isTyping: currentIndex < content.length
            }));
            
            onMessageUpdate(nextChunk, currentIndex >= content.length);
            
            if (currentIndex < content.length) {
              const delay = Math.max(5, Math.random() * 15 + 5);
              setTimeout(revealNextChunk, delay);
            } else {
              setStreamingState(prev => ({
                ...prev,
                isStreaming: false,
                isTyping: false
              }));
              endSession(sessionId, true);
              onComplete(content);
              return;
            }
          }
        };
        
        revealNextChunk();
      } else {
        throw new Error('Aucune réponse reçue');
      }

    } catch (error) {
      endSession(sessionId, false);
      
      if (error.name === 'AbortError') {
        return; // User cancelled, don't show error
      }
      
      logger.error('Stream function critical error:', error);
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        isTyping: false
      }));
      
      onError(error instanceof Error ? error.message : 'Erreur de connexion avec l\'API OpenAI');
    }
  }, [startSession, endSession]);


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