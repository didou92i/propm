import { VectorStoreIndex, Document } from 'llamaindex';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentMetadata, SupabaseDocument, LlamaIndexDocument, IndexManagerInterface } from '@/types/llama';

export class IndexManager implements IndexManagerInterface {
  private index: VectorStoreIndex | null = null;
  private queryEngine: any = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<{ index: VectorStoreIndex; queryEngine: any }> {
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
      // Create LlamaIndex Document object
      const doc = new Document({
        text: content,
        metadata: {
          id: metadata.id,
          title: metadata.title || 'Sans titre',
          source: metadata.source || 'unknown',
          category: metadata.category || 'general',
          timestamp: metadata.timestamp || new Date().toISOString(),
          type: metadata.type || 'document'
        }
      });
      
      // Add to index
      await this.index!.insertNodes([doc]);
      
      // Clear cache after adding document
      this.clearCache();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de document:', error);
      throw error;
    }
  }

  async rebuildIndex(): Promise<void> {
    console.log('Reconstruction de l\'index LlamaIndex...');
    
    // Reset current state
    this.index = null;
    this.queryEngine = null;
    this.initializationPromise = null;
    
    // Clear cache
    this.clearCache();
    
    // Reinitialize
    await this.initialize();
  }

  getIndex(): VectorStoreIndex | null {
    return this.index;
  }

  getQueryEngine(): any {
    return this.queryEngine;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Initialisation de LlamaIndex...');
      
      // Récupérer les documents depuis Supabase
      const documents = await this.fetchDocumentsFromSupabase();
      console.log(`${documents.length} documents récupérés`);

      if (documents.length === 0) {
        console.warn('Aucun document trouvé, création d\'un index vide');
        // Create empty index
        this.index = await VectorStoreIndex.fromDocuments([]);
        this.queryEngine = this.index.asQueryEngine();
        return;
      }

      // Créer l'index vectoriel
      this.index = await VectorStoreIndex.fromDocuments(documents);
      this.queryEngine = this.index.asQueryEngine();
      
      console.log('Index LlamaIndex initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de LlamaIndex:', error);
      
      // Fallback: créer un index vide
      try {
        console.log('Tentative de création d\'un index vide comme fallback...');
        this.index = await VectorStoreIndex.fromDocuments([]);
        this.queryEngine = this.index.asQueryEngine();
        console.log('Index vide créé avec succès');
      } catch (fallbackError) {
        console.error('Impossible de créer même un index vide:', fallbackError);
        throw new Error('Échec complet de l\'initialisation de LlamaIndex');
      }
    }
  }

  private async fetchDocumentsFromSupabase(): Promise<LlamaIndexDocument[]> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Erreur Supabase:', error);
        return [];
      }

      if (!documents || documents.length === 0) {
        return [];
      }

      // Convert to proper LlamaIndex Document objects
      const llamaDocuments: LlamaIndexDocument[] = documents.map((doc: SupabaseDocument) => {
        const metadata = doc.metadata as any || {};
        return new Document({
          text: doc.content || '',
          metadata: {
            id: doc.id,
            title: metadata.title || 'Sans titre',
            source: metadata.source || 'unknown',
            category: metadata.category || 'general',
            timestamp: new Date().toISOString(),
            type: metadata.type || 'document'
          }
        });
      });

      return llamaDocuments;
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      return [];
    }
  }

  private clearCache(): void {
    // Clear any caching mechanism if implemented
    console.log('Cache cleared');
  }
}