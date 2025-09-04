import { useEffect, useCallback, useRef } from 'react';
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';

interface PerformanceConfig {
  maxMessagesInMemory: number;
  localStorageCleanupThreshold: number;
  autoCleanupInterval: number;
}

export function usePerformanceOptimization(config: PerformanceConfig = {
  maxMessagesInMemory: 50,
  localStorageCleanupThreshold: 1000,
  autoCleanupInterval: 30 * 60 * 1000 // 30 minutes
}) {
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Optimize message list for performance
  const optimizeMessages = useCallback((messages: Message[]): Message[] => {
    if (messages.length <= config.maxMessagesInMemory) {
      return messages;
    }
    
    // Keep last N messages for performance
    return messages.slice(-config.maxMessagesInMemory);
  }, [config.maxMessagesInMemory]);

  // Clean localStorage of old conversation data
  const cleanupLocalStorage = useCallback(() => {
    try {
      const conversationHistory = localStorage.getItem('conversationHistory');
      if (!conversationHistory) return;

      const parsed = JSON.parse(conversationHistory);
      const cutoffDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      let hasChanges = false;

      // Remove conversations older than 2 days
      Object.keys(parsed).forEach(agentId => {
        const conversation = parsed[agentId];
        if (conversation.lastActivity && new Date(conversation.lastActivity) < cutoffDate) {
          delete parsed[agentId];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem('conversationHistory', JSON.stringify(parsed));
        
      }

      // Clean up other potential large localStorage items
      const keys = Object.keys(localStorage);
      if (keys.length > config.localStorageCleanupThreshold) {
        keys.forEach(key => {
          if (key.startsWith('temp_') || key.startsWith('cache_')) {
            try {
              const item = localStorage.getItem(key);
              if (item) {
                const data = JSON.parse(item);
                if (data.timestamp && new Date(data.timestamp) < cutoffDate) {
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {
              // Remove invalid items
              localStorage.removeItem(key);
            }
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to cleanup localStorage', error, 'usePerformanceOptimization');
    }
  }, [config.localStorageCleanupThreshold]);

  // Memory optimization for components
  const optimizeComponentMemory = useCallback(() => {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear any cached DOM references
    if ((performance as any).memory) {
      const memInfo = (performance as any).memory;
      // Memory info available for debugging if needed
    }
  }, []);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Performance monitoring
  const measurePerformance = useCallback((label: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    // Performance measurement completed
  }, []);

  // Setup automatic cleanup
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      cleanupLocalStorage();
      optimizeComponentMemory();
    }, config.autoCleanupInterval);

    // Initial cleanup
    cleanupLocalStorage();

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [config.autoCleanupInterval, cleanupLocalStorage, optimizeComponentMemory]);

  return {
    optimizeMessages,
    cleanupLocalStorage,
    optimizeComponentMemory,
    debounce,
    measurePerformance
  };
}

// Global performance configuration
export const PERFORMANCE_CONFIG = {
  PRODUCTION: {
    maxMessagesInMemory: 30,
    localStorageCleanupThreshold: 500,
    autoCleanupInterval: 15 * 60 * 1000, // 15 minutes
    debounceDelay: 300
  },
  DEVELOPMENT: {
    maxMessagesInMemory: 50,
    localStorageCleanupThreshold: 1000,
    autoCleanupInterval: 30 * 60 * 1000, // 30 minutes
    debounceDelay: 150
  }
};
