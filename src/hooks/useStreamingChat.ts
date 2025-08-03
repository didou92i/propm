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
  
  const eventSourceRef = useRef<EventSource | null>(null);

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

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create the request body
      const requestBody = JSON.stringify({
        messages,
        selectedAgent,
        userSession
      });

      // Use fetch to POST the data first, then create EventSource for the stream
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-openai-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Create EventSource for the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentContent = '';

      if (!reader) {
        throw new Error('Stream not available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setStreamingState(prev => ({
                    ...prev,
                    status: data.message,
                    progress: data.progress || prev.progress
                  }));
                  break;
                  
                case 'content':
                  currentContent += data.chunk;
                  setStreamingState(prev => ({
                    ...prev,
                    currentContent: currentContent,
                    status: 'Génération...',
                    progress: 95
                  }));
                  onMessageUpdate(currentContent, false);
                  break;
                  
                case 'complete':
                  setStreamingState(prev => ({
                    ...prev,
                    isStreaming: false,
                    status: 'Terminé',
                    progress: 100
                  }));
                  onComplete(data.content, data.threadId);
                  break;
                  
                case 'error':
                  throw new Error(data.message);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      logger.error('Streaming chat error', error, 'useStreamingChat');
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        status: 'Erreur'
      }));
      onError(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreamingState(prev => ({
      ...prev,
      isStreaming: false,
      status: 'Annulé'
    }));
  }, []);

  return {
    streamingState,
    sendStreamingMessage,
    cancelStream
  };
}