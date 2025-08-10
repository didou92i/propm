-- Création complète du système de recrutement (version corrigée)
-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum pour le statut des annonces
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_post_status') THEN
    CREATE TYPE public.job_post_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

-- Table principale des annonces d'emploi
CREATE TABLE IF NOT EXISTS public.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 1000),
  commune text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  contact text NOT NULL CHECK (char_length(contact) >= 6),
  deadline date,
  status public.job_post_status NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  -- Embedding pour recherche IA (text-embedding-3-small = 1536 dimensions)
  embedding vector(1536)
);

-- Ajouter colonne de recherche textuelle séparément
ALTER TABLE public.job_posts 
ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Fonction pour mettre à jour search_tsv
CREATE OR REPLACE FUNCTION public.update_job_posts_search_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := 
    setweight(to_tsvector('french', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('french', array_to_string(NEW.skills, ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.commune,'')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trg_job_posts_updated_at ON public.job_posts;
DROP TRIGGER IF EXISTS trg_job_posts_search_tsv ON public.job_posts;

-- Créer les triggers
CREATE TRIGGER trg_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_job_posts_search_tsv
  BEFORE INSERT OR UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_posts_search_tsv();

-- Index de performance
CREATE INDEX IF NOT EXISTS job_posts_created_at_idx ON public.job_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS job_posts_status_active_expires_idx ON public.job_posts (status, is_active, expires_at);
CREATE INDEX IF NOT EXISTS job_posts_search_tsv_idx ON public.job_posts USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS job_posts_author_id_idx ON public.job_posts (author_id);

-- Index vectoriel pour recherche sémantique (créé seulement si pas d'erreur)
DO $$
BEGIN
  BEGIN
    DROP INDEX IF EXISTS job_posts_embedding_ivfflat_idx;
    CREATE INDEX job_posts_embedding_ivfflat_idx
      ON public.job_posts
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  EXCEPTION WHEN OTHERS THEN
    -- Si l'index vectoriel échoue, on continue sans
    NULL;
  END;
END$$;

-- Activer RLS
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Public read approved active non-expired" ON public.job_posts;
DROP POLICY IF EXISTS "Authors can read own job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Authors can create job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Authors can delete own job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can manage all job posts" ON public.job_posts;

-- Politiques RLS
-- Lecture publique: annonces approuvées, actives, non expirées
CREATE POLICY "Public read approved active non-expired"
  ON public.job_posts
  FOR SELECT
  USING (status = 'approved' AND is_active = true AND expires_at > now());

-- Auteur: lecture de ses propres annonces
CREATE POLICY "Authors can read own job posts"
  ON public.job_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Auteur: création de ses propres annonces
CREATE POLICY "Authors can create job posts"
  ON public.job_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Auteur: suppression de ses propres annonces
CREATE POLICY "Authors can delete own job posts"
  ON public.job_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Admin: gestion complète (si fonction is_admin existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all job posts"
      ON public.job_posts
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';
  END IF;
END$$;

-- RPC: Recherche sémantique des annonces
CREATE OR REPLACE FUNCTION public.match_job_posts(
  query_embedding vector(1536),
  match_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  commune text,
  description text,
  skills text[],
  contact text,
  deadline date,
  status public.job_post_status,
  created_at timestamptz,
  expires_at timestamptz,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- RPC: Nettoyage des annonces expirées
CREATE OR REPLACE FUNCTION public.cleanup_expired_job_posts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.job_posts
  WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object(
    'deleted_count', deleted_count,
    'ran_at', now()
  );
END;
$$;