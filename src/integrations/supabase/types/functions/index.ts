/**
 * Types pour toutes les fonctions Supabase
 * Organisées par catégorie fonctionnelle
 */

import type { Json } from '../base'
import type { AppRole, JobPostStatus } from '../enums'

/** Fonctions de sécurité et monitoring */
export interface SecurityFunctions {
  auto_update_extensions: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  generate_security_report: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  get_security_monitoring_data: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  get_security_status: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  optimize_security_settings: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  run_security_diagnostics: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  update_database_extensions: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
}

/** Fonctions de recherche et documents */
export interface SearchFunctions {
  match_documents: {
    Args: { 
      filter?: Json
      match_count?: number
      query_embedding: string 
    }
    Returns: {
      content: string
      id: string
      metadata: Json
      similarity: number
    }[]
  }
  match_documents_hierarchical: {
    Args: {
      level_filter?: string
      match_count?: number
      query_embedding: string
    }
    Returns: {
      content: string
      id: string
      metadata: Json
      similarity: number
    }[]
  }
  match_job_posts: {
    Args: { 
      match_count?: number
      query_embedding: string 
    }
    Returns: {
      commune: string
      contact: string
      created_at: string
      deadline: string
      description: string
      expires_at: string
      id: string
      similarity: number
      skills: string[]
      status: JobPostStatus
      title: string
    }[]
  }
}

/** Fonctions utilitaires système */
export interface UtilityFunctions {
  cleanup_old_conversations: {
    Args: Record<PropertyKey, never>
    Returns: undefined
  }
  cleanup_old_data: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  cleanup_expired_job_posts: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
  get_system_stats: {
    Args: Record<PropertyKey, never>
    Returns: Json
  }
}

/** Fonctions d'authentification et autorisation */
export interface AuthFunctions {
  has_role: {
    Args: {
      _role: AppRole
      _user_id: string
    }
    Returns: boolean
  }
  is_admin: {
    Args: Record<PropertyKey, never>
    Returns: boolean
  }
  log_audit_action: {
    Args: {
      p_action: string
      p_new_values?: Json
      p_old_values?: Json
      p_record_id?: string
      p_table_name?: string
    }
    Returns: string
  }
}

/** Fonctions spécialisées pour la formation */
export interface TrainingFunctions {
  check_exercise_duplicate: {
    Args: {
      p_content_hash: string
      p_exercise_type: string
      p_session_id: string
    }
    Returns: boolean
  }
}

/** Fonctions pour les codes NATINF */
export interface NatinfFunctions {
  rechercher_code_natinf: {
    Args: { code_recherche: number } | { code_recherche: string }
    Returns: Json
  }
  rechercher_code_natinf_text: {
    Args: { code_recherche: string }
    Returns: Json
  }
}

/** Toutes les fonctions consolidées */
export interface DatabaseFunctions extends 
  SecurityFunctions,
  SearchFunctions,
  UtilityFunctions,
  AuthFunctions,
  TrainingFunctions,
  NatinfFunctions {}

/** Type helper pour extraire les arguments d'une fonction */
export type FunctionArgs<T extends keyof DatabaseFunctions> = DatabaseFunctions[T]['Args']

/** Type helper pour extraire le retour d'une fonction */
export type FunctionReturns<T extends keyof DatabaseFunctions> = DatabaseFunctions[T]['Returns']