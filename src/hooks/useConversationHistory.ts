import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';

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

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  const updateConversation = (agentId: string, messages: Message[]) => {
    setConversationHistory(prev => {
      const lastMessage = messages[messages.length - 1];
      return {
        ...prev,
        [agentId]: {
          messages,
          messageCount: messages.length,
          lastMessage: lastMessage?.content.slice(0, 100) + (lastMessage?.content.length > 100 ? '...' : ''),
          lastActivity: new Date()
        }
      };
    });
  };

  const getConversation = (agentId: string) => {
    return conversationHistory[agentId]?.messages || [];
  };

  const getConversationSummary = (agentId: string) => {
    return conversationHistory[agentId] || {
      messages: [],
      messageCount: 0,
      lastActivity: new Date()
    };
  };

  const clearConversation = (agentId: string) => {
    setConversationHistory(prev => {
      const updated = { ...prev };
      delete updated[agentId];
      return updated;
    });
  };

  const getAllAgentsWithHistory = () => {
    return Object.keys(conversationHistory).filter(
      agentId => conversationHistory[agentId].messageCount > 0
    );
  };

  return {
    conversationHistory,
    updateConversation,
    getConversation,
    getConversationSummary,
    clearConversation,
    getAllAgentsWithHistory
  };
}