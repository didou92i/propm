/**
 * Service de gestion des threads OpenAI avec cache et optimisations
 */

import { OpenAIClientService } from './openAIClientService.ts';

export interface ThreadInfo {
  threadId: string;
  conversationId: string;
  isNew: boolean;
}

export interface ConversationData {
  id: string;
  thread_id: string;
  user_session: string;
  agent_type: string;
  user_id: string;
  updated_at: string;
}

export class ThreadManagementService {
  private openAIClient: OpenAIClientService;
  private supabaseClient: any;

  constructor(openAIClient: OpenAIClientService, supabaseClient: any) {
    this.openAIClient = openAIClient;
    this.supabaseClient = supabaseClient;
  }

  /**
   * Obtenir ou créer un thread pour une conversation
   */
  async getOrCreateThread(
    userId: string,
    userSession: string,
    selectedAgent: string
  ): Promise<ThreadInfo> {
    console.log('🔍 Recherche thread existant...');
    
    // Chercher une conversation existante
    const { data: existingConversation, error: convError } = await this.supabaseClient
      .from('conversations')
      .select('id, thread_id')
      .eq('user_session', userSession)
      .eq('agent_type', selectedAgent)
      .eq('user_id', userId)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      throw new Error(`Erreur lors de la recherche de conversation: ${convError.message}`);
    }

    if (existingConversation) {
      console.log(`✓ Thread existant trouvé: ${existingConversation.thread_id}`);
      
      // Annuler les runs actifs sur ce thread
      await this.openAIClient.cancelActiveRuns(existingConversation.thread_id);
      
      // Mettre à jour le timestamp de la conversation
      await this.supabaseClient
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingConversation.id);

      return {
        threadId: existingConversation.thread_id,
        conversationId: existingConversation.id,
        isNew: false
      };
    }

    // Créer un nouveau thread
    console.log('🆕 Création nouveau thread...');
    const threadId = await this.openAIClient.createThread();
    console.log(`✓ Thread créé: ${threadId}`);

    // Créer l'enregistrement de conversation
    const { data: newConversation } = await this.supabaseClient
      .from('conversations')
      .insert({
        thread_id: threadId,
        user_session: userSession,
        agent_type: selectedAgent,
        user_id: userId
      })
      .select('id')
      .single();

    if (!newConversation) {
      throw new Error('Échec de la création de la conversation');
    }

    return {
      threadId,
      conversationId: newConversation.id,
      isNew: true
    };
  }

  /**
   * Stocker un message dans la base de données
   */
  async storeMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    await this.supabaseClient
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      });
  }

  /**
   * Nettoyer les anciens messages d'une conversation
   */
  async cleanupOldMessages(conversationId: string, keepLast: number = 20): Promise<void> {
    try {
      const { data: messageCount } = await this.supabaseClient
        .from('conversation_messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversationId);

      if (messageCount && messageCount.length > keepLast) {
        const { data: oldMessages } = await this.supabaseClient
          .from('conversation_messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true })
          .limit(messageCount.length - keepLast);

        if (oldMessages && oldMessages.length > 0) {
          await this.supabaseClient
            .from('conversation_messages')
            .delete()
            .in('id', oldMessages.map((m: any) => m.id));
          
          console.log(`🧹 Nettoyé ${oldMessages.length} anciens messages`);
        }
      }
    } catch (error) {
      console.warn('Erreur lors du nettoyage des messages:', error);
      // Ne pas faire échouer la requête pour un problème de nettoyage
    }
  }

  /**
   * Obtenir les statistiques d'une conversation
   */
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    lastActivity: string;
    duration: number;
  }> {
    try {
      const { data: messages } = await this.supabaseClient
        .from('conversation_messages')
        .select('timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (!messages || messages.length === 0) {
        return {
          messageCount: 0,
          lastActivity: new Date().toISOString(),
          duration: 0
        };
      }

      const firstMessage = new Date(messages[0].timestamp);
      const lastMessage = new Date(messages[messages.length - 1].timestamp);
      const duration = lastMessage.getTime() - firstMessage.getTime();

      return {
        messageCount: messages.length,
        lastActivity: lastMessage.toISOString(),
        duration: Math.round(duration / 1000) // en secondes
      };
    } catch (error) {
      console.warn('Erreur lors du calcul des stats:', error);
      return {
        messageCount: 0,
        lastActivity: new Date().toISOString(),
        duration: 0
      };
    }
  }

  /**
   * Vérifier la santé d'un thread OpenAI
   */
  async checkThreadHealth(threadId: string): Promise<{ isHealthy: boolean; error?: string }> {
    try {
      // Essayer de récupérer les informations du thread
      const response = await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (response.ok) {
        return { isHealthy: true };
      } else {
        return { 
          isHealthy: false, 
          error: `Thread invalide: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        isHealthy: false, 
        error: `Erreur de vérification: ${error.message}` 
      };
    }
  }

  /**
   * Migrer une conversation vers un nouveau thread si nécessaire
   */
  async migrateConversationIfNeeded(
    conversationId: string,
    currentThreadId: string
  ): Promise<string> {
    const healthCheck = await this.checkThreadHealth(currentThreadId);
    
    if (healthCheck.isHealthy) {
      return currentThreadId;
    }

    console.log(`🚑 Migration nécessaire pour thread ${currentThreadId}: ${healthCheck.error}`);
    
    // Créer un nouveau thread
    const newThreadId = await this.openAIClient.createThread();
    
    // Mettre à jour la conversation
    await this.supabaseClient
      .from('conversations')
      .update({ 
        thread_id: newThreadId,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    console.log(`✓ Conversation migrée vers nouveau thread: ${newThreadId}`);
    
    return newThreadId;
  }

  /**
   * Archiver les conversations anciennes
   */
  async archiveOldConversations(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data: oldConversations } = await this.supabaseClient
        .from('conversations')
        .select('id')
        .lt('updated_at', cutoffDate.toISOString());

      if (!oldConversations || oldConversations.length === 0) {
        return 0;
      }

      // Supprimer les messages associés
      for (const conv of oldConversations) {
        await this.supabaseClient
          .from('conversation_messages')
          .delete()
          .eq('conversation_id', conv.id);
      }

      // Supprimer les conversations
      await this.supabaseClient
        .from('conversations')
        .delete()
        .in('id', oldConversations.map(c => c.id));

      console.log(`🗂️ Archivé ${oldConversations.length} conversations anciennes`);
      
      return oldConversations.length;
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      return 0;
    }
  }
}