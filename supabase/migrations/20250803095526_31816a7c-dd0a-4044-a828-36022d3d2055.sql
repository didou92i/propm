-- Fix search_path for remaining functions
ALTER FUNCTION public.rechercher_code_natinf(text) SET search_path TO 'public';
ALTER FUNCTION public.rechercher_code_natinf(bigint) SET search_path TO 'public';

-- Fix OTP expiry (reduce to recommended 5 minutes = 300 seconds)
UPDATE auth.config SET value = '300' WHERE key = 'sms_otp_exp';
UPDATE auth.config SET value = '300' WHERE key = 'email_otp_exp';

-- Enable leaked password protection
UPDATE auth.config SET value = 'true' WHERE key = 'password_leaked_password_check';