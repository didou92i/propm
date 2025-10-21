import { supabase } from "@/integrations/supabase/client";
import { GPTAgent } from "@/types/gpt-clone";

class GPTChatService {
  async streamChat(
    conversationId: string,
    message: string,
    agentId: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      // Get agent configuration
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }

      // Get conversation history
      const history = await this.getConversationHistory(conversationId);

      // Call the appropriate provider
      switch (agent.provider) {
        case "openai":
          await this.streamOpenAI(agent, message, history, onChunk);
          break;
        case "anthropic":
          await this.streamAnthropic(agent, message, history, onChunk);
          break;
        case "mistral":
          await this.streamMistral(agent, message, history, onChunk);
          break;
        case "custom":
          await this.streamCustom(agent, message, history, onChunk);
          break;
        default:
          throw new Error(`Unsupported provider: ${agent.provider}`);
      }
    } catch (error) {
      console.error("Error streaming chat:", error);
      throw error;
    }
  }

  private async getAgent(agentId: string): Promise<GPTAgent | null> {
    try {
      const { data, error } = await supabase
        .from("gpt_agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        provider: data.provider,
        model: data.model,
        apiKey: data.api_key,
        baseUrl: data.base_url,
        systemPrompt: data.system_prompt,
        temperature: data.temperature,
        maxTokens: data.max_tokens,
        topP: data.top_p,
        isActive: data.is_active,
        capabilities: data.capabilities,
      };
    } catch (error) {
      console.error("Error getting agent:", error);
      return null;
    }
  }

  private async getConversationHistory(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from("gpt_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("timestamp", { ascending: true })
        .limit(20); // Last 20 messages

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting conversation history:", error);
      return [];
    }
  }

  private async streamOpenAI(
    agent: GPTAgent,
    message: string,
    history: any[],
    onChunk: (chunk: string) => void
  ) {
    const apiKey = agent.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const messages = [
      ...(agent.systemPrompt ? [{ role: "system", content: agent.systemPrompt }] : []),
      ...history,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: agent.temperature ?? 0.7,
        max_tokens: agent.maxTokens ?? 2000,
        top_p: agent.topP ?? 1,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async streamAnthropic(
    agent: GPTAgent,
    message: string,
    history: any[],
    onChunk: (chunk: string) => void
  ) {
    const apiKey = agent.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const messages = [
      ...history.filter((h) => h.role !== "system"),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        system: agent.systemPrompt,
        max_tokens: agent.maxTokens ?? 2000,
        temperature: agent.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta") {
              const content = parsed.delta?.text;
              if (content) {
                onChunk(content);
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async streamMistral(
    agent: GPTAgent,
    message: string,
    history: any[],
    onChunk: (chunk: string) => void
  ) {
    const apiKey = agent.apiKey || import.meta.env.VITE_MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("Mistral API key not configured");
    }

    const messages = [
      ...(agent.systemPrompt ? [{ role: "system", content: agent.systemPrompt }] : []),
      ...history,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: agent.temperature ?? 0.7,
        max_tokens: agent.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async streamCustom(
    agent: GPTAgent,
    message: string,
    history: any[],
    onChunk: (chunk: string) => void
  ) {
    if (!agent.baseUrl || !agent.apiKey) {
      throw new Error("Custom agent requires baseUrl and apiKey");
    }

    const messages = [
      ...(agent.systemPrompt ? [{ role: "system", content: agent.systemPrompt }] : []),
      ...history,
      { role: "user", content: message },
    ];

    const response = await fetch(`${agent.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agent.apiKey}`,
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: agent.temperature ?? 0.7,
        max_tokens: agent.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || parsed.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

export const gptChatService = new GPTChatService();
