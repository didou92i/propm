export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  threadId?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens: number;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}