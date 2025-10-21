-- GPT Clone Tables Migration
-- Created: 2025-01-21
-- Description: Tables for GPT Clone feature with configurable agents

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: gpt_agents
-- Stores configurable AI agents with their settings
CREATE TABLE IF NOT EXISTS gpt_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'mistral', 'custom')),
  model TEXT NOT NULL,
  api_key TEXT,
  base_url TEXT,
  system_prompt TEXT,
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  top_p DECIMAL(3, 2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3, 2) DEFAULT 0.0,
  presence_penalty DECIMAL(3, 2) DEFAULT 0.0,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  capabilities JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: gpt_conversations
-- Stores chat conversations
CREATE TABLE IF NOT EXISTS gpt_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: gpt_messages
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS gpt_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES gpt_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gpt_agents_user_id ON gpt_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_gpt_agents_provider ON gpt_agents(provider);
CREATE INDEX IF NOT EXISTS idx_gpt_agents_is_active ON gpt_agents(is_active);

CREATE INDEX IF NOT EXISTS idx_gpt_conversations_user_id ON gpt_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_gpt_conversations_agent_id ON gpt_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_gpt_conversations_updated_at ON gpt_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_gpt_messages_conversation_id ON gpt_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_gpt_messages_timestamp ON gpt_messages(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE gpt_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gpt_agents
CREATE POLICY "Users can view their own agents"
  ON gpt_agents FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own agents"
  ON gpt_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON gpt_agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON gpt_agents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for gpt_conversations
CREATE POLICY "Users can view their own conversations"
  ON gpt_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON gpt_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON gpt_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON gpt_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for gpt_messages
CREATE POLICY "Users can view messages from their conversations"
  ON gpt_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gpt_conversations
      WHERE gpt_conversations.id = gpt_messages.conversation_id
      AND gpt_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON gpt_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gpt_conversations
      WHERE gpt_conversations.id = gpt_messages.conversation_id
      AND gpt_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON gpt_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM gpt_conversations
      WHERE gpt_conversations.id = gpt_messages.conversation_id
      AND gpt_conversations.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating updated_at
CREATE TRIGGER update_gpt_agents_updated_at
  BEFORE UPDATE ON gpt_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gpt_conversations_updated_at
  BEFORE UPDATE ON gpt_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default agents (optional - these will be available to all users)
INSERT INTO gpt_agents (id, user_id, name, description, provider, model, icon, color, is_active, capabilities)
VALUES
  ('gpt-4', NULL, 'GPT-4', 'Le modèle le plus puissant d''OpenAI', 'openai', 'gpt-4-turbo-preview', '🚀', '#10a37f', true, '{"streaming": true, "functionCalling": true}'),
  ('gpt-3.5', NULL, 'GPT-3.5 Turbo', 'Rapide et efficace pour la plupart des tâches', 'openai', 'gpt-3.5-turbo', '⚡', '#74aa9c', true, '{"streaming": true, "functionCalling": true}'),
  ('claude-3-opus', NULL, 'Claude 3 Opus', 'Le modèle le plus puissant d''Anthropic', 'anthropic', 'claude-3-opus-20240229', '🧠', '#cc785c', true, '{"streaming": true, "vision": true}'),
  ('claude-3-sonnet', NULL, 'Claude 3 Sonnet', 'Équilibre idéal entre performance et rapidité', 'anthropic', 'claude-3-sonnet-20240229', '💫', '#d97757', true, '{"streaming": true, "vision": true}'),
  ('mistral-large', NULL, 'Mistral Large', 'Modèle français performant', 'mistral', 'mistral-large-latest', '🇫🇷', '#ff7000', true, '{"streaming": true, "functionCalling": true}')
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE gpt_agents IS 'Stores configurable AI agents with provider settings';
COMMENT ON TABLE gpt_conversations IS 'Stores chat conversations for the GPT clone feature';
COMMENT ON TABLE gpt_messages IS 'Stores individual messages within conversations';
