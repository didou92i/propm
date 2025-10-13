import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { messages, selectedAgent, systemPrompt } = await req.json();

    console.log(`chat-direct-openai: incoming request`, {
      selectedAgent,
      messageCount: messages?.length,
      hasSystemPrompt: !!systemPrompt
    });

    // Appel DIRECT à l'API Chat Completions (pas d'Assistant, pas de thread)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07', // GPT-5 pour chat complexe
        messages: [
          { 
            role: 'system', 
            content: systemPrompt || `Tu es ${selectedAgent}, assistant expert.` 
          },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        reasoning_effort: 'medium', // Équilibre qualité/rapidité
        max_completion_tokens: 2000, // Nouveau paramètre GPT-5
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Détecter erreurs paramètres GPT-5 incompatibles
      if (errorText.includes('temperature') || errorText.includes('top_p') || errorText.includes('max_tokens')) {
        console.error('chat-direct-openai: Paramètre GPT-5 incompatible détecté', errorText);
        throw new Error('Configuration GPT-5 invalide - vérifier les paramètres');
      }
      
      console.error('chat-direct-openai: OpenAI API error', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`chat-direct-openai: success`, {
      selectedAgent,
      contentLength: content?.length,
      tokensUsed: data.usage
    });

    return new Response(JSON.stringify({ 
      content,
      model: 'gpt-5-2025-08-07',
      directAPI: true,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('chat-direct-openai: error', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
