/**
 * Types pour le domaine des documents et recherche
 * Incluant documents et fonctions de recherche
 */

import type { Json } from '../base'

/** Table des documents */
export interface DocumentsTable {
  Row: {
    content: string | null
    embedding: string | null
    id: string
    metadata: Json | null
    user_id: string | null
  }
  Insert: {
    content?: string | null
    embedding?: string | null
    id?: string
    metadata?: Json | null
    user_id?: string | null
  }
  Update: {
    content?: string | null
    embedding?: string | null
    id?: string
    metadata?: Json | null
    user_id?: string | null
  }
  Relationships: []
}

/** Types consolidés pour le domaine documents */
export interface DocumentsDomainTables {
  documents: DocumentsTable
}

/** Métadonnées standard pour les documents */
export interface DocumentMetadata {
  title?: string
  source?: string
  category?: string
  timestamp?: string
  type?: 'pdf' | 'text' | 'word' | 'excel' | 'image'
  size?: number
  page_count?: number
  language?: string
  tags?: string[]
  processed_at?: string
  level?: 'title' | 'paragraph' | 'document'
}

/** Résultat de recherche documentaire */
export interface DocumentSearchResult {
  id: string
  content: string
  metadata: Json
  similarity: number
}

/** Résultat de recherche hiérarchique */
export interface HierarchicalSearchResult extends DocumentSearchResult {
  level?: 'title' | 'paragraph' | 'document'
  relevance_score?: number
}

/** Paramètres de recherche */
export interface SearchParameters {
  query_embedding: string
  match_count?: number
  filter?: Json
  level_filter?: string
  similarity_threshold?: number
}

/** Types de documents supportés */
export type DocumentType = 
  | 'legal_text' 
  | 'administrative_doc' 
  | 'training_material' 
  | 'case_study' 
  | 'template' 
  | 'reference'

/** Statuts de traitement des documents */
export type ProcessingStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'error' 
  | 'indexed'