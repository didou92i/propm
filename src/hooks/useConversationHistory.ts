import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import { usePerformanceOptimization, PERFORMANCE_CONFIG } from './usePerformanceOptimization';

interface ConversationHistory {
  [agentId: string]: {
    messages: Message[];
    messageCount: number;
    lastMessage?: string;
    lastActivity: Date;
  };
}

export function useConversationHistory() {
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory>({});
  const { optimizeMessages, debounce } = usePerformanceOptimization(
    process.env.NODE_ENV === 'production' ? PERFORMANCE_CONFIG.PRODUCTION : PERFORMANCE_CONFIG.DEVELOPMENT
  );

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('conversationHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(agentId => {
          if (parsed[agentId].lastActivity) {
            parsed[agentId].lastActivity = new Date(parsed[agentId].lastActivity);
          }
          if (parsed[agentId].messages) {
            parsed[agentId].messages.forEach((msg: any) => {
              msg.timestamp = new Date(msg.timestamp);
            });
          }
        });
        setConversationHistory(parsed);
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }
  }, []);

  // Save to localStorage whenever history changes (with optimization)
  useEffect(() => {
    const current = JSON.stringify(conversationHistory);
    const stored = localStorage.getItem('conversationHistory');
    if (current !== stored) {
      localStorage.setItem('conversationHistory', current);
    }
  }, [conversationHistory]);

  const updateConversation = useCallback(debounce((agentId: string, messages: Message[]) => {
    setConversationHistory(prev => {
      // Optimize messages for performance
      const optimizedMessages = optimizeMessages(messages);
      const lastMessage = optimizedMessages[optimizedMessages.length - 1];
      
      const newConversation = {
        messages: optimizedMessages,
        messageCount: optimizedMessages.length,
        lastMessage: lastMessage?.content.slice(0, 100) + (lastMessage?.content.length > 100 ? '...' : ''),
        lastActivity: new Date()
      };
      
      // Only update if something actually changed
      const existing = prev[agentId];
      if (existing && existing.messageCount === optimizedMessages.length && 
          JSON.stringify(existing.messages) === JSON.stringify(optimizedMessages)) {
        return prev;
      }
      
      return {
        ...prev,
        [agentId]: newConversation
      };
    });
  }, 300), [optimizeMessages, debounce]);

  const getConversation = useCallback((agentId: string) => {
    return conversationHistory[agentId]?.messages || [];
  }, [conversationHistory]);

  const getConversationSummary = useCallback((agentId: string) => {
    return conversationHistory[agentId] || {
      messages: [],
      messageCount: 0,
      lastActivity: new Date()
    };
  }, [conversationHistory]);

  const clearConversation = useCallback((agentId: string) => {
    setConversationHistory(prev => {
      const updated = { ...prev };
      delete updated[agentId];
      return updated;
    });
  }, []);

  const getAllAgentsWithHistory = useCallback(() => {
    return Object.keys(conversationHistory).filter(
      agentId => conversationHistory[agentId].messageCount > 0
    );
  }, [conversationHistory]);

  return {
    conversationHistory,
    updateConversation,
    getConversation,
    getConversationSummary,
    clearConversation,
    getAllAgentsWithHistory
  };
}