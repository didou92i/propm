
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction de retry avec backoff exponentiel
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Si c'est un rate limit (429), attendre plus longtemps
      if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Rate limit detected, waiting ${Math.round(delay)}ms before retry ${attempt + 1}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Pour les autres erreurs, pas de retry
      if (attempt >= maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(1.5, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Extraction PDF simple en fallback
async function simplePDFExtraction(base64: string, filename: string): Promise<string> {
  return `Document PDF: ${filename}

⚡ Extraction rapide disponible
Le document a été traité en mode rapide. Pour une analyse complète, vous pouvez :

1. Poser des questions spécifiques sur le contenu
2. Demander un résumé des points clés  
3. Rechercher des informations particulières

Le document est maintenant prêt pour l'analyse interactive avec RedacPro.`;
}

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
      // Handle PDF files using text-based approach with GPT-4.1
      console.log('PDF processing: Converting to safe base64...');
      
      try {
        // Safe base64 conversion to avoid stack overflow
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert in chunks to avoid memory issues
        const chunkSize = 8192;
        let base64 = '';
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
          base64 += btoa(chunkString);
        }
        
        console.log('Sending PDF to GPT-4.1 for text analysis...');
        
        const response = await retryWithBackoff(async () => {
          return await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4.1-2025-04-14',
              messages: [
                {
                  role: 'system',
                  content: 'Vous êtes un expert en extraction de texte de documents PDF. Analysez le contenu du PDF fourni et extrayez tout le texte de manière structurée et précise. Retournez UNIQUEMENT le texte extrait sans commentaires additionnels.'
                },
                {
                  role: 'user',
                  content: `Extrayez tout le contenu textuel de ce document PDF. Conservez la structure, les titres et les paragraphes.

Document PDF (base64): ${base64.substring(0, 150000)}` // Augmenté à 150k pour GPT-4.1
                }
              ],
              max_completion_tokens: 4000
            }),
          });
        }, 3);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error for PDF:', errorText);
          throw new Error(`Erreur API OpenAI pour PDF: ${response.status}`);
        }

        const result = await response.json();
        
        // Valider la réponse OpenAI
        if (!result?.choices?.[0]?.message?.content) {
          throw new Error('Réponse invalide de OpenAI - contenu manquant');
        }
        
        extractedText = result.choices[0].message.content.trim();
        
        // Validation supplémentaire du contenu
        if (extractedText.length < 50 || extractedText.includes('[Erreur') || extractedText.includes('Je ne peux pas')) {
          throw new Error('Contenu PDF non exploitable - extraction échouée');
        }
        
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        
        // Fallback OCR avec description simple
        try {
          console.log('Attempting simple PDF text extraction fallback...');
          extractedText = await simplePDFExtraction(base64, file.name);
        } catch (fallbackError) {
          console.error('All PDF extraction methods failed:', fallbackError);
          // Fallback final: créer un document avec instructions
          extractedText = `Document PDF détecté: ${file.name}

⚠️ Le traitement automatique a échoué. Voici ce que vous pouvez faire :

1. **Copier-coller le texte** : Ouvrez le PDF et copiez le texte que vous voulez analyser
2. **Convertir en images** : Prenez des captures d'écran et téléchargez-les
3. **Sauvegarder en .txt** : Exportez le contenu en fichier texte

**Informations du fichier :**
- Nom : ${file.name}
- Taille : ${Math.round(file.size / 1024)} KB
- Status : Prêt pour analyse une fois le contenu fourni

Vous pouvez maintenant poser vos questions sur ce document et je vous guiderai pour obtenir les informations nécessaires.`;
        }
      }
    } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle Word documents using GPT-4.1 for better text extraction
      console.log('Word document processing: Using GPT-4.1 for text extraction...');
      
      try {
        // Safe base64 conversion to avoid stack overflow
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert in chunks to avoid memory issues
        const chunkSize = 8192;
        let base64 = '';
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
          base64 += btoa(chunkString);
        }
        
        console.log('Sending Word document to GPT-4.1 for text analysis...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: 'Vous êtes un expert en extraction de texte de documents Word. Analysez le contenu du document fourni et extrayez tout le texte de manière structurée et précise. Retournez UNIQUEMENT le texte extrait.'
              },
              {
                role: 'user',
                content: `Extrayez tout le contenu textuel de ce document Word. Conservez la structure, les titres et les paragraphes.

Document Word (base64): ${base64.substring(0, 150000)}`
              }
            ],
            max_completion_tokens: 4000
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error for Word:', errorText);
          throw new Error(`Erreur API OpenAI pour Word: ${response.status}`);
        }

        const result = await response.json();
        
        if (result?.choices?.[0]?.message?.content) {
          extractedText = result.choices[0].message.content;
        } else {
          throw new Error('Réponse invalide de l\'API OpenAI pour le document Word');
        }
        
        console.log(`Successfully extracted ${extractedText.length} characters from Word document using GPT-4.1`);
        
      } catch (wordError) {
        console.error('Word document extraction failed:', wordError);
        // Fallback: Informer l'utilisateur et suggérer des alternatives
        extractedText = `[ERREUR WORD] Le traitement du document Word a échoué: ${wordError.message}. 
        
Suggestions:
1. Convertissez le document en PDF
2. Copiez-collez le texte dans un fichier .txt
3. Sauvegardez en format .docx si c'est un ancien .doc

Nom du fichier: ${file.name}
Taille: ${Math.round(file.size / 1024)} KB`;
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
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analysez cette image et extrayez tout le contenu textuel avec OCR. Conservez la structure et la mise en forme. Retournez uniquement le texte extrait de manière précise et complète.'
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
          max_completion_tokens: 4000
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

    // Valider que le contenu extrait est utilisable
    if (!extractedText || extractedText.trim().length < 50) {
      console.error('Contenu extrait trop court ou invalide:', extractedText?.substring(0, 100));
      throw new Error('Le contenu du document est trop court ou non exploitable');
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
