/**
 * Types de base pour Supabase
 * Définit le type Json fondamental et la structure Database principale
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Structure interne Supabase pour la version PostgreSQL */
export type SupabaseInternals = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
}

// Forward declaration pour éviter les dépendances circulaires
export interface Database extends SupabaseInternals {
  public: {
    Tables: any
    Views: { [_ in never]: never }
    Functions: any
    Enums: any
    CompositeTypes: { [_ in never]: never }
  }
}

/** Type de base sans les internals Supabase */
export type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

/** Schema par défaut (public) */
export type DefaultSchema = DatabaseWithoutInternals["public"]