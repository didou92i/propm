
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour diviser le texte en chunks optimaux
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks.length > 0 ? chunks : [text.substring(0, maxChunkSize)];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with anon key to get user from JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Authentication required');
    }

    console.log(`Processing document for user: ${user.id}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const openAIEmbeddingsKey = Deno.env.get('OPENAI_EMBEDDINGS_API_KEY') || openAIApiKey;
    
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
      // Handle PDF files using OCR via OpenAI Vision API
      console.log('PDF processing: Converting PDF to image format for OCR...');
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        console.log('Sending PDF to OpenAI Vision API for OCR...');
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
                    text: 'Extract all text content from this PDF document. Preserve the structure, formatting, and hierarchy as much as possible. Return only the extracted text content without any commentary.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:application/pdf;base64,${base64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 4000
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error for PDF:', errorText);
          throw new Error(`PDF OCR failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result?.choices?.[0]?.message?.content) {
          console.error('Invalid OpenAI PDF response:', result);
          throw new Error('Failed to extract text from PDF using OCR');
        }

        extractedText = result.choices[0].message.content;
        console.log(`Successfully extracted ${extractedText.length} characters from PDF via OCR`);
        
      } catch (pdfError) {
        console.error('PDF OCR extraction failed:', pdfError);
        throw new Error(`PDF processing failed: ${pdfError.message}. Veuillez vérifier que le PDF contient du texte lisible.`);
      }
    } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle Word documents using a text extraction approach
      console.log('Word document processing: Attempting basic text extraction...');
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // For .docx files (which are ZIP archives), try to extract text
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Simple text extraction from docx by looking for readable content
          const textDecoder = new TextDecoder('utf-8', { fatal: false });
          let rawText = textDecoder.decode(uint8Array);
          
          // Extract readable text patterns from the DOCX content
          const textMatches = rawText.match(/[\w\s\-.,!?:;()'"àáâäéèêëîíôöûùúüÿñç]{10,}/gi);
          
          if (textMatches && textMatches.length > 0) {
            extractedText = textMatches
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (extractedText.length < 10) {
              throw new Error('Contenu textuel insuffisant trouvé dans le document Word');
            }
          } else {
            throw new Error('Aucun texte lisible trouvé dans le document Word');
          }
        } else {
          // For .doc files, the structure is more complex
          throw new Error('Les fichiers .doc (ancien format) ne sont pas supportés. Veuillez convertir en .docx ou PDF.');
        }
        
        console.log(`Successfully extracted ${extractedText.length} characters from Word document`);
        
      } catch (wordError) {
        console.error('Word document extraction failed:', wordError);
        throw new Error(`Échec du traitement Word: ${wordError.message}. Veuillez essayer de convertir le document en PDF ou copier le texte dans un fichier .txt.`);
      }
      
    } else if (file.type.startsWith('image/')) {
      // Handle image files with OCR
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      console.log('Sending image to OpenAI for OCR...');
      
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error for image:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Robust validation for image OCR response
      if (!result || !result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
        console.error('Invalid OpenAI OCR response structure:', result);
        throw new Error('Invalid response from OpenAI API for image OCR');
      }

      const firstChoice = result.choices[0];
      if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
        console.error('Invalid OCR choice structure:', firstChoice);
        throw new Error('Invalid response from OpenAI API - no OCR content');
      }

      extractedText = firstChoice.message.content;
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    if (!extractedText || !extractedText.trim()) {
      throw new Error('No text could be extracted from the document');
    }

    console.log(`Successfully extracted text: ${extractedText.length} characters`);

    // Chunking du texte pour des embeddings plus précis
    const chunks = chunkText(extractedText, 1000); // Chunks de 1000 caractères
    console.log(`Text split into ${chunks.length} chunks for embedding`);

    // Generate embeddings pour chaque chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      console.log(`Generating embedding for chunk ${index + 1}/${chunks.length}`);
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIEmbeddingsKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Embedding API error for chunk ${index + 1}:`, errorText);
        throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
      }

      const embeddingResult = await response.json();
      
      // Robust validation for embedding response
      if (!embeddingResult || !embeddingResult.data || !Array.isArray(embeddingResult.data) || embeddingResult.data.length === 0) {
        console.error('Invalid embedding response structure:', embeddingResult);
        throw new Error('Invalid response from embeddings API');
      }

      const embedding = embeddingResult.data[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        console.error('Invalid embedding data:', embeddingResult.data[0]);
        throw new Error('Failed to generate valid embeddings');
      }

      return {
        chunk,
        embedding,
        chunkIndex: index
      };
    });

    // Await all embedding promises
    const embeddingResults = await Promise.all(embeddingPromises);
    console.log(`Generated ${embeddingResults.length} embeddings with ${embeddingResults[0].embedding.length} dimensions each`);

    // Store each chunk as a separate document in the database
    const documentInserts = embeddingResults.map((result, index) => {
      const metadata = {
        filename: file.name,
        filesize: file.size,
        filetype: file.type,
        processed_at: new Date().toISOString(),
        extraction_method: file.type.startsWith('image/') ? 'ocr' : 
                          file.type === 'application/pdf' ? 'pdf_ocr' : 
                          file.type === 'text/plain' ? 'direct' : 
                          file.type.includes('wordprocessingml') ? 'word_text_extraction' : 'unsupported',
        chunk_index: result.chunkIndex,
        total_chunks: embeddingResults.length,
        is_chunk: embeddingResults.length > 1
      };

      return {
        content: result.chunk,
        embedding: result.embedding,
        user_id: user.id,
        metadata: metadata
      };
    });

    console.log(`Storing ${documentInserts.length} document chunks in database...`);
    const { data: documents, error: insertError } = await supabase
      .from('documents')
      .insert(documentInserts)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to store document chunks: ${insertError.message}`);
    }

    console.log(`${documents.length} document chunks stored successfully`);

    return new Response(JSON.stringify({
      success: true,
      documentIds: documents.map(doc => doc.id),
      extractedText: extractedText,
      extractedTextLength: extractedText.length,
      chunksCount: embeddingResults.length,
      metadata: documentInserts[0]?.metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
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
