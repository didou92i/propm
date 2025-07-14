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
    const { messages, selectedAgent, userSession } = await req.json();

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

    // Store user message in database
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: latestMessage.content
      });

    // Add message to OpenAI thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: latestMessage.content
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
