/**
 * Types pour le domaine des profils et utilisateurs
 * Incluant profiles, user_roles et code_natinf
 */

import type { Json } from '../base'
import type { AppRole } from '../enums'

/** Table des profils utilisateur */
export interface ProfilesTable {
  Row: {
    assistant_configurations: Json | null
    avatar_url: string | null
    created_at: string
    display_name: string | null
    id: string
    updated_at: string
    user_id: string
  }
  Insert: {
    assistant_configurations?: Json | null
    avatar_url?: string | null
    created_at?: string
    display_name?: string | null
    id?: string
    updated_at?: string
    user_id: string
  }
  Update: {
    assistant_configurations?: Json | null
    avatar_url?: string | null
    created_at?: string
    display_name?: string | null
    id?: string
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}

/** Table des rôles utilisateur */
export interface UserRolesTable {
  Row: {
    id: string
    role: AppRole
    user_id: string
  }
  Insert: {
    id?: string
    role: AppRole
    user_id: string
  }
  Update: {
    id?: string
    role?: AppRole
    user_id?: string
  }
  Relationships: []
}

/** Table des codes NATINF */
export interface CodeNatinfTable {
  Row: {
    "Définie par": string | null
    "Nature de linfraction": string | null
    "Numero natinf": number | null
    "Qualification de linfraction": string | null
    "Réprimée par": string | null
  }
  Insert: {
    "Définie par"?: string | null
    "Nature de linfraction"?: string | null
    "Numero natinf"?: number | null
    "Qualification de linfraction"?: string | null
    "Réprimée par"?: string | null
  }
  Update: {
    "Définie par"?: string | null
    "Nature de linfraction"?: string | null
    "Numero natinf"?: number | null
    "Qualification de linfraction"?: string | null
    "Réprimée par"?: string | null
  }
  Relationships: []
}

/** Types consolidés pour le domaine profiles */
export interface ProfilesDomainTables {
  profiles: ProfilesTable
  user_roles: UserRolesTable
  code_natinf: CodeNatinfTable
}

/** Configuration d'assistant */
export interface AssistantConfiguration {
  agent_type: string
  assistant_id?: string
  model?: string
  instructions?: string
  tools?: string[]
  temperature?: number
  max_tokens?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/** Profil utilisateur enrichi */
export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  roles: AppRole[]
  assistant_configurations: AssistantConfiguration[]
  created_at: string
  updated_at: string
  last_activity?: string
  preferences?: {
    theme?: 'light' | 'dark' | 'auto'
    language?: 'fr' | 'en'
    notifications?: boolean
    analytics?: boolean
  }
}

/** Résultat de recherche NATINF */
export interface NatinfSearchResult {
  numero_natinf: number
  nature_infraction: string
  qualification_infraction: string
  definie_par: string
  reprimee_par: string
}

/** Permissions utilisateur */
export interface UserPermissions {
  can_create_jobs: boolean
  can_moderate_content: boolean
  can_access_admin: boolean
  can_manage_users: boolean
  can_view_analytics: boolean
  can_export_data: boolean
}