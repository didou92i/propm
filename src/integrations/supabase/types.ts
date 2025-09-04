export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
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
      code_natinf: {
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
      consent_logs: {
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
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          id: string
          role: string
          timestamp: string
        }
        Insert: {
          content: string
          conversation_id: string
          id?: string
          role: string
          timestamp?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          id?: string
          role?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_type: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
          user_id: string | null
          user_session: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
          user_id?: string | null
          user_session: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string | null
          user_session?: string
        }
        Relationships: []
      }
      documents: {
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
      gdpr_requests: {
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
      job_posts: {
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
          status: Database["public"]["Enums"]["job_post_status"]
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
          status?: Database["public"]["Enums"]["job_post_status"]
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
          status?: Database["public"]["Enums"]["job_post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prepa_cds_exercise_history: {
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
      prepa_cds_progress_logs: {
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
      prepa_cds_sessions: {
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_exercise_duplicate: {
        Args: {
          p_content_hash: string
          p_exercise_type: string
          p_session_id: string
        }
        Returns: boolean
      }
      cleanup_expired_job_posts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_old_conversations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
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
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
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
        Args: { match_count?: number; query_embedding: string }
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
          status: Database["public"]["Enums"]["job_post_status"]
          title: string
        }[]
      }
      rechercher_code_natinf: {
        Args: { code_recherche: number } | { code_recherche: string }
        Returns: Json
      }
      rechercher_code_natinf_text: {
        Args: { code_recherche: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      job_post_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      job_post_status: ["pending", "approved", "rejected"],
    },
  },
} as const
