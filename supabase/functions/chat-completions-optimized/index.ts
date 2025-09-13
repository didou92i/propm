import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { AgentConfigService } from '../_shared/agentConfigService.ts';
import { StreamProcessor } from '../_shared/streamProcessor.ts';
import { AuthService } from '../_shared/authService.ts';
import { corsHeaders, handleCorsPreflightRequest, createStreamHeaders } from '../_shared/corsConfig.ts';
import { PerformanceTracker } from '../_shared/performanceTracker.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const REQUEST_TIMEOUT = 30000; // 30 seconds max

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  const startTime = Date.now();
  PerformanceTracker.incrementRequests();
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout after 30 seconds')), REQUEST_TIMEOUT);
  });

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
    
    PerformanceTracker.logRequest('chat-completions-optimized', {
      userId: user.id,
      selectedAgent,
      messagesCount: messages?.length || 0
    });

    // Try dynamic config first, fallback to static
    let agentConfig = await AgentConfigService.getDynamicConfig(supabaseAdmin, user.id, selectedAgent);
    
    if (!agentConfig) {
      console.log('Using fallback config for', selectedAgent);
      agentConfig = AgentConfigService.getConfig(selectedAgent);
    } else {
      console.log('Using dynamic config for', selectedAgent);
    }
    
    const conversationMessages = AgentConfigService.formatConversationMessages(messages, agentConfig.systemPrompt);
    const requestBody = AgentConfigService.buildOpenAIRequestBody(agentConfig, conversationMessages);

    PerformanceTracker.logOpenAIRequest('chat-completions-optimized', {
      agent: selectedAgent,
      model: agentConfig.model,
      messageCount: conversationMessages.length
    });

    const openAIRequest = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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

    const streamProcessor = new StreamProcessor({ startTime, isOptimized: true });
    const stream = streamProcessor.createStream(response);

    return new Response(stream, { headers: createStreamHeaders() });

  } catch (error) {
    console.error('chat-completions-optimized error:', error);
    const responseTime = Date.now() - startTime;
    
    return StreamProcessor.createErrorStream(error.message, responseTime, corsHeaders);
  }
});
