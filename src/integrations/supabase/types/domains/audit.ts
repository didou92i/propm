/**
 * Types pour le domaine d'audit et de conformité
 * Incluant audit_logs, consent_logs et gdpr_requests
 */

import type { Json } from '../base'

/** Table des logs d'audit */
export interface AuditLogsTable {
  Row: {
    action: string
    created_at: string
    id: string
    ip_address: unknown | null
    new_values: Json | null
    old_values: Json | null
    record_id: string | null
    table_name: string | null
    user_agent: string | null
    user_id: string | null
  }
  Insert: {
    action: string
    created_at?: string
    id?: string
    ip_address?: unknown | null
    new_values?: Json | null
    old_values?: Json | null
    record_id?: string | null
    table_name?: string | null
    user_agent?: string | null
    user_id?: string | null
  }
  Update: {
    action?: string
    created_at?: string
    id?: string
    ip_address?: unknown | null
    new_values?: Json | null
    old_values?: Json | null
    record_id?: string | null
    table_name?: string | null
    user_agent?: string | null
    user_id?: string | null
  }
  Relationships: []
}

/** Table des logs de consentement */
export interface ConsentLogsTable {
  Row: {
    consent_type: string
    created_at: string
    id: string
    ip_address: unknown | null
    preferences: Json
    user_agent: string | null
    user_id: string | null
  }
  Insert: {
    consent_type: string
    created_at?: string
    id?: string
    ip_address?: unknown | null
    preferences: Json
    user_agent?: string | null
    user_id?: string | null
  }
  Update: {
    consent_type?: string
    created_at?: string
    id?: string
    ip_address?: unknown | null
    preferences?: Json
    user_agent?: string | null
    user_id?: string | null
  }
  Relationships: []
}

/** Table des requêtes GDPR */
export interface GdprRequestsTable {
  Row: {
    completed_at: string | null
    created_at: string
    id: string
    reason: string | null
    request_type: string
    response_data: Json | null
    status: string
    updated_at: string
    user_id: string | null
  }
  Insert: {
    completed_at?: string | null
    created_at?: string
    id?: string
    reason?: string | null
    request_type: string
    response_data?: Json | null
    status?: string
    updated_at?: string
    user_id?: string | null
  }
  Update: {
    completed_at?: string | null
    created_at?: string
    id?: string
    reason?: string | null
    request_type?: string
    response_data?: Json | null
    status?: string
    updated_at?: string
    user_id?: string | null
  }
  Relationships: []
}

/** Types consolidés pour le domaine audit */
export interface AuditDomainTables {
  audit_logs: AuditLogsTable
  consent_logs: ConsentLogsTable
  gdpr_requests: GdprRequestsTable
}

/** Types d'actions d'audit communes */
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ACCESS' 
  | 'NATINF_ACCESS'

/** Types de requêtes GDPR */
export type GdprRequestType = 
  | 'data_export' 
  | 'data_deletion' 
  | 'data_correction' 
  | 'consent_withdrawal'

/** Types de consentement */
export type ConsentType = 
  | 'cookies' 
  | 'analytics' 
  | 'marketing' 
  | 'functional'