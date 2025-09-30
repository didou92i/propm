import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { AgentConfigService } from '../_shared/agentConfigService.ts';
import { StreamProcessor } from '../_shared/streamProcessor.ts';
import { AuthService } from '../_shared/authService.ts';
import { corsHeaders, handleCorsPreflightRequest, createStreamHeaders } from '../_shared/corsConfig.ts';
import { PerformanceTracker } from '../_shared/performanceTracker.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  const startTime = Date.now();
  PerformanceTracker.incrementRequests();

  try {
    AuthService.validateApiKey(Deno.env.get('OPENAI_API_KEY'), 'OpenAI API key');
    
    const { user, error: authError } = await AuthService.authenticateUser(
      supabaseAdmin, 
      req.headers.get('Authorization')
    );
    
    if (authError || !user) {
      throw new Error(authError || 'Authentication failed');
    }

    const { messages, selectedAgent, userSession } = await req.json();
    
    PerformanceTracker.logRequest('chat-completions-stream', {
      userId: user.id,
      selectedAgent,
      messagesCount: messages?.length || 0,
      isStreaming: true
    });

    const agentConfig = AgentConfigService.getConfig(selectedAgent);
    const conversationMessages = AgentConfigService.formatConversationMessages(messages, agentConfig.systemPrompt);

    PerformanceTracker.logOpenAIRequest('chat-completions-stream', {
      agent: selectedAgent,
      model: agentConfig.model,
      messageCount: conversationMessages.length
    });

    // Use legacy API format for this function
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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

    const streamProcessor = new StreamProcessor({ startTime, isOptimized: false });
    const stream = streamProcessor.createStream(response);

    return new Response(stream, { headers: createStreamHeaders() });

  } catch (error) {
    console.error('chat-completions-stream error:', error);
    const responseTime = Date.now() - startTime;
    
    return StreamProcessor.createErrorStream(getErrorMessage(error), responseTime, corsHeaders);
  }
});