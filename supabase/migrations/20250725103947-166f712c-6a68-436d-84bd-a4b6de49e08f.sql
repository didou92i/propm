-- Create hierarchical search function
CREATE OR REPLACE FUNCTION public.match_documents_hierarchical(
  query_embedding vector,
  match_count integer DEFAULT 10,
  level_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE (auth.uid() IS NOT NULL)
  AND (level_filter IS NULL OR documents.metadata->>'level' = level_filter)
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;