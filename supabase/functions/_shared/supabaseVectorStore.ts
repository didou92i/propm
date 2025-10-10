import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

interface DocumentMetadata {
  filename?: string;
  filesize?: number;
  filetype?: string;
  processed_at?: string;
  chunk_index?: number;
  total_chunks?: number;
  extraction_method?: string;
  indexed_by?: string;
  level?: string;
  indexed_at?: string;
  [key: string]: any;
}

interface EmbeddingDocument {
  text: string;
  metadata?: DocumentMetadata;
}

/**
 * Supabase Vector Store Service for Deno Edge Functions
 * Integrates with HNSW-optimized pgvector index
 */
export class SupabaseVectorStoreService {
  private supabase: SupabaseClient;
  private openAIApiKey: string;

  constructor(supabase: SupabaseClient, openAIApiKey: string) {
    this.supabase = supabase;
    this.openAIApiKey = openAIApiKey;
  }

  /**
   * Add documents to the Supabase vector store with embeddings
   * Uses OpenAI embeddings and HNSW index for optimal performance
   */
  async addDocuments(documents: EmbeddingDocument[]): Promise<string[]> {
    try {
      console.log(`📥 [VectorStore] Processing ${documents.length} documents...`);

      // Generate embeddings for all documents
      const inserts = await Promise.all(
        documents.map(async (doc, index) => {
          console.log(`🔄 [VectorStore] Generating embedding ${index + 1}/${documents.length}`);
          
          // Generate embedding via OpenAI
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: doc.text,
            }),
          });

          if (!embeddingResponse.ok) {
            const errorText = await embeddingResponse.text();
            console.error(`❌ [VectorStore] Embedding error for document ${index + 1}:`, errorText);
            throw new Error(`Embedding generation failed: ${embeddingResponse.status}`);
          }

          const embeddingResult = await embeddingResponse.json();
          const embedding = embeddingResult.data[0]?.embedding;

          if (!embedding || !Array.isArray(embedding)) {
            throw new Error(`Invalid embedding received for document ${index + 1}`);
          }

          // Get current user for user_id
          const { data: { user } } = await this.supabase.auth.getUser();
          
          return {
            content: doc.text,
            embedding: embedding,
            metadata: {
              ...doc.metadata,
              level: 'document',
              indexed_at: new Date().toISOString(),
              indexed_by: 'llamaindex'
            },
            user_id: user?.id
          };
        })
      );

      console.log(`💾 [VectorStore] Inserting ${inserts.length} documents with HNSW index...`);

      // Insert into Supabase with optimized HNSW index
      const { data, error } = await this.supabase
        .from('documents')
        .insert(inserts)
        .select('id');

      if (error) {
        console.error('❌ [VectorStore] Database insert error:', error);
        throw error;
      }

      const documentIds = data?.map(d => d.id) || [];
      console.log(`✅ [VectorStore] Successfully indexed ${documentIds.length} documents with HNSW`);
      
      return documentIds;
    } catch (error) {
      console.error('❌ [VectorStore] Error in addDocuments:', error);
      throw error;
    }
  }

  /**
   * Query the vector store using semantic search
   * Leverages HNSW index for fast approximate nearest neighbor search
   */
  async query(
    queryText: string, 
    topK: number = 10, 
    filter?: Record<string, any>
  ): Promise<any[]> {
    try {
      console.log(`🔍 [VectorStore] Searching for: "${queryText.substring(0, 50)}..."`);

      // Generate embedding for query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: queryText,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Query embedding generation failed: ${embeddingResponse.status}`);
      }

      const embeddingResult = await embeddingResponse.json();
      const queryEmbedding = embeddingResult.data[0]?.embedding;

      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Use optimized match_documents RPC function with HNSW index
      const { data: results, error: searchError } = await this.supabase.rpc('match_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_count: topK,
        filter: filter || {}
      });

      if (searchError) {
        console.error('❌ [VectorStore] Search error:', searchError);
        throw searchError;
      }

      console.log(`✅ [VectorStore] Found ${results?.length || 0} results using HNSW index`);
      return results || [];
    } catch (error) {
      console.error('❌ [VectorStore] Error in query:', error);
      return [];
    }
  }

  /**
   * Get statistics about indexed documents
   */
  async getStats(): Promise<{ totalDocuments: number; indexedByLlama: number }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { totalDocuments: 0, indexedByLlama: 0 };
      }

      const { count: total } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: llama } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('metadata->>indexed_by', 'llamaindex');

      return {
        totalDocuments: total || 0,
        indexedByLlama: llama || 0
      };
    } catch (error) {
      console.error('❌ [VectorStore] Error getting stats:', error);
      return { totalDocuments: 0, indexedByLlama: 0 };
    }
  }
}
