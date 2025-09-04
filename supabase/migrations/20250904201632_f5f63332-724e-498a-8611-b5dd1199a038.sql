-- Migration de sécurisation des fonctions Supabase
-- Recréation de toutes les fonctions avec SECURITY DEFINER et search_path sécurisé

-- 1. Fonction critique : update_updated_at_column (utilisée par tous les triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Fonction critique : update_job_posts_search_tsv (trigger de recherche)
CREATE OR REPLACE FUNCTION public.update_job_posts_search_tsv()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.search_tsv := 
    setweight(to_tsvector('french', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('french', array_to_string(NEW.skills, ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.commune,'')), 'D');
  RETURN NEW;
END;
$function$;

-- 3. Fonction : cleanup_old_conversations (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.cleanup_old_conversations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.conversations 
  WHERE created_at < now() - INTERVAL '7 days'
  AND user_id = auth.uid(); -- Only cleanup user's own conversations
END;
$function$;

-- 4. Fonction : has_role (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

-- 5. Fonction : is_admin (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin');
$function$;

-- 6. Fonction : get_system_stats (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.get_system_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_conversations INTEGER;
  total_messages INTEGER;
  total_documents INTEGER;
  avg_conversation_age INTERVAL;
BEGIN
  SELECT COUNT(*) INTO total_conversations FROM conversations;
  SELECT COUNT(*) INTO total_messages FROM conversation_messages;
  SELECT COUNT(*) INTO total_documents FROM documents;
  
  SELECT AVG(now() - created_at) INTO avg_conversation_age FROM conversations;
  
  RETURN json_build_object(
    'timestamp', now(),
    'total_conversations', total_conversations,
    'total_messages', total_messages,
    'total_documents', total_documents,
    'avg_conversation_age_hours', EXTRACT(EPOCH FROM avg_conversation_age) / 3600,
    'database_size_mb', pg_database_size(current_database()) / 1024 / 1024
  );
END;
$function$;

-- 7. Fonction : cleanup_old_data (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_conversations INTEGER := 0;
  deleted_messages INTEGER := 0;
  deleted_documents INTEGER := 0;
  cleanup_date TIMESTAMP WITH TIME ZONE := now() - INTERVAL '2 days';
BEGIN
  -- Nettoyer les messages des conversations anciennes
  DELETE FROM conversation_messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE created_at < cleanup_date
  );
  GET DIAGNOSTICS deleted_messages = ROW_COUNT;
  
  -- Nettoyer les conversations anciennes
  DELETE FROM conversations 
  WHERE created_at < cleanup_date;
  GET DIAGNOSTICS deleted_conversations = ROW_COUNT;
  
  -- Nettoyer les documents anciens
  DELETE FROM documents 
  WHERE metadata->>'processed_at' IS NOT NULL 
  AND (metadata->>'processed_at')::timestamp < cleanup_date;
  GET DIAGNOSTICS deleted_documents = ROW_COUNT;
  
  -- Retourner les statistiques de nettoyage
  RETURN json_build_object(
    'cleanup_date', cleanup_date,
    'deleted_conversations', deleted_conversations,
    'deleted_messages', deleted_messages,
    'deleted_documents', deleted_documents,
    'total_deleted', deleted_conversations + deleted_messages + deleted_documents
  );
END;
$function$;

-- 8. Fonction : match_documents (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    AND (auth.uid() IS NOT NULL)
    AND d.user_id = auth.uid()
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 9. Fonction : log_audit_action (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.log_audit_action(p_action text, p_table_name text DEFAULT NULL::text, p_record_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;

-- 10. Fonction : handle_new_user (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$function$;

-- 11. Fonction : match_documents_hierarchical (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.match_documents_hierarchical(query_embedding extensions.vector, match_count integer DEFAULT 10, level_filter text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 12. Fonction : rechercher_code_natinf (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.rechercher_code_natinf(code_recherche bigint)
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT json_build_object(
        'numero_natinf', "Numero natinf",
        'nature_infraction', "Nature de linfraction",
        'qualification_infraction', "Qualification de linfraction",
        'definie_par', "Définie par",
        'reprimee_par', "Réprimée par"
    )
    FROM public.code_natinf
    WHERE "Numero natinf" = code_recherche
    LIMIT 1;
$function$;

-- 13. Fonction : rechercher_code_natinf_text (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.rechercher_code_natinf_text(code_recherche text)
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT json_build_object(
        'numero_natinf', "Numero natinf",
        'nature_infraction', "Nature de linfraction",
        'qualification_infraction', "Qualification de linfraction",
        'definie_par', "Définie par",
        'reprimee_par', "Réprimée par"
    )
    FROM public.code_natinf
    WHERE "Numero natinf" = code_recherche::BIGINT
    LIMIT 1;
$function$;

-- 14. Fonction : check_exercise_duplicate (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.check_exercise_duplicate(p_session_id text, p_content_hash text, p_exercise_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 15. Fonction : match_job_posts (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.match_job_posts(query_embedding extensions.vector, match_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, commune text, description text, skills text[], contact text, deadline date, status job_post_status, created_at timestamp with time zone, expires_at timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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

-- 16. Fonction : cleanup_expired_job_posts (sécurisation renforcée)
CREATE OR REPLACE FUNCTION public.cleanup_expired_job_posts()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;