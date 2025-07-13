import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, selectedAgent } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Agent system prompts
    const agentPrompts = {
      redacpro: "Vous êtes un assistant spécialisé dans la rédaction professionnelle pour les administrations municipales. Vous aidez à rédiger des documents officiels, des courriers administratifs, et des communications publiques avec un style formel et approprié.",
      juridique: "Vous êtes un assistant juridique spécialisé dans le droit municipal et administratif français. Vous aidez à comprendre la réglementation, les procédures administratives, et fournissez des conseils juridiques dans le contexte municipal.",
      citoyen: "Vous êtes un assistant pour l'accueil et l'information des citoyens. Vous aidez à expliquer les démarches administratives, les services municipaux, et répondez aux questions des administrés de manière claire et accessible.",
      technique: "Vous êtes un assistant technique spécialisé dans la gestion des infrastructures municipales, l'urbanisme, et les projets techniques. Vous aidez avec les aspects techniques des projets municipaux et de l'aménagement."
    };

    const systemPrompt = agentPrompts[selectedAgent as keyof typeof agentPrompts] || agentPrompts.redacpro;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      success: true, 
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-openai function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});