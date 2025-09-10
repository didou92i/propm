import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`populate-assistant-config: processing for user ${user.id}`);

    // Default assistant configurations
    const defaultConfigurations = [
      {
        agentId: "redacpro",
        assistantId: "asst_nVveo2OzbB2h8uHY2oIDpob1",
        name: "RedacPro",
        model: "gpt-4o",
        retrievedAt: new Date().toISOString()
      },
      {
        agentId: "cdspro", 
        assistantId: "asst_ljWenYnbNEERVydsDaeVSHVl",
        name: "CDS Pro",
        model: "gpt-4o",
        retrievedAt: new Date().toISOString()
      },
      {
        agentId: "arrete",
        assistantId: "asst_e4AMY6vpiqgqFwbQuhNCbyeL", 
        name: "ArreteTerritorial",
        model: "gpt-4o",
        retrievedAt: new Date().toISOString()
      },
      {
        agentId: "prepacds",
        assistantId: "asst_MxbbQeTimcxV2mYR0KwAPNsu",
        name: "Prepa CDS", 
        model: "gpt-4o",
        retrievedAt: new Date().toISOString()
      }
    ];

    // Update the user's profile with assistant configurations
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        assistant_configurations: defaultConfigurations,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select('assistant_configurations');

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour de la configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('populate-assistant-config: configurations populated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        configurations: defaultConfigurations,
        message: 'Configurations des assistants mises à jour avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('populate-assistant-config error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});