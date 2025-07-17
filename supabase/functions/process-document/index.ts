import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedText = '';
    
    // Extract text based on file type
    if (file.type === 'text/plain') {
      // Handle plain text files
      extractedText = await file.text();
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'll use OpenAI to extract content
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Use OpenAI vision API to extract text from PDF
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text content from this document. Preserve the structure and formatting as much as possible. Return only the extracted text content.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        }),
      });

      const result = await response.json();
      extractedText = result.choices[0]?.message?.content || '';
    } else if (file.type.startsWith('image/')) {
      // Handle image files with OCR
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text content from this image using OCR. Return only the extracted text content, preserving the structure when possible.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        }),
      });

      const result = await response.json();
      extractedText = result.choices[0]?.message?.content || '';
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the document');
    }

    console.log(`Extracted text length: ${extractedText.length} characters`);

    // Generate embeddings for the extracted text
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: extractedText,
      }),
    });

    const embeddingResult = await embeddingResponse.json();
    const embedding = embeddingResult.data[0]?.embedding;

    if (!embedding) {
      throw new Error('Failed to generate embeddings');
    }

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    // Store the document in the database
    const metadata = {
      filename: file.name,
      filesize: file.size,
      filetype: file.type,
      processed_at: new Date().toISOString(),
      extraction_method: file.type.startsWith('image/') ? 'ocr' : 
                        file.type === 'application/pdf' ? 'vision_api' : 'direct'
    };

    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        content: extractedText,
        embedding: embedding,
        metadata: metadata
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to store document: ${insertError.message}`);
    }

    console.log(`Document stored with ID: ${document.id}`);

    return new Response(JSON.stringify({
      success: true,
      documentId: document.id,
      extractedTextLength: extractedText.length,
      metadata: metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});