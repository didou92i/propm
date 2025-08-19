export interface LlamaSearchResult {
  content: string;
  metadata: {
    title?: string;
    source?: string;
    type?: string;
    timestamp?: string;
    level?: number;
    category?: string;
  };
  score: number;
  relevanceScore?: number;
}

export interface LlamaSearchOptions {
  maxResults?: number;
  threshold?: number;
  retrievalStrategy?: 'default' | 'hierarchical' | 'auto_merging';
}

export type RetrievalStrategy = 'default' | 'hierarchical' | 'auto_merging';