-- Ajouter le compte utilisateur comme administrateur
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5ba021e0-95b6-4ae7-b1a7-a426e2a9e8fe', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;