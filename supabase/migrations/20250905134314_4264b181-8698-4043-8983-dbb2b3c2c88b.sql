-- Supprimer les documents ANSSI défaillants avec contenu invalide
DELETE FROM public.documents 
WHERE metadata->>'filename' LIKE '%ANSSI%' 
  AND (
    content IS NULL 
    OR LENGTH(content) < 100 
    OR content LIKE '%Extraction rapide disponible%'
    OR content LIKE '%traitement automatique a échoué%'
    OR content LIKE '%[ERREUR%'
  );

-- Supprimer aussi les documents avec contenu générique de fallback
DELETE FROM public.documents 
WHERE content LIKE '%Document PDF:%' 
  AND content LIKE '%Extraction rapide disponible%';

-- Nettoyer les documents corrompus (contenu trop court)
DELETE FROM public.documents 
WHERE LENGTH(content) < 50;