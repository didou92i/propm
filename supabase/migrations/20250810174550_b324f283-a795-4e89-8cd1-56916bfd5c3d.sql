-- Create job post status enum
CREATE TYPE public.job_post_status AS ENUM ('pending', 'approved', 'rejected');

-- Create the job_posts table
CREATE TABLE public.job_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  commune TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  contact TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  status job_post_status NOT NULL DEFAULT 'approved',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  embedding vector(1536),
  search_tsv tsvector
);

-- Enable Row Level Security
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for job_posts
CREATE POLICY "Users can view active approved job posts" 
ON public.job_posts 
FOR SELECT 
USING (is_active = true AND status = 'approved' AND expires_at > now());

CREATE POLICY "Users can create their own job posts" 
ON public.job_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job posts" 
ON public.job_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job posts" 
ON public.job_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_job_posts_user_id ON public.job_posts(user_id);
CREATE INDEX idx_job_posts_status_active ON public.job_posts(status, is_active);
CREATE INDEX idx_job_posts_commune ON public.job_posts(commune);
CREATE INDEX idx_job_posts_expires_at ON public.job_posts(expires_at);
CREATE INDEX idx_job_posts_created_at ON public.job_posts(created_at DESC);
CREATE INDEX idx_job_posts_search_tsv ON public.job_posts USING GIN(search_tsv);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_job_posts_search_tsv()
RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := 
    setweight(to_tsvector('french', NEW.title), 'A') ||
    setweight(to_tsvector('french', NEW.commune), 'B') ||
    setweight(to_tsvector('french', NEW.description), 'C') ||
    setweight(to_tsvector('french', array_to_string(NEW.skills, ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
CREATE TRIGGER update_job_posts_search_tsv_trigger
  BEFORE INSERT OR UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_posts_search_tsv();

-- Create function to match job posts using embeddings
CREATE OR REPLACE FUNCTION public.match_job_posts(
  query_embedding vector(1536),
  match_count integer DEFAULT 10,
  similarity_threshold float DEFAULT 0.5
)
RETURNS TABLE(
  id uuid,
  title text,
  commune text,
  description text,
  skills text[],
  contact text,
  deadline timestamp with time zone,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    job_posts.id,
    job_posts.title,
    job_posts.commune,
    job_posts.description,
    job_posts.skills,
    job_posts.contact,
    job_posts.deadline,
    job_posts.created_at,
    job_posts.expires_at,
    (1 - (job_posts.embedding <=> query_embedding)) as similarity
  FROM public.job_posts
  WHERE job_posts.is_active = true 
    AND job_posts.status = 'approved'
    AND job_posts.expires_at > now()
    AND job_posts.embedding IS NOT NULL
    AND (1 - (job_posts.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY job_posts.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to cleanup expired job posts
CREATE OR REPLACE FUNCTION public.cleanup_expired_job_posts()
RETURNS TABLE(deleted_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_rows integer := 0;
BEGIN
  -- Soft delete expired job posts
  UPDATE public.job_posts 
  SET is_active = false, updated_at = now()
  WHERE expires_at <= now() AND is_active = true;
  
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  
  RETURN QUERY SELECT deleted_rows;
END;
$$;