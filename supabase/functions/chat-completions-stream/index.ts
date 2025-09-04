import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

// Agent configurations with optimized prompts
const AGENT_CONFIGS: Record<string, {
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
}> = {
  redacpro: {
    model: 'gpt-4.1-2025-04-14',
    systemPrompt: `Tu es RedacPro, un assistant expert en rédaction professionnelle française. Tu maîtrises parfaitement :
- La rédaction administrative et professionnelle
- Les règles de français et de style
- La structuration de documents
- L'adaptation du ton selon le contexte

Réponds de manière claire, structurée et professionnelle en français.`,
    maxTokens: 4000,
    temperature: 0.7
  },
  
  cdspro: {
    model: 'gpt-4.1-2025-04-14',
    systemPrompt: `Tu es CDSPro, un assistant spécialisé dans les concours de la fonction publique française, notamment :
- Le Centre de Gestion (CDG)
- Les épreuves de rédaction administrative
- Les connaissances institutionnelles
- La méthodologie des concours

Réponds avec expertise et pédagogie en français, en structurant tes réponses de façon claire.`,
    maxTokens: 4000,
    temperature: 0.6
  },
  
  prepacds: {
    model: 'gpt-4.1-2025-04-14',
    systemPrompt: `Tu es PrépaCD, un formateur expert pour la préparation au concours de Contrôleur des Douanes. Tu maîtrises :
- Le programme officiel du concours
- Les épreuves écrites et orales
- La méthodologie de préparation
- Les connaissances douanières et fiscales

Réponds de façon pédagogique et structurée, adapte tes explications au niveau du candidat.`,
    maxTokens: 4000,
    temperature: 0.6
  },
  
  arrete: {
    model: 'gpt-4.1-2025-04-14',
    systemPrompt: `Tu es un expert en rédaction d'arrêtés administratifs français. Tu maîtrises parfaitement :
- La structure réglementaire des arrêtés
- Le vocabulaire juridique approprié
- Les références légales et réglementaires
- Les formules de politesse officielles

Produis des arrêtés conformes aux standards administratifs français, structurés et précis.`,
    maxTokens: 6000,
    temperature: 0.3
  }
};

// Performance metrics tracking
let totalRequests = 0;
let totalResponseTime = 0;
let successfulStreams = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  totalRequests++;

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
    
    console.log('chat-completions-stream: incoming request', {
      userId: user.id,
      selectedAgent,
      messagesCount: messages?.length || 0,
      isStreaming: true,
      timestamp: new Date().toISOString()
    });

    // Get agent configuration
    const agentConfig = AGENT_CONFIGS[selectedAgent] || AGENT_CONFIGS.redacpro;
    
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

    console.log('chat-completions-stream: starting OpenAI request', {
      agent: selectedAgent,
      model: agentConfig.model,
      messageCount: conversationMessages.length
    });

    // Create streaming request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentConfig.model,
        messages: conversationMessages,
        max_completion_tokens: agentConfig.maxTokens,
        temperature: agentConfig.temperature,
        stream: true,
        stream_options: {
          include_usage: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    console.log('chat-completions-stream: OpenAI response received, starting stream');

    // Create SSE stream
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
              // Send completion signal
              const endTime = Date.now();
              const totalTime = endTime - startTime;
              const firstTokenLatency = firstTokenTime ? firstTokenTime - startTime : 0;
              
              totalResponseTime += totalTime;
              successfulStreams++;
              
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
              
              console.log('chat-completions-stream: completed', {
                totalTime,
                firstTokenLatency,
                tokenCount,
                contentLength: fullContent.length,
                tokensPerSecond: Math.round(tokenCount / (totalTime / 1000))
              });
              
              break;
            }

            // Process streaming chunks
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
                      console.log('chat-completions-stream: first token received', {
                        latency: firstTokenTime - startTime
                      });
                    }
                    
                    fullContent += delta.content;
                    tokenCount++;
                    
                    // Send token data
                    controller.enqueue(encoder.encode('event: token\n'));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      token: delta.content,
                      content: fullContent,
                      tokenCount
                    })}\n\n`));
                  }
                } catch (error) {
                  console.warn('Failed to parse SSE data:', data);
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
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error) {
    console.error('chat-completions-stream error:', error);
    const responseTime = Date.now() - startTime;
    
    // Return error as SSE stream for consistency
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
      status: 200, // Keep 200 for SSE
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
});