import { VectorStoreIndex, Document, StorageContext } from 'llamaindex';
import { supabase } from '@/integrations/supabase/client';

interface DocumentMetadata {
  node_id?: string;
  doc_id?: string;
  level?: string;
  indexed_at?: string;
  [key: string]: any;
}

interface DocumentNode {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
}

/**
 * Service to integrate LlamaIndex with Supabase Vector Store
 * Provides methods to add documents and perform semantic search using Supabase's pgvector
 */
export class SupabaseVectorStoreService {
  /**
   * Add documents to the Supabase vector store with embeddings
   */
  async addDocuments(documents: Array<{ text: string; metadata?: DocumentMetadata }>): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const inserts = await Promise.all(
        documents.map(async (doc) => {
          // Generate embedding for the document
          const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
            'generate-embedding',
            {
              body: { text: doc.text }
            }
          );

          if (embeddingError) {
            console.error('Error generating embedding:', embeddingError);
            throw embeddingError;
          }

          return {
            content: doc.text,
            embedding: embeddingData.embedding,
            metadata: {
              ...doc.metadata,
              level: 'document',
              indexed_at: new Date().toISOString(),
              indexed_by: 'llamaindex'
            },
            user_id: user.id
          };
        })
      );

      // Insert into Supabase using the optimized index
      const { data, error } = await supabase
        .from('documents')
        .insert(inserts)
        .select('id');

      if (error) {
        console.error('Error inserting documents:', error);
        throw error;
      }

      console.log(`✅ Added ${documents.length} documents to Supabase vector store with HNSW index`);
      return data?.map(d => d.id) || [];
    } catch (error) {
      console.error('Error in SupabaseVectorStoreService.addDocuments:', error);
      throw error;
    }
  }

  /**
   * Query the Supabase vector store using semantic search (uses optimized HNSW index)
   */
  async query(queryText: string, topK: number = 10, filter?: Record<string, any>): Promise<DocumentNode[]> {
    try {
      // Generate embedding for the query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        'generate-embedding',
        {
          body: { text: queryText }
        }
      );

      if (embeddingError) {
        console.error('Error generating query embedding:', embeddingError);
        throw embeddingError;
      }

      const queryEmbedding = embeddingData.embedding;

      // Use match_documents RPC function (now optimized with HNSW index and enable_seqscan=off)
      const { data: results, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_count: topK,
        filter: filter || {}
      });

      if (searchError) {
        console.error('Error querying documents:', searchError);
        throw searchError;
      }

      console.log(`🔍 Supabase query returned ${results?.length || 0} results using HNSW index`);

      return (results || []).map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        similarity: result.similarity
      }));
    } catch (error) {
      console.error('Error in SupabaseVectorStoreService.query:', error);
      return [];
    }
  }

  /**
   * Delete documents from the vector store by doc_id
   */
  async deleteByDocId(docId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('metadata->>doc_id', docId);

      if (error) {
        console.error('Error deleting document:', error);
        throw error;
      }

      console.log(`🗑️ Deleted document ${docId} from Supabase vector store`);
    } catch (error) {
      console.error('Error in SupabaseVectorStoreService.deleteByDocId:', error);
      throw error;
    }
  }

  /**
   * Clear all LlamaIndex-indexed documents for the current user
   */
  async clear(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', user.id)
        .eq('metadata->>indexed_by', 'llamaindex');

      if (error) {
        console.error('Error clearing documents:', error);
        throw error;
      }

      console.log('🗑️ Cleared all LlamaIndex documents from Supabase vector store');
    } catch (error) {
      console.error('Error in SupabaseVectorStoreService.clear:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<{
    totalDocuments: number;
    indexedByLlama: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { totalDocuments: 0, indexedByLlama: 0 };
      }

      const { count: total } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: llama } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('metadata->>indexed_by', 'llamaindex');

      return {
        totalDocuments: total || 0,
        indexedByLlama: llama || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalDocuments: 0, indexedByLlama: 0 };
    }
  }
}

// Export singleton instance
export const supabaseVectorStore = new SupabaseVectorStoreService();
