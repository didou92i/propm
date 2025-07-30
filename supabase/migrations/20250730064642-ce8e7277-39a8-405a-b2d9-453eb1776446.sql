-- Phase 1: Système de nettoyage automatique des données
-- Fonction pour nettoyer les données > 2 jours

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Phase 2: Optimisation des index pour les performances
-- Index composites pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_conversations_user_created 
ON conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp 
ON conversation_messages(conversation_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_documents_user_processed 
ON documents(user_id, (metadata->>'processed_at'));

-- Index vectoriel optimisé pour les recherches d'embeddings
DROP INDEX IF EXISTS documents_embedding_idx;
CREATE INDEX documents_embedding_hnsw_idx 
ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Phase 3: Fonction de monitoring des performances
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Permettre l'exécution des fonctions par les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;