-- Fix linter: ensure SECURITY DEFINER functions have an explicit search_path
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action text,
  p_table_name text DEFAULT NULL::text,
  p_record_id uuid DEFAULT NULL::uuid,
  p_old_values jsonb DEFAULT NULL::jsonb,
  p_new_values jsonb DEFAULT NULL::jsonb
)
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

CREATE OR REPLACE FUNCTION public.check_exercise_duplicate(
  p_session_id text,
  p_content_hash text,
  p_exercise_type text
)
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

-- Move and update the 'vector' extension into the 'extensions' schema if possible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    BEGIN
      EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
    EXCEPTION WHEN OTHERS THEN
      -- ignore if cannot move
      NULL;
    END;
    BEGIN
      EXECUTE 'ALTER EXTENSION vector UPDATE';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END$$;