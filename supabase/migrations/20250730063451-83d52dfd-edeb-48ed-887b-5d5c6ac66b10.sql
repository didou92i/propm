-- Nettoyer les documents corrompus de test et PDF illisibles
DELETE FROM documents 
WHERE user_id = '5ba021e0-95b6-4ae7-b1a7-a426e2a9e8fe'
AND (
  content = 'Ceci est un test de traitement de document par la plateforme.' 
  OR content LIKE '%h qI Z)3Fh h 4 f L Z%'
  OR content LIKE '%PDF-1. 4  5 0 obj%'
  OR metadata->>'extraction_method' = 'pdf_disabled'
);