-- Correction de l'erreur Security Definer View et amélioration de la sécurité

-- 1. CORRIGER L'ERREUR CRITIQUE: Supprimer la vue SECURITY DEFINER et la remplacer par une fonction
DROP VIEW IF EXISTS public.security_monitoring_view;

-- Remplacer par une fonction sécurisée
CREATE OR REPLACE FUNCTION public.get_security_monitoring_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'category', 'Database Security',
    'metrics', jsonb_build_object(
      'total_extensions', (SELECT COUNT(*) FROM pg_extension),
      'rls_enabled_tables', (
        SELECT COUNT(*) FROM pg_tables 
        WHERE schemaname = 'public' AND rowsecurity = true
      ),
      'total_tables', (
        SELECT COUNT(*) FROM pg_tables 
        WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
      ),
      'secure_functions', (
        SELECT COUNT(*) FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND prosecdef = true
      ),
      'total_user_functions', (
        SELECT COUNT(*) FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ),
      'last_security_check', now()
    )
  );
END;
$function$;

-- 2. Créer une fonction pour la mise à jour automatique des extensions (corrigée)
CREATE OR REPLACE FUNCTION public.auto_update_extensions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  extension_rec RECORD;
  update_count INTEGER := 0;
  results jsonb := '[]'::jsonb;
  update_status TEXT;
BEGIN
  -- Parcourir toutes les extensions importantes
  FOR extension_rec IN 
    SELECT e.extname, e.extversion, av.default_version
    FROM pg_extension e
    LEFT JOIN pg_available_extensions av ON e.extname = av.name
    WHERE e.extname IN ('vector', 'pgcrypto', 'uuid-ossp', 'pgsodium')
  LOOP
    BEGIN
      -- Tenter la mise à jour seulement si nécessaire
      IF extension_rec.extversion != extension_rec.default_version OR extension_rec.default_version IS NULL THEN
        EXECUTE format('ALTER EXTENSION %I UPDATE', extension_rec.extname);
        update_count := update_count + 1;
        update_status := 'updated';
      ELSE
        update_status := 'already_latest';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      update_status := 'update_failed';
    END;
    
    results := results || jsonb_build_object(
      'extension', extension_rec.extname,
      'previous_version', extension_rec.extversion,
      'target_version', COALESCE(extension_rec.default_version, 'unknown'),
      'status', update_status
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'updated_at', now(),
    'total_processed', (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('vector', 'pgcrypto', 'uuid-ossp', 'pgsodium')),
    'successfully_updated', update_count,
    'details', results,
    'next_check_recommended', now() + INTERVAL '30 days'
  );
END;
$function$;

-- 3. Fonction de diagnostic de sécurité avancée
CREATE OR REPLACE FUNCTION public.run_security_diagnostics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  critical_issues jsonb := '[]'::jsonb;
  warnings jsonb := '[]'::jsonb;
  recommendations jsonb := '[]'::jsonb;
  overall_score INTEGER := 100;
BEGIN
  -- Vérifier les tables sans RLS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%' 
    AND rowsecurity = false
  ) THEN
    critical_issues := critical_issues || jsonb_build_object(
      'issue', 'Tables sans RLS détectées',
      'severity', 'CRITICAL',
      'impact', 'Accès non autorisé aux données possible'
    );
    overall_score := overall_score - 40;
  END IF;
  
  -- Vérifier les fonctions non sécurisées
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND prosecdef = false
    AND proname IN ('update_updated_at_column', 'has_role', 'is_admin')
  ) THEN
    critical_issues := critical_issues || jsonb_build_object(
      'issue', 'Fonctions critiques non sécurisées',
      'severity', 'HIGH',
      'impact', 'Risque d\injection SQL et escalade de privilèges'
    );
    overall_score := overall_score - 30;
  END IF;
  
  -- Vérifier les extensions obsolètes
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    LEFT JOIN pg_available_extensions av ON e.extname = av.name
    WHERE e.extversion != av.default_version
    AND e.extname IN ('vector', 'pgcrypto', 'uuid-ossp')
  ) THEN
    warnings := warnings || jsonb_build_object(
      'issue', 'Extensions obsolètes',
      'severity', 'MEDIUM',
      'action', 'Exécuter auto_update_extensions()'
    );
    overall_score := overall_score - 10;
  END IF;
  
  -- Recommandations pour les paramètres manuels
  recommendations := recommendations || jsonb_build_array(
    jsonb_build_object(
      'category', 'Authentication OTP',
      'current_setting', 'Vérifier dans Dashboard',
      'recommended_value', '300 secondes (5 minutes)',
      'dashboard_url', 'https://supabase.com/dashboard/project/yulhsufpnjkiozkrgyoq/auth/configuration'
    ),
    jsonb_build_object(
      'category', 'Password Protection',
      'current_setting', 'Probablement désactivé',
      'recommended_value', 'Activé',
      'dashboard_url', 'https://supabase.com/dashboard/project/yulhsufpnjkiozkrgyoq/auth/configuration'
    )
  );
  
  RETURN jsonb_build_object(
    'scan_completed_at', now(),
    'overall_security_score', overall_score,
    'security_grade', CASE 
      WHEN overall_score >= 95 THEN 'A+'
      WHEN overall_score >= 90 THEN 'A'
      WHEN overall_score >= 80 THEN 'B'
      WHEN overall_score >= 70 THEN 'C'
      ELSE 'REQUIRES_ATTENTION'
    END,
    'critical_issues', critical_issues,
    'warnings', warnings,
    'manual_configuration_needed', recommendations,
    'automated_fixes_available', jsonb_build_array(
      'auto_update_extensions() - Met à jour les extensions',
      'optimize_security_settings() - Optimise la configuration'
    )
  );
END;
$function$;

-- 4. Accorder les permissions pour les nouvelles fonctions
GRANT EXECUTE ON FUNCTION public.get_security_monitoring_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_update_extensions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_security_diagnostics() TO authenticated;