-- Nettoyage sécurisé des tables de logs PrepaCD (Phase 1)
-- Archive et purge des données anciennes pour optimiser les performances

-- 1. Archiver les anciens logs PrepaCD (+ de 7 jours)
DELETE FROM public.prepa_cds_exercise_history 
WHERE generated_at < now() - INTERVAL '7 days';

-- 2. Archiver les anciens progress logs (+ de 7 jours)  
DELETE FROM public.prepa_cds_progress_logs 
WHERE created_at < now() - INTERVAL '7 days';

-- 3. Optimiser les index des tables fréquemment utilisées
REINDEX INDEX CONCURRENTLY IF EXISTS idx_prepa_cds_exercise_session_id;
REINDEX INDEX CONCURRENTLY IF EXISTS idx_prepa_cds_progress_user_id;

-- 4. Forcer VACUUM sur les tables critiques
VACUUM FULL public.prepa_cds_exercise_history;
VACUUM FULL public.prepa_cds_progress_logs;

-- 5. Analyser les statistiques pour l'optimiseur de requêtes
ANALYZE public.code_natinf;
ANALYZE public.conversations;
ANALYZE public.conversation_messages;