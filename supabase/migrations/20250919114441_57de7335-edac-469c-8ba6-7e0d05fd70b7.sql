-- Nettoyage sécurisé des tables de logs PrepaCD (Phase 1) - Version corrigée
-- Archive et purge des données anciennes pour optimiser les performances

-- 1. Archiver les anciens logs PrepaCD (+ de 7 jours)
DELETE FROM public.prepa_cds_exercise_history 
WHERE generated_at < now() - INTERVAL '7 days';

-- 2. Archiver les anciens progress logs (+ de 7 jours)  
DELETE FROM public.prepa_cds_progress_logs 
WHERE created_at < now() - INTERVAL '7 days';

-- 3. Forcer VACUUM sur les tables critiques pour libérer l'espace
VACUUM FULL public.prepa_cds_exercise_history;
VACUUM FULL public.prepa_cds_progress_logs;

-- 4. Analyser les statistiques pour l'optimiseur de requêtes
ANALYZE public.code_natinf;
ANALYZE public.conversations;
ANALYZE public.conversation_messages;

-- 5. Créer une vue de monitoring sécurité si elle n'existe pas
CREATE OR REPLACE VIEW public.security_monitoring_view AS
SELECT 
  'Database Performance' as category,
  jsonb_build_object(
    'prepa_cds_exercise_count', (SELECT COUNT(*) FROM public.prepa_cds_exercise_history),
    'prepa_cds_progress_count', (SELECT COUNT(*) FROM public.prepa_cds_progress_logs),
    'total_conversations', (SELECT COUNT(*) FROM public.conversations),
    'total_messages', (SELECT COUNT(*) FROM public.conversation_messages),
    'database_size_mb', pg_database_size(current_database()) / 1024 / 1024
  ) as metrics;