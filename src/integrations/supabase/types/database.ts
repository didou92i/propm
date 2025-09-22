/**
 * Structure principale de la base de données Supabase
 * Assemble tous les domaines en une structure cohérente
 */

import type { SupabaseInternals } from './base'
import type { DatabaseEnums } from './enums'
import type { DatabaseFunctions } from './functions'
import type { AuditDomainTables } from './domains/audit'
import type { ChatDomainTables } from './domains/chat'
import type { DocumentsDomainTables } from './domains/documents'
import type { JobsDomainTables } from './domains/jobs'
import type { TrainingDomainTables } from './domains/training'
import type { ProfilesDomainTables } from './domains/profiles'

/** Structure complète de la base de données */
export interface Database extends SupabaseInternals {
  public: {
    Tables: AuditDomainTables & 
             ChatDomainTables & 
             DocumentsDomainTables & 
             JobsDomainTables & 
             TrainingDomainTables & 
             ProfilesDomainTables
    Views: {
      [_ in never]: never
    }
    Functions: DatabaseFunctions
    Enums: DatabaseEnums
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/** Export du type Database principal pour compatibilité */
export type { Database as default }

/** Helpers pour accéder aux domaines spécifiques */
export type AuditTables = AuditDomainTables
export type ChatTables = ChatDomainTables
export type DocumentsTables = DocumentsDomainTables
export type JobsTables = JobsDomainTables
export type TrainingTables = TrainingDomainTables
export type ProfilesTables = ProfilesDomainTables

/** Type pour toutes les tables */
export type AllTables = Database['public']['Tables']

/** Type pour toutes les fonctions */
export type AllFunctions = Database['public']['Functions']

/** Type pour toutes les énumérations */
export type AllEnums = Database['public']['Enums']