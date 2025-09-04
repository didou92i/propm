// Types pour les optimisations de performance

export interface ConversationData {
  messages: import('./chat').Message[];
  timestamp: string;
  lastActivity: string;
}

export interface PerformanceConfig {
  maxMessagesInMemory: number;
  localStorageCleanupThreshold: number;
  autoCleanupInterval: number;
  debounceDelay?: number;
}

export interface HierarchicalSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
  level: 'title' | 'paragraph' | 'document';
  relevanceScore: number;
}

export interface SearchWeights {
  title: number;
  paragraph: number;
  document: number;
}