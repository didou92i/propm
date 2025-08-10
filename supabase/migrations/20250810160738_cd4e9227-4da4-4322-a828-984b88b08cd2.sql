-- 1) Create roles enum and user_roles table (no FK to auth.users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END$$;

-- 2) Security definer helpers for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 3) Tighten documents RLS: restrict SELECT to owner only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='documents' AND policyname='Authenticated users can view all documents'
  ) THEN
    DROP POLICY "Authenticated users can view all documents" ON public.documents;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='documents' AND policyname='Users can view their own documents'
  ) THEN
    CREATE POLICY "Users can view their own documents"
    ON public.documents
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- 4) Harden audit_logs INSERT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='audit_logs' AND policyname='System can insert audit logs'
  ) THEN
    DROP POLICY "System can insert audit logs" ON public.audit_logs;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Users can insert their own audit logs'
  ) THEN
    CREATE POLICY "Users can insert their own audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 5) Update RPCs to return only caller-owned documents
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  match_count integer DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    AND (auth.uid() IS NOT NULL)
    AND d.user_id = auth.uid()
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_documents_hierarchical(
  query_embedding vector,
  match_count integer DEFAULT 10,
  level_filter text DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM public.documents d
  WHERE (auth.uid() IS NOT NULL)
    AND (level_filter IS NULL OR d.metadata->>'level' = level_filter)
    AND d.user_id = auth.uid()
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;