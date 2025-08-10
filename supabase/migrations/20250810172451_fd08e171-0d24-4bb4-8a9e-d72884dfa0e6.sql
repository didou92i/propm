
-- Extensions nécessaires
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Enum status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_post_status') then
    create type public.job_post_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

-- Table job_posts
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  title text not null check (char_length(title) <= 100),
  description text not null check (char_length(description) <= 1000),
  commune text not null,
  skills text[] not null default '{}',
  contact text not null,
  deadline date,
  status public.job_post_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- suppression auto après 60 jours (via filtre et fonction de cleanup)
  expires_at timestamptz not null default (now() + interval '60 days'),
  -- Embedding pour recherche IA (text-embedding-3-small = 1536)
  embedding vector(1536),
  -- Colonne de recherche plein texte (français)
  search_tsv tsvector generated always as (
    setweight(to_tsvector('french', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('french', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('french', array_to_string(skills, ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(commune,'')), 'D')
  ) stored
);

-- Liaison à profiles (si présente) sans toucher aux schémas réservés
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles') then
    -- ajouter la contrainte seulement si pas déjà présente
    begin
      alter table public.job_posts
        add constraint job_posts_author_fk
        foreign key (author_id) references public.profiles(user_id) on delete cascade;
    exception when duplicate_object then
      -- contrainte déjà ajoutée
      null;
    end;
  end if;
end$$;

-- Trigger updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_job_posts_updated_at'
  ) then
    create trigger trg_job_posts_updated_at
      before update on public.job_posts
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

-- Index de performance
create index if not exists job_posts_created_at_idx on public.job_posts (created_at desc);
create index if not exists job_posts_status_active_expires_idx on public.job_posts (status, is_active, expires_at);
create index if not exists job_posts_search_tsv_idx on public.job_posts using gin (search_tsv);
-- Index vectoriel pour recherche sémantique (IVFFLAT). Requiert ANALYZE après quelques données.
do $$
begin
  -- vérifier l'existence de l'index (nom exact)
  if not exists (select 1 from pg_class where relname = 'job_posts_embedding_ivfflat_idx') then
    create index job_posts_embedding_ivfflat_idx
      on public.job_posts
      using ivfflat (embedding vector_cosine_ops)
      with (lists = 100);
  end if;
end$$;

-- Activer RLS
alter table public.job_posts enable row level security;

-- Politiques RLS
-- Lecture publique: annonces approuvées, actives, non expirées
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'Public read approved active non-expired' and tablename = 'job_posts') then
    create policy "Public read approved active non-expired"
      on public.job_posts
      for select
      using (status = 'approved' and is_active = true and expires_at > now());
  end if;
end$$;

-- Auteur: lecture de ses propres annonces
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'Authors can read own job posts' and tablename = 'job_posts') then
    create policy "Authors can read own job posts"
      on public.job_posts
      for select
      using (auth.uid() = author_id);
  end if;
end$$;

-- Auteur: création de ses propres annonces
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'Authors can create job posts' and tablename = 'job_posts') then
    create policy "Authors can create job posts"
      on public.job_posts
      for insert
      with check (auth.uid() = author_id);
  end if;
end$$;

-- Auteur: suppression de ses propres annonces
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'Authors can delete own job posts' and tablename = 'job_posts') then
    create policy "Authors can delete own job posts"
      on public.job_posts
      for delete
      using (auth.uid() = author_id);
  end if;
end$$;

-- Admin: gestion complète (toutes opérations)
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'Admins can manage all job posts' and tablename = 'job_posts') then
    create policy "Admins can manage all job posts"
      on public.job_posts
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- RPC: Recherche sémantique des annonces
create or replace function public.match_job_posts(
  query_embedding extensions.vector,
  match_count integer default 10
)
returns table (
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
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  return query
  select
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
  from public.job_posts jp
  where jp.embedding is not null
    and jp.status = 'approved'
    and jp.is_active = true
    and jp.expires_at > now()
  order by jp.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RPC: Nettoyage des annonces expirées
create or replace function public.cleanup_expired_job_posts()
returns json
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.job_posts
  where expires_at < now();
  get diagnostics deleted_count = row_count;

  return json_build_object(
    'deleted_count', deleted_count,
    'ran_at', now()
  );
end;
$$;
