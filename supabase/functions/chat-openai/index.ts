
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseKey!);

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
    const { messages, selectedAgent, userSession, hasAttachments } = await req.json();
    
    // Get the latest user message for document search
    const latestUserMessage = messages[messages.length - 1]?.content || '';

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Assistant IDs mapping
    const assistantIds = {
      redacpro: "asst_nVveo2OzbB2h8uHY2oIDpob1",
      cdspro: "asst_ljWenYnbNEERVydsDaeVSHVl", 
      arrete: "asst_e4AMY6vpiqgqFwbQuhNCbyeL"
    };

    const assistantId = assistantIds[selectedAgent as keyof typeof assistantIds] || assistantIds.redacpro;

    // Check if conversation exists for this session and agent
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id, thread_id')
      .eq('user_session', userSession)
      .eq('agent_type', selectedAgent)
      .single();

    let threadId: string;
    let conversationId: string;

    if (existingConversation) {
      // Use existing thread
      threadId = existingConversation.thread_id;
      conversationId = existingConversation.id;
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      // Create new thread
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
        throw new Error(`Thread creation error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const threadData = await threadResponse.json();
      threadId = threadData.id;

      // Create new conversation record
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          thread_id: threadId,
          user_session: userSession,
          agent_type: selectedAgent
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
        // Generate embedding for the user message
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
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
            // Search for similar documents
            const { data: relevantDocs } = await supabase.rpc('match_documents', {
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
    await supabase
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
      const attachmentPrefix = "L'utilisateur a joint des documents à sa question. Le contenu de ces documents est inclus dans le message ci-dessous. Utilisez ces informations pour répondre de manière pertinente et précise.\n\n";
      messageContent = attachmentPrefix + messageContent;
    } else if (documentContext) {
      messageContent = documentContext + messageContent;
    }

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
      throw new Error(`Message creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    // Create a run
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
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

    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      throw new Error(`Run creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Poll for completion
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds timeout

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
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
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run did not complete. Status: ${runStatus}`);
    }

    // Get messages from the thread
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
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

    // Clean up old messages (keep only last 10 messages per conversation)
    const { data: messageCount } = await supabase
      .from('conversation_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId);

    if (messageCount && messageCount.length > 20) { // 20 = 10 user + 10 assistant messages
      const { data: oldMessages } = await supabase
        .from('conversation_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(messageCount.length - 20);

      if (oldMessages && oldMessages.length > 0) {
        await supabase
          .from('conversation_messages')
          .delete()
          .in('id', oldMessages.map(m => m.id));
      }
    }

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
