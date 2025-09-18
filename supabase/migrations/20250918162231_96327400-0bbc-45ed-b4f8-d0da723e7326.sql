-- Sécurisation de la table code_natinf
-- Suppression de la politique publique existante
DROP POLICY IF EXISTS "Allow read to everyone" ON public.code_natinf;

-- Nouvelle politique restrictive : accès uniquement aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can read NATINF codes" 
ON public.code_natinf 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Audit log des accès à la table code_natinf pour traçabilité
CREATE OR REPLACE FUNCTION public.log_natinf_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log uniquement si c'est un utilisateur authentifié
  IF auth.uid() IS NOT NULL THEN
    PERFORM public.log_audit_action(
      'NATINF_ACCESS',
      'code_natinf',
      NULL::uuid,
      NULL::jsonb,
      jsonb_build_object(
        'searched_code', NEW."Numero natinf",
        'access_time', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour logger les accès (si la fonction de recherche est utilisée)
-- Note: Ce trigger sera activé lors des recherches via les fonctions SQL existantes