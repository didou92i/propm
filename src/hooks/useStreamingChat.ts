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

      // Use Supabase functions.invoke for better error handling
      const { data, error } = await supabase.functions.invoke('chat-completions-optimized', {
        body: {
          messages,
          selectedAgent,
          userSession
        }
      });

      if (error) {
        throw new Error(`Erreur de streaming: ${error.message}`);
      }

      // If we got a direct response, handle it
      if (data && data.content) {
        onComplete(data.content, data.threadId);
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          isTyping: false
        }));
        endSession(sessionId, true);
        return;
      }

      // If we got a direct response, handle it
      if (data && data.content) {
        onComplete(data.content, data.threadId);
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          isTyping: false
        }));
        endSession(sessionId, true);
        return;
      }

      // Handle streaming response (this would need more implementation for SSE)
      throw new Error("Streaming non supporté via invoke");

    } catch (error) {
      endSession(sessionId, false);
      
      if (error.name === 'AbortError') {
        return; // User cancelled, don't show error
      }
      
      logger.error('Streaming error', error, 'useStreamingChat');
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        isTyping: false
      }));
      
      // Fallback to old method if new one fails
      console.log('Chat Completions failed, falling back to Assistants API');
      try {
        await fallbackToAssistantsAPI(messages, selectedAgent, userSession, onMessageUpdate, onComplete, onError);
      } catch (fallbackError) {
        onError(error instanceof Error ? error.message : 'Erreur de connexion');
      }
    }
  }, [startSession, endSession]);

  // Handle real-time streaming with Chat Completions
  const handleRealTimeStream = async (
    response: Response,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    sessionId: string
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) return;

    let fullContent = '';
    let firstTokenReceived = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line.length > 6) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.status === 'streaming_started') {
                // Stream has started successfully
                continue;
              }
              
              if (data.token) {
                // Real-time token streaming
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  onMessageUpdate('', false); // Clear initial message
                }
                
                fullContent = data.content;
                
                setStreamingState(prev => ({
                  ...prev,
                  currentContent: fullContent,
                  isTyping: true,
                  performance: {
                    firstTokenLatency: 0, // Will be updated by edge function
                    tokenCount: data.tokenCount || 0,
                    tokensPerSecond: 0
                  }
                }));
                
                onMessageUpdate(fullContent, false);
              }
              
              if (data.content && !data.token) {
                // Complete response received
                fullContent = data.content;
                
                setStreamingState(prev => ({
                  ...prev,
                  currentContent: fullContent,
                  isStreaming: false,
                  isTyping: false,
                  performance: data.performance ? {
                    firstTokenLatency: data.performance.firstTokenLatency,
                    tokenCount: data.performance.tokenCount,
                    tokensPerSecond: data.performance.tokensPerSecond
                  } : prev.performance
                }));
                
                endSession(sessionId, true);
                onComplete(fullContent);
                return;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignore parse errors for malformed SSE data
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Fallback to Assistants API when Chat Completions fails
  const fallbackToAssistantsAPI = async (
    messages: Message[],
    selectedAgent: string,
    userSession: any,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    onError: (error: string) => void
  ) => {
    console.log('Using fallback Assistants API');
    onMessageUpdate('Connexion de secours...', false);
    
    // Use the old chat-openai-stream function as fallback
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
      // Simulate streaming for better UX
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
            onComplete(content, data.threadId);
          }
        }
      };
      
      revealNextChunk();
    } else {
      throw new Error('Aucune réponse reçue');
    }
  };

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