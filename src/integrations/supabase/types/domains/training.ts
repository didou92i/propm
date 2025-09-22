/**
 * Types pour le domaine de la formation et préparation CDS
 * Incluant toutes les tables prepa_cds_*
 */

import type { Json } from '../base'

/** Table des sessions de formation */
export interface PrepaCdsSessionsTable {
  Row: {
    anti_loop_warnings: number | null
    cases_studied: Json | null
    completed_at: string | null
    created_at: string
    documents_analyzed: Json | null
    domain: string
    exercises_proposed: Json | null
    id: string
    level: string
    questions_asked: Json | null
    session_duration: number | null
    session_id: string
    training_type: string
    updated_at: string
    user_id: string | null
  }
  Insert: {
    anti_loop_warnings?: number | null
    cases_studied?: Json | null
    completed_at?: string | null
    created_at?: string
    documents_analyzed?: Json | null
    domain: string
    exercises_proposed?: Json | null
    id?: string
    level: string
    questions_asked?: Json | null
    session_duration?: number | null
    session_id: string
    training_type: string
    updated_at?: string
    user_id?: string | null
  }
  Update: {
    anti_loop_warnings?: number | null
    cases_studied?: Json | null
    completed_at?: string | null
    created_at?: string
    documents_analyzed?: Json | null
    domain?: string
    exercises_proposed?: Json | null
    id?: string
    level?: string
    questions_asked?: Json | null
    session_duration?: number | null
    session_id?: string
    training_type?: string
    updated_at?: string
    user_id?: string | null
  }
  Relationships: []
}

/** Table de l'historique des exercices */
export interface PrepaCdsExerciseHistoryTable {
  Row: {
    content_hash: string
    content_preview: string
    difficulty_level: string
    domain: string
    exercise_type: string
    generated_at: string
    id: string
    session_id: string
    user_id: string | null
    was_alternative: boolean | null
  }
  Insert: {
    content_hash: string
    content_preview: string
    difficulty_level: string
    domain: string
    exercise_type: string
    generated_at?: string
    id?: string
    session_id: string
    user_id?: string | null
    was_alternative?: boolean | null
  }
  Update: {
    content_hash?: string
    content_preview?: string
    difficulty_level?: string
    domain?: string
    exercise_type?: string
    generated_at?: string
    id?: string
    session_id?: string
    user_id?: string | null
    was_alternative?: boolean | null
  }
  Relationships: []
}

/** Table des logs de progression */
export interface PrepaCdsProgressLogsTable {
  Row: {
    created_at: string
    evaluation_score: number | null
    exercise_id: string | null
    feedback_provided: string | null
    id: string
    session_id: string
    time_spent_seconds: number | null
    user_answer: string | null
    user_id: string | null
  }
  Insert: {
    created_at?: string
    evaluation_score?: number | null
    exercise_id?: string | null
    feedback_provided?: string | null
    id?: string
    session_id: string
    time_spent_seconds?: number | null
    user_answer?: string | null
    user_id?: string | null
  }
  Update: {
    created_at?: string
    evaluation_score?: number | null
    exercise_id?: string | null
    feedback_provided?: string | null
    id?: string
    session_id?: string
    time_spent_seconds?: number | null
    user_answer?: string | null
    user_id?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "prepa_cds_progress_logs_exercise_id_fkey"
      columns: ["exercise_id"]
      isOneToOne: false
      referencedRelation: "prepa_cds_exercise_history"
      referencedColumns: ["id"]
    },
  ]
}

/** Types consolidés pour le domaine training */
export interface TrainingDomainTables {
  prepa_cds_sessions: PrepaCdsSessionsTable
  prepa_cds_exercise_history: PrepaCdsExerciseHistoryTable
  prepa_cds_progress_logs: PrepaCdsProgressLogsTable
}

/** Types de formation */
export type TrainingType = 
  | 'qcm' 
  | 'cas_pratique' 
  | 'redaction' 
  | 'oral' 
  | 'simulation'

/** Niveaux d'utilisateur */
export type UserLevel = 
  | 'debutant' 
  | 'intermediaire' 
  | 'avance' 
  | 'expert'

/** Domaines d'étude */
export type StudyDomain = 
  | 'droit_administratif'
  | 'police_municipale'
  | 'securite_publique'
  | 'procedure_penale'
  | 'management'
  | 'ethique_deontologie'
  | 'reglementation'

/** Types d'exercices */
export type ExerciseType = 
  | 'qcm_simple'
  | 'qcm_multiple'
  | 'vrai_faux'
  | 'cas_pratique'
  | 'redaction_libre'
  | 'analyse_document'

/** Niveaux de difficulté */
export type DifficultyLevel = 
  | 'facile'
  | 'moyen'
  | 'difficile'
  | 'expert'

/** Statistiques de session */
export interface SessionStatistics {
  total_sessions: number
  completed_sessions: number
  average_duration: number
  average_score: number
  best_domain: StudyDomain
  improvement_rate: number
}