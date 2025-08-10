
-- Job board: schema, RLS, RPC
-- Safe defaults and RLS-aware. Uses existing update_updated_at_column() trigger helper.

-- 1) Type de statut
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_post_status') THEN
    CREATE TYPE public.job_post_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END$$;

-- 2) Table job_posts
CREATE TABLE IF NOT EXISTS public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  commune TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) <= 1000),
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  contact TEXT NOT NULL CHECK (
    contact ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'  -- email
    OR contact ~* '^\+?[0-9 .-]{6,}$'        -- téléphone simple
  ),
  deadline DATE NULL,
  status public.job_post_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '60 days'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- Embedding pour recherche IA (OpenAI text-embedding-3-small => 1536)
  embedding extensions.vector(1536),
  moderated_by UUID NULL,
  moderated_at TIMESTAMPTZ NULL,
  moderation_note TEXT NULL
);

-- 3) Triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'job_posts_set_updated_at'
  ) THEN
    CREATE TRIGGER job_posts_set_updated_at
    BEFORE UPDATE ON public.job_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 4) Indexes pour performances (filtres/pagination/recherche)
CREATE INDEX IF NOT EXISTS job_posts_commune_created_at_idx
  ON public.job_posts (commune, created_at DESC);

CREATE INDEX IF NOT EXISTS job_posts_status_expires_idx
  ON public.job_posts (status, expires_at);

CREATE INDEX IF NOT EXISTS job_posts_deadline_idx
  ON public.job_posts (deadline);

-- Full-text (français) sur titre + description + skills
ALTER TABLE public.job_posts
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(title,'') || ' ' ||
      coalesce(description,'') || ' ' ||
      array_to_string(skills,' ')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS job_posts_search_tsv_idx
  ON public.job_posts USING GIN (search_tsv);

-- Index vectoriel (cosine). Requiert vector extension déjà présente.
CREATE INDEX IF NOT EXISTS job_posts_embedding_idx
  ON public.job_posts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 5) RLS
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- a) Lecture publique: uniquement annonces approuvées et non expirées
DROP POLICY IF EXISTS "Public can read approved active job posts" ON public.job_posts;
CREATE POLICY "Public can read approved active job posts"
  ON public.job_posts
  FOR SELECT
  USING (status = 'approved' AND expires_at > now());

-- b) Auteurs: lire leurs annonces (quel que soit le statut)
DROP POLICY IF EXISTS "Authors can read own job posts" ON public.job_posts;
CREATE POLICY "Authors can read own job posts"
  ON public.job_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- c) Insertion: auteur = auth.uid()
DROP POLICY IF EXISTS "Authors can insert own job posts" ON public.job_posts;
CREATE POLICY "Authors can insert own job posts"
  ON public.job_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- d) Auteur: modifier/supprimer ses annonces
DROP POLICY IF EXISTS "Authors can update own job posts" ON public.job_posts;
CREATE POLICY "Authors can update own job posts"
  ON public.job_posts
  FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own job posts" ON public.job_posts;
CREATE POLICY "Authors can delete own job posts"
  ON public.job_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- e) Admins: lecture/màj/suppression globales
DROP POLICY IF EXISTS "Admins can read all job posts" ON public.job_posts;
CREATE POLICY "Admins can read all job posts"
  ON public.job_posts
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all job posts" ON public.job_posts;
CREATE POLICY "Admins can update all job posts"
  ON public.job_posts
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all job posts" ON public.job_posts;
CREATE POLICY "Admins can delete all job posts"
  ON public.job_posts
  FOR DELETE
  USING (public.is_admin());

-- 6) RPC: match_job_posts (recherche IA via similarité cosine)
CREATE OR REPLACE FUNCTION public.match_job_posts(
  query_embedding extensions.vector,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  commune text,
  skills text[],
  contact text,
  deadline date,
  status public.job_post_status,
  created_at timestamptz,
  expires_at timestamptz,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.commune,
    p.skills,
    p.contact,
    p.deadline,
    p.status,
    p.created_at,
    p.expires_at,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.job_posts p
  WHERE p.embedding IS NOT NULL
    AND (
      -- Public: seulement approuvées et non expirées
      (p.status = 'approved' AND p.expires_at > now())
      -- Auteur connecté: accès à ses propres annonces
      OR (auth.uid() IS NOT NULL AND p.author_id = auth.uid())
      -- Admin: accès global
      OR public.is_admin()
    )
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 7) Nettoyage des annonces expirées (purge > 60 jours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_job_posts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.job_posts
  WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object(
    'timestamp', now(),
    'deleted_count', deleted_count
  );
END;
$function$;
