// Types pour LlamaIndex et l'indexation
import type { Document as LlamaDocument } from 'llamaindex';
import type { Json } from '@/integrations/supabase/types';

export interface DocumentMetadata {
  id: string;
  title?: string;
  source?: string;
  category?: string;
  timestamp?: string;
  type?: string;
}

export interface SupabaseDocument {
  id: string;
  content: string | null;
  embedding: string | null;
  metadata: Json | null;
  user_id: string | null;
}

export type LlamaIndexDocument = LlamaDocument;

export interface IndexManagerInterface {
  initialize(): Promise<{ index: any; queryEngine: any }>;
  addDocument(content: string, metadata: DocumentMetadata): Promise<void>;
  rebuildIndex(): Promise<void>;
  getIndex(): any;
  getQueryEngine(): any;
}