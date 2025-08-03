-- Fix search_path for remaining functions
ALTER FUNCTION public.rechercher_code_natinf(text) SET search_path TO 'public';
ALTER FUNCTION public.rechercher_code_natinf(bigint) SET search_path TO 'public';