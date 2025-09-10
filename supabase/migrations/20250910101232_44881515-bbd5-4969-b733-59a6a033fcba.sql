-- Add assistant_configurations column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assistant_configurations JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_assistant_configurations 
ON public.profiles USING gin(assistant_configurations);

-- Add a comment explaining the structure
COMMENT ON COLUMN public.profiles.assistant_configurations IS 'Array of assistant configurations: [{"agentId": "redacpro", "assistantId": "asst_xxx", "name": "RedacPro", "model": "gpt-4o"}]';