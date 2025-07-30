import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  cleanup_date: string;
  deleted_conversations: number;
  deleted_messages: number;
  deleted_documents: number;
  total_deleted: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for cleanup operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting automatic data cleanup...');

    // Call the cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_old_data');

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
      throw cleanupError;
    }

    const result = cleanupResult as CleanupResult;
    
    console.log('Cleanup completed successfully:', {
      cleanupDate: result.cleanup_date,
      deletedConversations: result.deleted_conversations,
      deletedMessages: result.deleted_messages,
      deletedDocuments: result.deleted_documents,
      totalDeleted: result.total_deleted
    });

    // Get system stats after cleanup
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_system_stats');

    if (statsError) {
      console.warn('Could not fetch system stats:', statsError);
    }

    const response = {
      success: true,
      cleanup: result,
      timestamp: new Date().toISOString(),
      stats: statsData || null
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });

  } catch (error) {
    console.error('Cleanup function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500
    });
  }
});