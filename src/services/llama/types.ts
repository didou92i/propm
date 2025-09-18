// Types pour la recherche sémantique simplifiée - Sans dépendance LlamaIndex
export interface DocumentMetadata {
  id?: string;
  title?: string;
  source?: string;
  type?: string;
  category?: string;
  level?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface SupabaseDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  user_id: string;
}

export interface LlamaSearchResult {
  content: string;
  metadata: DocumentMetadata;
  score: number;
  relevanceScore?: number;
}

export interface LlamaSearchOptions {
  maxResults?: number;
  threshold?: number;
  retrievalStrategy?: 'default' | 'hierarchical' | 'auto_merging';
}

export type RetrievalStrategy = 'default' | 'hierarchical' | 'auto_merging';

// Document simplifié pour l'indexation
export interface LlamaIndexDocument {
  id_: string;
  text: string;
  metadata: DocumentMetadata;
}

// Interface pour l'index manager
export interface IndexManagerInterface {
  initialize(): Promise<{ index: any; queryEngine: any }>;
  addDocument(content: string, metadata: DocumentMetadata): Promise<void>;
  rebuildIndex(): Promise<void>;
}