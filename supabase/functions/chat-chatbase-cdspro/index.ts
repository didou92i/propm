import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHATBASE_API_URL = 'https://www.chatbase.co/api/v1/chat';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get secrets
    const chatbaseApiKey = Deno.env.get('CHATBASE_API_KEY');
    const chatbotId = Deno.env.get('CHATBASE_CDSPRO_CHATBOT_ID');

    if (!chatbaseApiKey || !chatbotId) {
      throw new Error('Chatbase configuration missing');
    }

    // Parse request
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    console.log('Chatbase CDS Pro request:', {
      userId: user.id,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });

    // Format for Chatbase API
    const chatbasePayload = {
      messages: messages.map(m => ({
        content: m.content,
        role: m.role
      })),
      chatbotId: chatbotId,
      stream: true,
      temperature: 0
    };

    // Call Chatbase API
    const chatbaseResponse = await fetch(CHATBASE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chatbaseApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatbasePayload)
    });

    if (!chatbaseResponse.ok) {
      const errorText = await chatbaseResponse.text();
      console.error('Chatbase API error:', {
        status: chatbaseResponse.status,
        statusText: chatbaseResponse.statusText,
        body: errorText
      });

      // Handle specific error codes
      if (chatbaseResponse.status === 401) {
        throw new Error('Erreur d\'authentification Chatbase - Vérifiez votre clé API');
      } else if (chatbaseResponse.status === 404) {
        throw new Error('Chatbot CDS Pro introuvable - Vérifiez l\'ID du chatbot');
      } else if (chatbaseResponse.status === 429) {
        throw new Error('Trop de requêtes - Veuillez réessayer dans quelques instants');
      } else {
        throw new Error(`Erreur Chatbase: ${chatbaseResponse.status} - ${errorText}`);
      }
    }

    const firstTokenLatency = Date.now() - startTime;
    console.log('Chatbase first token latency:', firstTokenLatency, 'ms');

    // Return the stream directly (Chatbase returns plain text, not SSE)
    return new Response(chatbaseResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-First-Token-Latency': firstTokenLatency.toString()
      }
    });

  } catch (error) {
    console.error('chat-chatbase-cdspro error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
