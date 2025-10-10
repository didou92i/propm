-- Phase 1: Optimisation des index vectoriels et fonction match_documents

-- 1. Recréer l'index HNSW avec paramètres optimisés pour documents
DROP INDEX IF EXISTS documents_embedding_hnsw_idx;

CREATE INDEX documents_embedding_hnsw_idx 
ON public.documents 
USING hnsw (embedding vector_cosine_ops)
WITH (
  m = 24,              -- Augmenté de 16 à 24 pour meilleure précision
  ef_construction = 128 -- Augmenté de 64 à 128 pour meilleure qualité d'index
);

-- 2. Optimiser l'index IVFFlat pour job_posts
DROP INDEX IF EXISTS job_posts_embedding_ivfflat_idx;

CREATE INDEX job_posts_embedding_ivfflat_idx 
ON public.job_posts 
USING ivfflat (embedding vector_cosine_ops)
WITH (
  lists = 200  -- Augmenté de 100 à 200 pour meilleure distribution
);

-- 3. Créer un index composite pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_documents_user_embedding 
ON public.documents (user_id) 
WHERE embedding IS NOT NULL;

-- 4. Modifier match_documents pour forcer l'utilisation de l'index
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector, 
  match_count integer DEFAULT 5, 
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET enable_seqscan TO off  -- Force l'utilisation des index
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM public.documents d
  WHERE (filter = '{}' OR d.metadata @> filter)
    AND d.embedding IS NOT NULL
    AND (auth.uid() IS NOT NULL)
    AND d.user_id = auth.uid()
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 5. Modifier match_documents_hierarchical pour forcer l'utilisation de l'index
CREATE OR REPLACE FUNCTION public.match_documents_hierarchical(
  query_embedding vector, 
  match_count integer DEFAULT 10, 
  level_filter text DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET enable_seqscan TO off  -- Force l'utilisation des index
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM public.documents d
  WHERE d.embedding IS NOT NULL
    AND (auth.uid() IS NOT NULL)
    AND d.user_id = auth.uid()
    AND (level_filter IS NULL OR d.metadata->>'level' = level_filter)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 6. Modifier match_job_posts pour optimiser
CREATE OR REPLACE FUNCTION public.match_job_posts(
  query_embedding vector, 
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid, 
  title text, 
  commune text, 
  description text, 
  skills text[], 
  contact text, 
  deadline date, 
  status job_post_status, 
  created_at timestamp with time zone, 
  expires_at timestamp with time zone, 
  similarity double precision
)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
SET enable_seqscan TO off  -- Force l'utilisation des index
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    jp.id,
    jp.title,
    jp.commune,
    jp.description,
    jp.skills,
    jp.contact,
    jp.deadline,
    jp.status,
    jp.created_at,
    jp.expires_at,
    1 - (jp.embedding <=> query_embedding) as similarity
  FROM public.job_posts jp
  WHERE jp.embedding IS NOT NULL
    AND jp.status = 'approved'
    AND jp.is_active = true
    AND jp.expires_at > now()
  ORDER BY jp.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 7. Créer une fonction de monitoring des index
CREATE OR REPLACE FUNCTION public.get_index_performance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'documents_index', (
      SELECT jsonb_build_object(
        'index_name', indexrelname,
        'scans', idx_scan,
        'tuples_read', idx_tup_read,
        'tuples_fetched', idx_tup_fetch,
        'index_size', pg_size_pretty(pg_relation_size(indexrelid)),
        'table_size', pg_size_pretty(pg_relation_size('documents'::regclass))
      )
      FROM pg_stat_user_indexes
      WHERE indexrelname = 'documents_embedding_hnsw_idx'
    ),
    'job_posts_index', (
      SELECT jsonb_build_object(
        'index_name', indexrelname,
        'scans', idx_scan,
        'tuples_read', idx_tup_read,
        'tuples_fetched', idx_tup_fetch,
        'index_size', pg_size_pretty(pg_relation_size(indexrelid)),
        'table_size', pg_size_pretty(pg_relation_size('job_posts'::regclass))
      )
      FROM pg_stat_user_indexes
      WHERE indexrelname = 'job_posts_embedding_ivfflat_idx'
    ),
    'recommendations', (
      CASE 
        WHEN (SELECT COALESCE(idx_scan, 0) FROM pg_stat_user_indexes WHERE indexrelname = 'documents_embedding_hnsw_idx') = 0
        THEN jsonb_build_array('Index HNSW non utilisé - exécuter des recherches sémantiques pour tester')
        WHEN (SELECT COALESCE(idx_scan, 0) FROM pg_stat_user_indexes WHERE indexrelname = 'documents_embedding_hnsw_idx') < 10
        THEN jsonb_build_array('Index HNSW peu utilisé - utilisation faible détectée')
        ELSE jsonb_build_array('Index fonctionnel et utilisé régulièrement')
      END
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- 8. Analyser les tables pour mettre à jour les statistiques du planificateur
ANALYZE public.documents;
ANALYZE public.job_posts;