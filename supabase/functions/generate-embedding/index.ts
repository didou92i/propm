
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIEmbeddingsKey = Deno.env.get('OPENAI_EMBEDDINGS_API_KEY') || Deno.env.get('OPENAI_API_KEY');

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
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (!openAIEmbeddingsKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating embedding for text: ${text.substring(0, 100)}...`);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIEmbeddingsKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      console.error('Invalid embedding response structure:', result);
      throw new Error('Invalid response from embeddings API');
    }

    const embedding = result.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      console.error('Invalid embedding data:', result.data[0]);
      throw new Error('Failed to generate valid embeddings');
    }

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    return new Response(JSON.stringify({
      success: true,
      embedding: embedding,
      dimensions: embedding.length,
      model: 'text-embedding-3-small'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-embedding function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred',
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
