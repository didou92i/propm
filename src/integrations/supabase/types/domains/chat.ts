/**
 * Types pour le domaine de chat et conversations
 * Incluant conversations et conversation_messages
 */

/** Table des conversations */
export interface ConversationsTable {
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

/** Table des messages de conversation */
export interface ConversationMessagesTable {
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

/** Types consolidés pour le domaine chat */
export interface ChatDomainTables {
  conversations: ConversationsTable
  conversation_messages: ConversationMessagesTable
}

/** Types d'agents supportés */
export type AgentType = 
  | 'redacpro' 
  | 'cdspro' 
  | 'arrete' 
  | 'prepacds' 
  | 'azzabi' 
  | 'simulateur'

/** Rôles de message */
export type MessageRole = 'user' | 'assistant' | 'system'

/** Interface simplifiée pour les conversations */
export interface ConversationSummary {
  id: string
  agent_type: AgentType
  created_at: string
  updated_at: string
  message_count?: number
  last_message?: string
}

/** Interface simplifiée pour les messages */
export interface MessageSummary {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  conversation_id: string
}