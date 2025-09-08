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

    // Determine number of images and types based on context complexity
    const shouldGenerateMultiple = (context.length > 200 || scenario.includes('accident') || scenario.includes('contrôle') || scenario.includes('infraction'));
    const numberOfImages = shouldGenerateMultiple ? Math.min(3, Math.floor(Math.random() * 2) + 2) : 1;
    
    console.log('🔢 [MULTI-GEN] Génération de', numberOfImages, 'image(s) selon le contexte');

    // Generate contextual prompts based on training content
    const visualPrompts = {
      'press_clipping': `Create a realistic French newspaper clipping about: ${scenario}. Professional newspaper layout with headline, article text, and publication details. Context: ${context}`,
      'official_document': `Generate an official French administrative document related to: ${scenario}. Professional letterhead, official stamps, formal legal language. Context: ${context}`,
      'social_media': `Create a realistic social media post screenshot about: ${scenario}. Include profile picture, post content, engagement metrics. Context: ${context}`,
      'field_photo': `Generate a realistic photograph of the situation: ${scenario}. Professional documentary style, clear details relevant to the case. Context: ${context}`,
      'infraction_scene': `Create a realistic photo of an infraction scene: ${scenario}. Documentary style showing the violation clearly. Context: ${context}`,
      'legal_form': `Generate an official French legal form or report related to: ${scenario}. Professional administrative layout. Context: ${context}`
    };

    // Select visual types based on context
    const getVisualTypes = (primaryType: string, count: number) => {
      const types = [primaryType];
      const alternatives = ['field_photo', 'official_document', 'press_clipping'];
      
      for (let i = 1; i < count; i++) {
        const available = alternatives.filter(t => !types.includes(t));
        if (available.length > 0) {
          types.push(available[Math.floor(Math.random() * available.length)]);
        }
      }
      return types;
    };

    const visualTypes = getVisualTypes(visualType, numberOfImages);
    const images = [];
    
    console.log('🎨 [TYPES] Types d\'images à générer:', visualTypes);

    // Generate images sequentially to avoid rate limits
    for (let i = 0; i < visualTypes.length; i++) {
      const currentType = visualTypes[i];
      const prompt = visualPrompts[currentType] || visualPrompts['field_photo'];
      
      console.log(`📝 [PROMPT-${i+1}] Type: ${currentType}, Prompt:`, prompt.substring(0, 200) + '...');

      // Configuration optimisée de la requête OpenAI pour GPT-Image-1
      const requestPayload = {
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024', // Format supporté par OpenAI
        output_format: 'webp',
        quality: 'medium', // Réduit de 'high' pour performance
        output_compression: 70 // Ajoute compression pour réduire la taille
      };

      console.log(`🚀 [OPENAI-REQ-${i+1}] Payload envoyé:`, JSON.stringify(requestPayload, null, 2));
      console.log(`🌐 [OPENAI-REQ-${i+1}] Endpoint: /v1/images/generations`);

      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        console.log(`📡 [OPENAI-RESP-${i+1}] Status:`, response.status, response.statusText);
        console.log(`📡 [OPENAI-RESP-${i+1}] Headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [OPENAI-ERROR-${i+1}] Réponse brute:`, errorText);
          
          // Continue avec l'image suivante en cas d'erreur
          console.warn(`⚠️ [SKIP-${i+1}] Image ${i+1} échouée, passage à la suivante`);
          continue;
        }

        const responseText = await response.text();
        console.log(`📄 [OPENAI-RESP-${i+1}] Réponse brute (100 premiers chars):`, responseText.substring(0, 100));
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`✅ [OPENAI-RESP-${i+1}] JSON parsé avec succès`);
        } catch (parseError) {
          console.error(`❌ [PARSE-ERROR-${i+1}] Impossible de parser la réponse JSON:`, parseError);
          continue;
        }
        
        // Extract image from GPT-Image-1 response
        let imageData;
        
        if (data.data && data.data.length > 0) {
          console.log(`🔍 [IMAGE-EXTRACT-${i+1}] Tentative extraction depuis data[0]`);
          imageData = data.data[0].b64_json || data.data[0].url;
          console.log(`🔍 [IMAGE-EXTRACT-${i+1}] Type de données trouvées:`, typeof imageData, 'Longueur:', imageData?.length || 0);
        }
        
        if (!imageData) {
          console.error(`❌ [IMAGE-EXTRACT-${i+1}] Aucune donnée image trouvée`);
          continue;
        }

        console.log(`✅ [SUCCESS-${i+1}] Image ${i+1} générée avec succès`);
        console.log(`📏 [SUCCESS-${i+1}] Taille de l'image base64:`, imageData.length, 'caractères');

        // Ajouter l'image à la collection
        images.push({
          image: imageData.startsWith('data:') ? imageData : `data:image/webp;base64,${imageData}`,
          visualType: currentType,
          domain,
          prompt: prompt.substring(0, 150) + '...'
        });

        // Petite pause entre les générations pour éviter le rate limit
        if (i < visualTypes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ [ERROR-${i+1}] Erreur lors de la génération de l'image ${i+1}:`, error);
        continue;
      }
    }

    // Vérification qu'au moins une image a été générée
    if (images.length === 0) {
      console.error('❌ [FINAL-ERROR] Aucune image n\'a pu être générée');
      throw new Error('Échec de la génération de toutes les images');
    }

    console.log(`🎉 [FINAL-SUCCESS] ${images.length} image(s) générée(s) avec succès sur ${numberOfImages} demandée(s)`);

    const resultPayload = {
      images: images,
      totalGenerated: images.length,
      requestedCount: numberOfImages,
      visualTypes: visualTypes
    };

    console.log('📤 [RESPONSE] Payload de retour préparé:', {
      ...resultPayload,
      images: resultPayload.images.map((img, idx) => ({
        ...img,
        image: img.image.substring(0, 50) + '...(truncated)'
      }))
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