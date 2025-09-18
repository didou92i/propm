import { supabase } from '@/integrations/supabase/client';
import type { DocumentMetadata, SupabaseDocument, LlamaIndexDocument, IndexManagerInterface } from './types';

export class IndexManager implements IndexManagerInterface {
  private index: any = null;
  private queryEngine: any = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<{ index: any; queryEngine: any }> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      return { index: this.index!, queryEngine: this.queryEngine! };
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    
    return { index: this.index!, queryEngine: this.queryEngine! };
  }

  async addDocument(content: string, metadata: DocumentMetadata): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      // Ajouter document directement via Supabase
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('documents')
        .insert({
          content,
          metadata: metadata as any, // Cast pour compatibilité JSON
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('Document ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de document:', error);
      throw error;
    }
  }

  async rebuildIndex(): Promise<void> {
    console.log('Reconstruction de l\'index simplifié...');
    
    // Reset current state
    this.index = null;
    this.queryEngine = null;
    this.initializationPromise = null;
    
    // Reinitialize
    await this.initialize();
  }

  getIndex(): any {
    return this.index;
  }

  getQueryEngine(): any {
    return this.queryEngine;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Initialisation de l\'index simplifié...');
      
      // Index simplifié basé sur Supabase uniquement
      this.index = { 
        initialized: true,
        documentCount: await this.getDocumentCount()
      };
      
      this.queryEngine = { 
        search: async (query: string) => {
          return await this.searchInSupabase(query);
        }
      };

      console.log('Index simplifié initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      
      // Fallback: créer un index vide
      this.index = { initialized: true, documentCount: 0 };
      this.queryEngine = { 
        search: async () => [] 
      };
      
      console.log('Index vide créé avec succès');
    }
  }

  private async getDocumentCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage des documents:', error);
      return 0;
    }
  }

  private async searchInSupabase(query: string): Promise<LlamaIndexDocument[]> {
    try {
      // Recherche simple basée sur du texte
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('content', `%${query}%`)
        .limit(10);

      if (error) throw error;

      return documents?.map((doc: any) => ({
        id_: doc.id,
        text: doc.content,
        metadata: (doc.metadata as DocumentMetadata) || {}
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }
}