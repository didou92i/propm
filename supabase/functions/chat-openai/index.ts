
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const openAIEmbeddingsKey = Deno.env.get('OPENAI_EMBEDDINGS_API_KEY') || openAIApiKey;
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create both service role client for admin operations and auth client for user validation
const supabaseAdmin = createClient(supabaseUrl!, supabaseKey!);

function createUserClient(authHeader: string) {
  return createClient(
    supabaseUrl!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
}

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
    console.log('=== CHAT REQUEST START ===');
    
    // Get user from JWT token
    console.log('Step 1: Authenticating user...');
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      console.error('ERROR: No authorization header provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No authorization header provided' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userSupabase = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error('ERROR: Authentication failed:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication failed',
        details: authError?.message || 'No user found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✓ User authenticated successfully:', user.id);

    const { messages, selectedAgent, userSession, hasAttachments } = await req.json();
    
    console.log(`Step 2: Request data - User: ${user.id}, Agent: ${selectedAgent}, Session: ${userSession}, Has attachments: ${hasAttachments}`);
    
    // Get the latest user message for document search
    const latestUserMessage = messages[messages.length - 1]?.content || '';

    if (!openAIApiKey) {
      console.error('ERROR: OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Step 3: OpenAI API key verified');

    // Assistant IDs mapping
    const assistantIds = {
      redacpro: "asst_nVveo2OzbB2h8uHY2oIDpob1",
      cdspro: "asst_ljWenYnbNEERVydsDaeVSHVl", 
      arrete: "asst_e4AMY6vpiqgqFwbQuhNCbyeL"
    };

    const assistantId = assistantIds[selectedAgent as keyof typeof assistantIds] || assistantIds.redacpro;
    console.log('Step 4: Using assistant:', assistantId);

    // Check if conversation exists for this session and agent
    console.log('Step 5: Checking for existing conversation...');
    const { data: existingConversation, error: convError } = await userSupabase
      .from('conversations')
      .select('id, thread_id')
      .eq('user_session', userSession)
      .eq('agent_type', selectedAgent)
      .eq('user_id', user.id)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      console.error('ERROR: Conversation lookup failed:', convError.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database error during conversation lookup',
        details: convError.message
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let threadId: string;
    let conversationId: string;

    if (existingConversation) {
      // Use existing thread
      threadId = existingConversation.thread_id;
      conversationId = existingConversation.id;
      
      console.log(`Using existing thread: ${threadId}`);
      
      // Check for active runs on the thread and cancel them if needed
      try {
        const runsResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs?limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (runsResponse.ok) {
          const runsData = await runsResponse.json();
          const activeRuns = runsData.data?.filter((run: any) => 
            ['queued', 'in_progress', 'requires_action'].includes(run.status)
          ) || [];

          // Cancel any active runs
          for (const activeRun of activeRuns) {
            console.log(`Cancelling active run: ${activeRun.id}`);
            await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${activeRun.id}/cancel`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'OpenAI-Beta': 'assistants=v2'
              }
            });
          }
        }
      } catch (runCheckError) {
        console.warn('Error checking/cancelling runs:', runCheckError);
        // Continue anyway
      }
      
      // Update conversation timestamp
      await userSupabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      // Create new thread
      console.log('Creating new thread...');
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        const errorData = await threadResponse.json();
        console.error('ERROR: Thread creation failed:', errorData);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Thread creation failed',
          details: errorData.error?.message || 'Unknown OpenAI error'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const threadData = await threadResponse.json();
      threadId = threadData.id;
      console.log(`Created new thread: ${threadId}`);

      // Create new conversation record
      const { data: newConversation } = await userSupabase
        .from('conversations')
        .insert({
          thread_id: threadId,
          user_session: userSession,
          agent_type: selectedAgent,
          user_id: user.id
        })
        .select('id')
        .single();

      conversationId = newConversation!.id;
    }

    // Get latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Enhanced document search for messages with attachments
    let documentContext = '';
    if (!hasAttachments) {
      // Only search existing documents if no attachments are provided
      try {
        console.log('Searching for relevant documents...');
        // Generate embedding for the user message
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIEmbeddingsKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: latestUserMessage,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingResult = await embeddingResponse.json();
          const queryEmbedding = embeddingResult.data[0]?.embedding;

          if (queryEmbedding) {
            // Search for similar documents using authenticated client
            const { data: relevantDocs } = await userSupabase.rpc('match_documents', {
              query_embedding: queryEmbedding,
              match_count: 3,
              filter: {}
            });

            if (relevantDocs && relevantDocs.length > 0) {
              console.log(`Found ${relevantDocs.length} relevant documents`);
              documentContext = '\n\n--- CONTEXTE DOCUMENTAIRE ---\n' +
                relevantDocs.map((doc: any, index: number) => 
                  `Document ${index + 1} (similarité: ${(doc.similarity * 100).toFixed(1)}%):\n${doc.content.substring(0, 1000)}...`
                ).join('\n\n') +
                '\n--- FIN DU CONTEXTE DOCUMENTAIRE ---\n\n';
            }
          }
        }
      } catch (docError) {
        console.error('Document search error:', docError);
        // Continue without document context if search fails
      }
    }

    // Store user message in database
    await userSupabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: latestMessage.content
      });

    // Add message to OpenAI thread with document context
    let messageContent = latestMessage.content;
    
    // Add system context for attachments
    if (hasAttachments) {
      console.log('Processing message with attachments');
      const attachmentPrefix = "L'utilisateur a joint des documents à sa question. Le contenu de ces documents est inclus dans le message ci-dessous. Utilisez ces informations pour répondre de manière pertinente et précise en vous basant sur le contenu des documents fournis.\n\n";
      messageContent = attachmentPrefix + messageContent;
    } else if (documentContext) {
      console.log('Adding document context from database');
      messageContent = documentContext + messageContent;
    }

    console.log('Adding message to thread...');
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: messageContent
      })
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      console.error('ERROR: Message creation failed:', errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message creation failed',
        details: errorData.error?.message || 'Unknown OpenAI error'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a run with retry logic
    console.log('Creating run...');
    let runResponse;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });

      if (runResponse.ok) {
        break;
      }

      const errorData = await runResponse.json();
      if (errorData.error?.message?.includes('already has an active run')) {
        console.log(`Attempt ${attempts + 1}: Thread has active run, retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } else {
        throw new Error(`Run creation error: ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    if (!runResponse || !runResponse.ok) {
      throw new Error('Failed to create run after multiple attempts');
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log(`Created run: ${runId}`);

    // Poll for completion
    let runStatus = 'queued';
    let attempts_poll = 0;
    const maxAttempts = 60; // 30 seconds timeout

    console.log('Polling for run completion...');
    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts_poll < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log(`Run status: ${runStatus}`);
      }
      
      attempts_poll++;
    }

    if (runStatus !== 'completed') {
      console.error(`ERROR: Run did not complete. Final status: ${runStatus}, Attempts: ${attempts_poll}/${maxAttempts}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenAI run did not complete',
        details: `Status: ${runStatus}, polling attempts: ${attempts_poll}/${maxAttempts}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get messages from the thread
    console.log('Retrieving assistant response...');
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json();
      throw new Error(`Messages retrieval error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant response found');
    }

    const assistantMessage = assistantMessages[0].content[0].text.value;

    // Store assistant message in database
    await userSupabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

    // Clean up old messages (keep only last 10 messages per conversation)
    const { data: messageCount } = await userSupabase
      .from('conversation_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId);

    if (messageCount && messageCount.length > 20) { // 20 = 10 user + 10 assistant messages
      const { data: oldMessages } = await userSupabase
        .from('conversation_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(messageCount.length - 20);

      if (oldMessages && oldMessages.length > 0) {
        await userSupabase
          .from('conversation_messages')
          .delete()
          .in('id', oldMessages.map(m => m.id));
      }
    }

    console.log('Chat response completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('CRITICAL ERROR in chat-openai function:', error);
    console.error('Stack trace:', error.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unexpected error occurred',
      details: error.stack || 'No stack trace available'
    }), {
      status: 200,  // Changed from 500 to 200 to avoid non-2xx errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
