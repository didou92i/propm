-- Table pour l'historique des sessions Prepa CDS
CREATE TABLE public.prepa_cds_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  training_type TEXT NOT NULL,
  level TEXT NOT NULL,
  domain TEXT NOT NULL,
  exercises_proposed JSONB DEFAULT '[]'::jsonb,
  questions_asked JSONB DEFAULT '[]'::jsonb,
  cases_studied JSONB DEFAULT '[]'::jsonb,
  documents_analyzed JSONB DEFAULT '[]'::jsonb,
  anti_loop_warnings INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour l'historique des exercices générés
CREATE TABLE public.prepa_cds_exercise_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  content_preview TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  domain TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  was_alternative BOOLEAN DEFAULT false
);

-- Table pour les logs de progression utilisateur
CREATE TABLE public.prepa_cds_progress_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  exercise_id UUID REFERENCES prepa_cds_exercise_history(id),
  user_answer TEXT,
  evaluation_score INTEGER,
  feedback_provided TEXT,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.prepa_cds_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepa_cds_exercise_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepa_cds_progress_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour prepa_cds_sessions
CREATE POLICY "Users can view their own sessions"
ON public.prepa_cds_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.prepa_cds_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.prepa_cds_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Politiques RLS pour prepa_cds_exercise_history
CREATE POLICY "Users can view their own exercise history"
ON public.prepa_cds_exercise_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise history"
ON public.prepa_cds_exercise_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour prepa_cds_progress_logs
CREATE POLICY "Users can view their own progress logs"
ON public.prepa_cds_progress_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress logs"
ON public.prepa_cds_progress_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Triggers pour mise à jour automatique
CREATE TRIGGER update_prepa_cds_sessions_updated_at
BEFORE UPDATE ON public.prepa_cds_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour optimiser les requêtes
CREATE INDEX idx_prepa_cds_sessions_user_id ON public.prepa_cds_sessions(user_id);
CREATE INDEX idx_prepa_cds_sessions_session_id ON public.prepa_cds_sessions(session_id);
CREATE INDEX idx_prepa_cds_exercise_history_session_id ON public.prepa_cds_exercise_history(session_id);
CREATE INDEX idx_prepa_cds_exercise_history_content_hash ON public.prepa_cds_exercise_history(content_hash);
CREATE INDEX idx_prepa_cds_progress_logs_user_id ON public.prepa_cds_progress_logs(user_id);

-- Fonction pour détecter les doublons d'exercices
CREATE OR REPLACE FUNCTION public.check_exercise_duplicate(
  p_session_id TEXT,
  p_content_hash TEXT,
  p_exercise_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.prepa_cds_exercise_history 
    WHERE session_id = p_session_id 
    AND content_hash = p_content_hash 
    AND exercise_type = p_exercise_type
    AND generated_at > now() - INTERVAL '24 hours'
  );
END;
$$;