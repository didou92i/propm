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
    const { context, scenario, visualType, domain } = await req.json();

    // Generate contextual prompt based on training content
    const visualPrompts = {
      'press_clipping': `Create a realistic French newspaper clipping about: ${scenario}. Professional newspaper layout with headline, article text, and publication details. Context: ${context}`,
      'official_document': `Generate an official French administrative document related to: ${scenario}. Professional letterhead, official stamps, formal legal language. Context: ${context}`,
      'social_media': `Create a realistic social media post screenshot about: ${scenario}. Include profile picture, post content, engagement metrics. Context: ${context}`,
      'field_photo': `Generate a realistic photograph of the situation: ${scenario}. Professional documentary style, clear details relevant to the case. Context: ${context}`,
      'infraction_scene': `Create a realistic photo of an infraction scene: ${scenario}. Documentary style showing the violation clearly. Context: ${context}`,
      'legal_form': `Generate an official French legal form or report related to: ${scenario}. Professional administrative layout. Context: ${context}`
    };

    const prompt = visualPrompts[visualType] || visualPrompts['field_photo'];

    console.log('Generating visual with GPT-Image-1:', { visualType, domain, prompt: prompt.substring(0, 100) + '...' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        tool_choice: { "type": "image_generation" },
        max_completion_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('GPT-Image-1 response structure:', JSON.stringify(data, null, 2));
    
    // Extract image from GPT-Image-1 response structure
    const imageCall = data.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let imageData;
    
    if (imageCall) {
      const parsedCall = JSON.parse(imageCall);
      imageData = parsedCall.image || parsedCall.b64_json || parsedCall.data;
    }
    
    if (!imageData) {
      console.error('No image data found in response:', data);
      throw new Error('No image data found in GPT-Image-1 response');
    }

    console.log('Visual generated successfully');

    return new Response(JSON.stringify({ 
      image: `data:image/webp;base64,${imageData}`,
      visualType,
      domain,
      prompt: prompt.substring(0, 150) + '...'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-training-visuals function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate training visual with GPT-Image-1'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});