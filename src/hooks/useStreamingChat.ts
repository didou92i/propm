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

      // Immediate feedback
      onMessageUpdate('L\'assistant réfléchit...', false);

      // Use streaming endpoint with loop detection
      const loopDetected = messages.filter(m => m.content === messages[messages.length - 1].content).length > 2;
      let storedThreadId: string | null = null;
      try {
        storedThreadId = localStorage.getItem(`openai.thread.${selectedAgent}`) || localStorage.getItem(`threadId_${selectedAgent}`);
      } catch {}
      const effectiveThreadId = loopDetected ? undefined : (userSession?.threadId ?? storedThreadId ?? undefined);

      // Try SSE streaming first
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/chat-openai-stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            messages,
            selectedAgent,
            userSession: {
              ...(typeof userSession === 'object' ? userSession : { id: String(userSession || '') }),
              threadId: effectiveThreadId
            }
          }),
          signal: abortControllerRef.current.signal
        });

        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          await handleSSEStream(response, onMessageUpdate, onComplete, selectedAgent);
          return;
        }
      } catch (sseError) {
        console.log('SSE failed, falling back to regular streaming:', sseError);
      }

      // Fallback to regular API with ultra-fast simulated streaming
      const { data, error } = await supabase.functions.invoke('chat-openai-stream', {
        body: {
          messages,
          selectedAgent,
          userSession: {
            ...(typeof userSession === 'object' ? userSession : { id: String(userSession || '') }),
            threadId: effectiveThreadId
          }
        }
      });

      if (error) {
        throw new Error(`Erreur: ${error.message}`);
      }

      // Handle streaming response with ultra-fast reveal
      if (data && data.content) {
        const content = data.content;
        let currentIndex = 0;
        
        const revealNextChunk = () => {
          if (currentIndex < content.length && !abortControllerRef.current?.signal.aborted) {
            // Ultra-fast streaming: 3-6 characters at a time
            const chunkSize = Math.floor(Math.random() * 4) + 3;
            const nextChunk = content.slice(0, currentIndex + chunkSize);
            currentIndex += chunkSize;
            
            setStreamingState(prev => ({
              ...prev,
              currentContent: nextChunk,
              isTyping: currentIndex < content.length
            }));
            
            onMessageUpdate(nextChunk, currentIndex >= content.length);
            
            if (currentIndex < content.length) {
              // Ultra-fast: 1-3ms per character
              const delay = Math.random() * 2 + 1;
              setTimeout(revealNextChunk, delay);
            } else {
              // Finished streaming
              setStreamingState(prev => ({
                ...prev,
                isStreaming: false,
                isTyping: false
              }));
              try {
                if (data.threadId) {
                  localStorage.setItem(`openai.thread.${selectedAgent}`, data.threadId);
                }
              } catch {}
              onComplete(content, data.threadId);
            }
          }
        };
        
        // Start immediately
        revealNextChunk();
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

  // Handle Server-Sent Events streaming
  const handleSSEStream = async (
    response: Response,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    selectedAgent: string
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) return;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.status) {
                // Status update
                onMessageUpdate(data.message || 'Traitement...', false);
              } else if (data.content) {
                // Complete response
                setStreamingState(prev => ({
                  ...prev,
                  isStreaming: false,
                  isTyping: false
                }));
                
                if (data.threadId) {
                  try {
                    localStorage.setItem(`openai.thread.${selectedAgent}`, data.threadId);
                  } catch {}
                }
                
                onComplete(data.content, data.threadId);
                return;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignore parse errors for SSE format lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
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