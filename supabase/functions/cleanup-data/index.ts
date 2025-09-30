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
    // Authenticate caller and ensure admin role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client bound to the caller's JWT for auth checks
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.warn('Unauthorized cleanup attempt:', userError);
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const { data: isAdmin, error: roleError } = await supabaseAuth.rpc('is_admin');
    if (roleError || !isAdmin) {
      console.warn('Forbidden cleanup attempt by user:', user?.id, roleError);
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Starting automatic data cleanup by admin:', user.id);

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
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