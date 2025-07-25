import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { 
      query_embedding, 
      match_count = 5, 
      level_filter = 'document',
      threshold = 0.3
    } = await req.json();

    // Parse the embedding array
    const queryVector = typeof query_embedding === 'string' 
      ? JSON.parse(query_embedding) 
      : query_embedding;

    // Perform hierarchical search based on level
    let searchQuery;
    
    switch (level_filter) {
      case 'title':
        // Search primarily in document titles and headers
        searchQuery = supabaseClient
          .from('documents')
          .select('id, content, metadata, embedding')
          .not('embedding', 'is', null)
          .textSearch('content', query_embedding, {
            type: 'websearch',
            config: 'english'
          });
        break;
        
      case 'paragraph':
        // Search in content chunks
        searchQuery = supabaseClient
          .from('documents')
          .select('id, content, metadata, embedding')
          .not('embedding', 'is', null);
        break;
        
      case 'document':
      default:
        // Full document search
        searchQuery = supabaseClient
          .from('documents')
          .select('id, content, metadata, embedding')
          .not('embedding', 'is', null);
        break;
    }

    const { data: documents, error } = await searchQuery;

    if (error) {
      throw error;
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate similarities with hierarchical scoring
    const results = documents.map(doc => {
      let docEmbedding;
      
      try {
        docEmbedding = typeof doc.embedding === 'string' 
          ? JSON.parse(doc.embedding) 
          : doc.embedding;
      } catch (e) {
        console.error('Error parsing embedding:', e);
        return null;
      }

      if (!Array.isArray(docEmbedding) || !Array.isArray(queryVector)) {
        return null;
      }

      // Calculate cosine similarity
      const similarity = cosineSimilarity(queryVector, docEmbedding);
      
      // Apply level-specific scoring adjustments
      let adjustedSimilarity = similarity;
      
      switch (level_filter) {
        case 'title':
          // Boost documents where title/headers match
          const hasHeaderMatch = checkHeaderMatch(doc.content, doc.metadata);
          adjustedSimilarity = similarity * (hasHeaderMatch ? 1.3 : 1.0);
          break;
          
        case 'paragraph':
          // Boost based on content density and structure
          const contentQuality = assessContentQuality(doc.content);
          adjustedSimilarity = similarity * contentQuality;
          break;
          
        case 'document':
          // Boost based on document completeness and authority
          const documentScore = assessDocumentAuthority(doc.metadata);
          adjustedSimilarity = similarity * documentScore;
          break;
      }

      return {
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        similarity: adjustedSimilarity,
        level: level_filter,
        raw_similarity: similarity
      };
    })
    .filter(result => result !== null && result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, match_count);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-documents-hierarchical:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Check if document has header/title matches
 */
function checkHeaderMatch(content: string, metadata: any): boolean {
  const filename = metadata?.filename?.toLowerCase() || '';
  const contentLower = content.toLowerCase();
  
  // Check for header patterns in content
  const hasHeaders = /^#{1,6}\s+.+$/m.test(content) || 
                    /^[A-Z][^.!?]*:$/m.test(content) ||
                    filename.includes('title') ||
                    filename.includes('header');
  
  return hasHeaders;
}

/**
 * Assess content quality for paragraph-level search
 */
function assessContentQuality(content: string): number {
  let score = 1.0;
  
  // Length factor - prefer substantial content
  const length = content.length;
  if (length > 500 && length < 3000) {
    score *= 1.2;
  } else if (length < 100) {
    score *= 0.8;
  }
  
  // Structure factor - prefer well-structured content
  const sentences = content.split(/[.!?]+/).length;
  const avgSentenceLength = length / sentences;
  if (avgSentenceLength > 20 && avgSentenceLength < 100) {
    score *= 1.1;
  }
  
  // Information density - look for varied vocabulary
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
  const totalWords = content.split(/\s+/).length;
  const vocabularyRichness = uniqueWords / totalWords;
  if (vocabularyRichness > 0.6) {
    score *= 1.15;
  }
  
  return Math.min(score, 1.5); // Cap the boost
}

/**
 * Assess document authority for document-level search
 */
function assessDocumentAuthority(metadata: any): number {
  let score = 1.0;
  
  // File type authority
  const filename = metadata?.filename?.toLowerCase() || '';
  if (filename.endsWith('.pdf')) {
    score *= 1.2; // PDFs often more authoritative
  } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
    score *= 1.1; // Word docs moderately authoritative
  }
  
  // Recency factor
  const processedAt = metadata?.processed_at;
  if (processedAt) {
    const daysSince = (Date.now() - new Date(processedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      score *= 1.1; // Recent documents get a boost
    } else if (daysSince > 365) {
      score *= 0.9; // Older documents get slight penalty
    }
  }
  
  // Size factor - substantial documents often more comprehensive
  const size = metadata?.size || 0;
  if (size > 10000 && size < 100000) {
    score *= 1.1;
  }
  
  return Math.min(score, 1.3); // Cap the boost
}