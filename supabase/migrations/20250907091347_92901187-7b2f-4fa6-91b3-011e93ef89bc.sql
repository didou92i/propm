-- Mise à jour automatique des extensions vers les dernières versions
SELECT public.auto_update_extensions() as update_result;

-- Optimisation des paramètres de sécurité de la base
SELECT public.optimize_security_settings() as optimization_result;