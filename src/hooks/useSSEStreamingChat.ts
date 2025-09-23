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

/**
 * Hook pour gérer le streaming SSE avec les fonctions chat-completions-*
 * Alternative moderne à useStreamingChat pour les réponses en flux
 */
export function useSSEStreamingChat() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    isTyping: false
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { startSession, endSession } = usePerformanceMonitor();

  const sendStreamingMessage = useCallback(async (
    messages: Message[],
    selectedAgent: string,
    userSession: any,
    onMessageUpdate: (content: string, isComplete: boolean) => void,
    onComplete: (content: string, threadId?: string) => void,
    onError: (error: string) => void
  ) => {
    const sessionId = `sse_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageLength = messages[messages.length - 1]?.content?.length || 0;
    
    startSession(sessionId, messageLength, selectedAgent);
    
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
      onMessageUpdate('L\'assistant génère sa réponse...', false);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session non disponible');
      }

      // Construire l'URL complète pour SSE avec authentification
      const functionUrl = new URL(`https://yulhsufpnjkiozkrgyoq.functions.supabase.co/chat-openai-stream`);
      functionUrl.searchParams.set('auth', session.access_token);
      functionUrl.searchParams.set('agent', selectedAgent);
      
      // Créer EventSource pour SSE (sans headers personnalisés)
      const eventSource = new EventSource(functionUrl.toString());

      let currentContent = '';
      let tokenStartTime = Date.now();
      let tokenCount = 0;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'token') {
            // Token reçu - streaming en cours
            tokenCount++;
            currentContent += data.content;
            
            setStreamingState(prev => ({
              ...prev,
              currentContent,
              isTyping: true,
              performance: {
                firstTokenLatency: tokenCount === 1 ? Date.now() - tokenStartTime : prev.performance?.firstTokenLatency || 0,
                tokenCount,
                tokensPerSecond: tokenCount / ((Date.now() - tokenStartTime) / 1000)
              }
            }));
            
            onMessageUpdate(currentContent, false);
            
          } else if (data.type === 'complete') {
            // Streaming terminé
            eventSource.close();
            
            setStreamingState(prev => ({
              ...prev,
              isStreaming: false,
              isTyping: false
            }));
            
            endSession(sessionId, true);
            onComplete(currentContent, data.threadId);
            
          } else if (data.type === 'error') {
            // Erreur reçue
            eventSource.close();
            throw new Error(data.message || 'Erreur lors du streaming');
          }
        } catch (parseError) {
          logger.error('Error parsing SSE data', parseError, 'useSSEStreamingChat');
          eventSource.close();
          onError('Erreur de format dans la réponse');
        }
      };

      eventSource.onerror = (error) => {
        logger.error('SSE connection error', error, 'useSSEStreamingChat');
        eventSource.close();
        
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          isTyping: false
        }));
        
        endSession(sessionId, false);
        onError('Erreur de connexion lors du streaming');
      };

      // Envoyer les données initiales via paramètres URL (EventSource ne supporte que GET)
      // Les données sont déjà dans l'URL ou seront gérées côté serveur
      // Pas besoin de POST séparé pour EventSource

    } catch (error) {
      endSession(sessionId, false);
      
      if (error.name === 'AbortError') {
        return; // User cancelled, don't show error
      }
      
      logger.error('SSE streaming error', error, 'useSSEStreamingChat');
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        isTyping: false
      }));
      
      onError(error instanceof Error ? error.message : 'Erreur de connexion SSE');
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