-- Nettoyer le cache de contenu existant pour forcer la régénération
-- Cette action permettra de générer du nouveau contenu "Vrai/Faux" avec les corrections

-- Supprimer les données de cache temporaires si elles existent
DROP TABLE IF EXISTS public.training_content_cache;

-- Log de l'action de nettoyage
SELECT public.log_audit_action(
  'CACHE_CLEANUP', 
  'training_content_cache', 
  NULL, 
  NULL, 
  jsonb_build_object(
    'action', 'cache_cleanup_truefausse_fix',
    'reason', 'Fix for inverted True/False answers',
    'timestamp', now()
  )
);

-- Ajouter un commentaire sur l'opération
COMMENT ON DATABASE "postgres" IS 'Cache nettoyé le ' || now()::text || ' pour correction du système Vrai/Faux';