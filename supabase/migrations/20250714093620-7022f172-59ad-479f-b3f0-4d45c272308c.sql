-- Create conversations table to track conversation sessions
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_session TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation_messages table to store message history
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication is required)
CREATE POLICY "Allow all operations on conversations" 
ON public.conversations 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on conversation_messages" 
ON public.conversation_messages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_session_agent ON public.conversations(user_session, agent_type);
CREATE INDEX idx_conversation_messages_conversation_id_timestamp ON public.conversation_messages(conversation_id, timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean old conversations (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.conversations 
  WHERE created_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;