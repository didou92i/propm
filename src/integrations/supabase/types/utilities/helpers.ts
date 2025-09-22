/**
 * Helpers et utilitaires pour simplifier l'usage des types Supabase
 * Fonctions d'aide pour le développement quotidien
 */

import type { Database } from '../database'
import type { Tables, TablesInsert, TablesUpdate } from './tables'

/** Helper pour créer des payloads d'insertion type-safe */
export type CreatePayload<T extends keyof Database['public']['Tables']> = TablesInsert<T>

/** Helper pour créer des payloads de mise à jour type-safe */
export type UpdatePayload<T extends keyof Database['public']['Tables']> = TablesUpdate<T>

/** Helper pour les données de réponse type-safe */
export type ResponseData<T extends keyof Database['public']['Tables']> = Tables<T>

/** Type pour les filtres de requête générique */
export type QueryFilter<T extends keyof Database['public']['Tables']> = Partial<Tables<T>>

/** Type pour les options de tri */
export interface SortOptions<T extends keyof Database['public']['Tables']> {
  column: keyof Tables<T>
  ascending?: boolean
}

/** Type pour les options de pagination */
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

/** Options de requête combinées */
export interface QueryOptions<T extends keyof Database['public']['Tables']> {
  filter?: QueryFilter<T>
  sort?: SortOptions<T>
  pagination?: PaginationOptions
  select?: string
}

/** Response standard pour les APIs */
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
  count?: number
  page?: number
  total_pages?: number
}

/** Response pour les listes paginées */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
    has_next: boolean
    has_previous: boolean
  }
}

/** Helper pour extraire les IDs de table */
export type TableId<T extends keyof Database['public']['Tables']> = 
  Tables<T> extends { id: infer ID } ? ID : never

/** Helper pour extraire les foreign keys */
export type ForeignKey<
  T extends keyof Database['public']['Tables'],
  K extends keyof Tables<T>
> = Tables<T>[K] extends string ? K : never

/** Helper pour les timestamps */
export interface TimestampFields {
  created_at: string
  updated_at: string
}

/** Helper pour les champs d'audit */
export interface AuditFields extends TimestampFields {
  user_id: string | null
}

/** Type pour les métadonnées JSON structurées */
export interface StructuredMetadata {
  [key: string]: string | number | boolean | null | StructuredMetadata | StructuredMetadata[]
}

/** Helper pour les requêtes avec embedding */
export interface EmbeddingQuery {
  query_embedding: string
  match_count?: number
  similarity_threshold?: number
}

/** Response pour les résultats de recherche */
export interface SearchResponse<T = any> {
  results: T[]
  query: string
  total_results: number
  search_time_ms: number
  suggestions?: string[]
}

/** Utilitaires pour le cache */
export interface CacheOptions {
  ttl?: number // Time to live en secondes
  key?: string
  tags?: string[]
}

/** Types pour les webhooks */
export interface WebhookPayload<T = any> {
  event: string
  data: T
  timestamp: string
  user_id?: string
}

/** Helper pour les validations */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Helper pour les champs optionnels */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Type guards helpers */
export const isValidId = (id: any): id is string => {
  return typeof id === 'string' && id.length > 0
}

export const hasTimestamps = (obj: any): obj is TimestampFields => {
  return obj && typeof obj.created_at === 'string' && typeof obj.updated_at === 'string'
}

export const hasAuditFields = (obj: any): obj is AuditFields => {
  return hasTimestamps(obj) && 'user_id' in obj && (obj.user_id === null || typeof obj.user_id === 'string')
}