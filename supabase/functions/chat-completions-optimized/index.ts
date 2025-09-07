import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface AssistantConfig {
  agentId: string;
  assistantId: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature?: number;
  maxTokens: number;
  retrievedAt: string;
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

// Optimized agent configurations for faster responses
const AGENT_CONFIGS: Record<string, {
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature?: number; // Optional for newer models
}> = {
  redacpro: {
    model: 'gpt-5-mini-2025-08-07', // Faster model for responsive UX
    systemPrompt: `Tu es RedacPro, un assistant expert en rédaction professionnelle française. Tu maîtrises parfaitement :
- La rédaction administrative et professionnelle
- Les règles de français et de style
- La structuration de documents
- L'adaptation du ton selon le contexte

Réponds de manière claire, structurée et professionnelle en français.`,
    maxTokens: 3000,
    temperature: 0.7
  },
  
  cdspro: {
    model: 'gpt-5-mini-2025-08-07', // Faster for better UX
    systemPrompt: `Tu es CDSPro, un assistant spécialisé dans les concours de la fonction publique française, notamment :
- Le Centre de Gestion (CDG)
- Les épreuves de rédaction administrative
- Les connaissances institutionnelles
- La méthodologie des concours

Réponds avec expertise et pédagogie en français, en structurant tes réponses de façon claire.`,
    maxTokens: 3000,
    temperature: 0.6
  },
  
  prepacds: {
    model: 'gpt-5-mini-2025-08-07',
    systemPrompt: `Tu es PrépaCD, un formateur expert pour la préparation au concours de Contrôleur des Douanes. Tu maîtrises :
- Le programme officiel du concours
- Les épreuves écrites et orales
- La méthodologie de préparation
- Les connaissances douanières et fiscales

Réponds de façon pédagogique et structurée, adapte tes explications au niveau du candidat.`,
    maxTokens: 3000,
    temperature: 0.6
  },
  
  arrete: {
    model: 'gpt-5-2025-08-07', // Keep flagship model for complex legal documents
    systemPrompt: `Tu es un expert en rédaction d'arrêtés administratifs français. Tu maîtrises parfaitement :
- La structure réglementaire des arrêtés
- Le vocabulaire juridique approprié
- Les références légales et réglementaires
- Les formules de politesse officielles

Produis des arrêtés conformes aux standards administratifs français, structurés et précis.`,
    maxTokens: 4000
  }
};

// Request timeout configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds max

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout after 30 seconds')), REQUEST_TIMEOUT);
  });

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { messages, selectedAgent, userSession } = await req.json();
    
    console.log('chat-completions-optimized: incoming request', {
      userId: user.id,
      selectedAgent,
      messagesCount: messages?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Try to get dynamic assistant configuration first
    let agentConfig = await getDynamicAgentConfig(user.id, selectedAgent);
    
    // Fallback to hardcoded config if no dynamic config found
    if (!agentConfig) {
      console.log('Using fallback hardcoded config for', selectedAgent);
      agentConfig = AGENT_CONFIGS[selectedAgent] || AGENT_CONFIGS.redacpro;
    } else {
      console.log('Using dynamic OpenAI Assistant config for', selectedAgent, {
        model: agentConfig.model,
        assistantId: agentConfig.assistantId || 'none'
      });
    }
    
    // Prepare conversation messages
    const conversationMessages = [
      {
        role: 'system',
        content: agentConfig.systemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    console.log('chat-completions-optimized: starting OpenAI request', {
      agent: selectedAgent,
      model: agentConfig.model,
      messageCount: conversationMessages.length
    });

    // Prepare OpenAI request body
    const requestBody: any = {
      model: agentConfig.model,
      messages: conversationMessages,
      stream: true,
      stream_options: {
        include_usage: true
      }
    };

    // Add appropriate token limit parameter based on model
    if (agentConfig.model.startsWith('gpt-5') || agentConfig.model.startsWith('o3') || agentConfig.model.startsWith('o4')) {
      requestBody.max_completion_tokens = agentConfig.maxTokens;
      // Don't include temperature for newer models (not supported)
    } else {
      requestBody.max_tokens = agentConfig.maxTokens;
      if (agentConfig.temperature !== undefined) {
        requestBody.temperature = agentConfig.temperature;
      }
    }

    // Create streaming request to OpenAI with timeout
    const openAIRequest = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await Promise.race([openAIRequest, timeoutPromise]) as Response;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    console.log('chat-completions-optimized: OpenAI response received, starting stream');

    // Create optimized SSE stream
    const encoder = new TextEncoder();
    let fullContent = '';
    let tokenCount = 0;
    let firstTokenTime: number | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        // Send immediate start signal
        controller.enqueue(encoder.encode('event: start\n'));
        controller.enqueue(encoder.encode('data: {"status": "streaming_started"}\n\n'));

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              const endTime = Date.now();
              const totalTime = endTime - startTime;
              const firstTokenLatency = firstTokenTime ? firstTokenTime - startTime : 0;
              
              controller.enqueue(encoder.encode('event: complete\n'));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                content: fullContent,
                performance: {
                  totalTime,
                  firstTokenLatency,
                  tokenCount,
                  tokensPerSecond: tokenCount / (totalTime / 1000)
                }
              })}\n\n`));
              
              console.log('chat-completions-optimized: completed', {
                totalTime,
                firstTokenLatency,
                tokenCount,
                contentLength: fullContent.length,
                tokensPerSecond: Math.round(tokenCount / (totalTime / 1000))
              });
              
              break;
            }

            // Process streaming chunks efficiently
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;
                  
                  if (delta?.content) {
                    if (!firstTokenTime) {
                      firstTokenTime = Date.now();
                      console.log('chat-completions-optimized: first token received', {
                        latency: firstTokenTime - startTime
                      });
                    }
                    
                    fullContent += delta.content;
                    tokenCount++;
                    
                    // Send token data with reduced overhead
                    controller.enqueue(encoder.encode('event: token\n'));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      token: delta.content,
                      content: fullContent
                    })}\n\n`));
                  }
                } catch (error) {
                  // Silently skip invalid JSON to maintain stream flow
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode('event: error\n'));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        } finally {
          reader.releaseLock();
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('chat-completions-optimized error:', error);
    const responseTime = Date.now() - startTime;
    
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: error\n'));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          error: error.message,
          responseTime 
        })}\n\n`));
        controller.close();
      }
    });

    return new Response(errorStream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
});

/**
 * Récupère la configuration dynamique d'un Assistant OpenAI
 */
async function getDynamicAgentConfig(userId: string, agentId: string): Promise<any | null> {
  try {
    // Récupérer les configs cachées depuis le profil utilisateur
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('assistant_configs, configs_updated_at')
      .eq('user_id', userId)
      .single();

    if (error || !data?.assistant_configs) {
      console.log('No cached assistant configs found for user', userId);
      return null;
    }

    const configs: AssistantConfig[] = data.assistant_configs;
    const configAge = new Date().getTime() - new Date(data.configs_updated_at).getTime();
    const isExpired = configAge > (24 * 60 * 60 * 1000); // 24 heures

    if (isExpired) {
      console.log('Assistant configs expired for user', userId);
      return null;
    }

    const config = configs.find(c => c.agentId === agentId);
    if (!config) {
      console.log('No config found for agent', agentId);
      return null;
    }

    // Adapter au format attendu par le système
    return {
      model: config.model,
      systemPrompt: config.systemPrompt,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      assistantId: config.assistantId // Pour debug/logs
    };

  } catch (error) {
    console.error('Error retrieving dynamic agent config:', error);
    return null;
  }
}