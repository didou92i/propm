/**
 * Types pour le domaine des offres d'emploi
 * Incluant job_posts et fonctions associées
 */

import type { JobPostStatus } from '../enums'

/** Table des offres d'emploi */
export interface JobPostsTable {
  Row: {
    author_id: string
    commune: string
    contact: string
    created_at: string
    deadline: string | null
    description: string
    embedding: string | null
    expires_at: string
    id: string
    is_active: boolean
    search_tsv: unknown | null
    skills: string[]
    status: JobPostStatus
    title: string
    updated_at: string
  }
  Insert: {
    author_id: string
    commune: string
    contact: string
    created_at?: string
    deadline?: string | null
    description: string
    embedding?: string | null
    expires_at?: string
    id?: string
    is_active?: boolean
    search_tsv?: unknown | null
    skills?: string[]
    status?: JobPostStatus
    title: string
    updated_at?: string
  }
  Update: {
    author_id?: string
    commune?: string
    contact?: string
    created_at?: string
    deadline?: string | null
    description?: string
    embedding?: string | null
    expires_at?: string
    id?: string
    is_active?: boolean
    search_tsv?: unknown | null
    skills?: string[]
    status?: JobPostStatus
    title?: string
    updated_at?: string
  }
  Relationships: []
}

/** Types consolidés pour le domaine jobs */
export interface JobsDomainTables {
  job_posts: JobPostsTable
}

/** Résultat de recherche d'emploi */
export interface JobSearchResult {
  id: string
  title: string
  commune: string
  description: string
  skills: string[]
  contact: string
  deadline: string
  status: JobPostStatus
  created_at: string
  expires_at: string
  similarity: number
}

/** Filtres de recherche d'emploi */
export interface JobSearchFilters {
  commune?: string | null
  skills?: string[]
  status?: JobPostStatus
  date_range?: 'recent' | 'week' | 'month'
  keywords?: string
  active_only?: boolean
  exclude_expired?: boolean
}

/** Statistiques des offres d'emploi */
export interface JobStatistics {
  total_jobs: number
  active_jobs: number
  pending_jobs: number
  approved_jobs: number
  rejected_jobs: number
  jobs_by_commune: Record<string, number>
  jobs_by_skill: Record<string, number>
  recent_activity: {
    created_today: number
    created_this_week: number
    created_this_month: number
  }
}

/** Types de compétences communes */
export type CommonSkill = 
  | 'droit_administratif'
  | 'police_municipale'
  | 'gestion_publique'
  | 'urbanisme'
  | 'marchés_publics'
  | 'ressources_humaines'
  | 'finances_publiques'
  | 'communication'
  | 'informatique'
  | 'management'

/** Niveaux de poste */
export type JobLevel = 
  | 'debutant'
  | 'confirme'
  | 'expert'
  | 'encadrement'
  | 'direction'