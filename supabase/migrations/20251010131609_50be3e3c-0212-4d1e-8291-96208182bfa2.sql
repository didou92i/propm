-- Migration complète pour corriger le problème d'embeddings (version corrigée)

-- Étape 1 : Créer une table de backup temporaire avec les embeddings en tant que TEXT
CREATE TABLE IF NOT EXISTS public.documents_embedding_backup (
  id uuid,
  user_id uuid,
  content text,
  metadata jsonb,
  embedding_text text
);

-- Étape 2 : Sauvegarder les embeddings existants (conversion en text pour compatibilité)
INSERT INTO public.documents_embedding_backup (id, user_id, content, metadata, embedding_text)
SELECT id, user_id, content, metadata, embedding::text
FROM public.documents
WHERE embedding IS NOT NULL;

-- Étape 3 : Supprimer la colonne embedding actuelle
ALTER TABLE public.documents 
DROP COLUMN IF EXISTS embedding CASCADE;

-- Étape 4 : Recréer l'extension pgvector dans le schéma public
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector 
WITH SCHEMA public;

-- Étape 5 : Recréer la colonne embedding avec le bon type
ALTER TABLE public.documents 
ADD COLUMN embedding vector(1536);

-- Étape 6 : Restaurer les embeddings depuis le backup
UPDATE public.documents d
SET embedding = b.embedding_text::vector(1536)
FROM public.documents_embedding_backup b
WHERE d.id = b.id;

-- Étape 7 : Recréer l'index HNSW pour les performances
CREATE INDEX idx_documents_embedding_hnsw 
ON public.documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Étape 8 : Mettre à jour la fonction match_documents_hierarchical
CREATE OR REPLACE FUNCTION public.match_documents_hierarchical(
  query_embedding vector(1536),
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
SET enable_seqscan TO 'off'
AS $$
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
$$;

-- Étape 9 : Mettre à jour la fonction match_documents standard
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
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
SET enable_seqscan TO 'off'
AS $$
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
$$;

-- Étape 10 : Vérifier le nombre d'embeddings restaurés
DO $$
DECLARE
  backup_count integer;
  restored_count integer;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM public.documents_embedding_backup;
  SELECT COUNT(*) INTO restored_count FROM public.documents WHERE embedding IS NOT NULL;
  
  RAISE NOTICE 'Migration complète: % embeddings sauvegardés, % embeddings restaurés', backup_count, restored_count;
END $$;

-- Note: La table de backup sera conservée pour sécurité
-- Vous pourrez la supprimer après validation avec:
-- DROP TABLE IF EXISTS public.documents_embedding_backup;