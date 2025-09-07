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

  console.log('🎯 [VISUAL-GEN] Début de la génération visuelle');
  console.log('🔑 [API-KEY] OpenAI API Key présente:', !!openAIApiKey);

  try {
    const requestBody = await req.json();
    console.log('📥 [REQUEST] Body reçu:', JSON.stringify(requestBody, null, 2));
    
    const { context, scenario, visualType, domain } = requestBody;

    // Validation des paramètres
    if (!context || !scenario || !visualType || !domain) {
      console.error('❌ [VALIDATION] Paramètres manquants:', { context: !!context, scenario: !!scenario, visualType: !!visualType, domain: !!domain });
      throw new Error('Paramètres manquants: context, scenario, visualType et domain sont requis');
    }

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
    console.log('📝 [PROMPT] Prompt généré:', prompt.substring(0, 200) + '...');
    console.log('🎨 [PARAMS] Type:', visualType, 'Domaine:', domain);

    // Configuration de la requête OpenAI pour GPT-Image-1
    const requestPayload = {
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      output_format: 'webp',
      quality: 'high'
    };

    console.log('🚀 [OPENAI-REQ] Payload envoyé:', JSON.stringify(requestPayload, null, 2));
    console.log('🌐 [OPENAI-REQ] Endpoint: /v1/images/generations');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('📡 [OPENAI-RESP] Status:', response.status, response.statusText);
    console.log('📡 [OPENAI-RESP] Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OPENAI-ERROR] Réponse brute:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('❌ [OPENAI-ERROR] Erreur parsée:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.error('❌ [PARSE-ERROR] Impossible de parser l\'erreur:', parseError);
        errorData = { error: { message: errorText } };
      }
      
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || errorText}`);
    }

    const responseText = await response.text();
    console.log('📄 [OPENAI-RESP] Réponse brute (100 premiers chars):', responseText.substring(0, 100));
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ [OPENAI-RESP] JSON parsé avec succès');
      console.log('📊 [OPENAI-RESP] Structure:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ [PARSE-ERROR] Impossible de parser la réponse JSON:', parseError);
      throw new Error('Réponse OpenAI invalide: impossible de parser le JSON');
    }
    
    // Extract image from GPT-Image-1 response (format standard images/generations)
    let imageData;
    
    if (data.data && data.data.length > 0) {
      console.log('🔍 [IMAGE-EXTRACT] Tentative extraction depuis data[0]');
      imageData = data.data[0].b64_json || data.data[0].url;
      console.log('🔍 [IMAGE-EXTRACT] Type de données trouvées:', typeof imageData, 'Longueur:', imageData?.length || 0);
    }
    
    if (!imageData) {
      console.error('❌ [IMAGE-EXTRACT] Aucune donnée image trouvée');
      console.error('❌ [IMAGE-EXTRACT] Structure data:', JSON.stringify(data, null, 2));
      throw new Error('Aucune donnée image trouvée dans la réponse GPT-Image-1');
    }

    console.log('✅ [SUCCESS] Image générée avec succès');
    console.log('📏 [SUCCESS] Taille de l\'image base64:', imageData.length, 'caractères');

    const resultPayload = { 
      image: imageData.startsWith('data:') ? imageData : `data:image/webp;base64,${imageData}`,
      visualType,
      domain,
      prompt: prompt.substring(0, 150) + '...'
    };

    console.log('📤 [RESPONSE] Payload de retour préparé:', {
      ...resultPayload,
      image: resultPayload.image.substring(0, 50) + '...(truncated)'
    });

    return new Response(JSON.stringify(resultPayload), {
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