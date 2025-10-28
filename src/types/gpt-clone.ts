export interface GPTAgent {
  id: string;
  name: string;
  description: string;
  provider: "openai" | "anthropic" | "mistral" | "custom";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  icon?: string;
  color?: string;
  isActive?: boolean;
  capabilities?: {
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
    codeInterpreter?: boolean;
  };
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GPTConversation {
  id: string;
  title: string;
  agentId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface GPTMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agentId?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
    error?: string;
  };
}

export interface GPTStreamResponse {
  id: string;
  content: string;
  done: boolean;
  error?: string;
  metadata?: {
    model?: string;
    tokens?: number;
  };
}

export interface AgentConfiguration {
  agents: GPTAgent[];
  defaultAgentId: string;
  allowCustomAgents: boolean;
}

export interface ChatRequest {
  conversationId: string;
  message: string;
  agentId: string;
  stream?: boolean;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
  };
}
