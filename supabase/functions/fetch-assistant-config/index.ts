import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface OpenAIAssistant {
  id: string;
  name: string;
  instructions: string;
  model: string;
  temperature?: number;
  tools?: any[];
}

interface AssistantConfig {
  agentId: string;
  assistantId: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature?: number;
  maxTokens: number;
  retrievedAt: string;
}

// Mapping des noms d'Assistants OpenAI vers nos agent IDs
const ASSISTANT_MAPPING: Record<string, string> = {
  'RedacPro': 'redacpro',
  'CDS Pro': 'cdspro', 
  'CDSPro': 'cdspro',
  'Prepa CDS': 'prepacds',
  'PrépaCD': 'prepacds',
  'ArreteTerritorial': 'arrete',
  'Arrête Territorial': 'arrete'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('fetch-assistant-config: starting fetch for user', user.id);

    // Récupérer tous les Assistants de l'utilisateur
    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const assistants: OpenAIAssistant[] = data.data || [];
    
    console.log('fetch-assistant-config: found assistants', {
      count: assistants.length,
      names: assistants.map(a => a.name)
    });

    // Mapper vers nos configurations
    const configurations: AssistantConfig[] = [];
    
    for (const assistant of assistants) {
      const agentId = findAgentIdForAssistant(assistant.name);
      if (agentId) {
        const config: AssistantConfig = {
          agentId,
          assistantId: assistant.id,
          name: assistant.name,
          systemPrompt: assistant.instructions || '',
          model: assistant.model,
          temperature: assistant.temperature,
          maxTokens: determineMaxTokens(assistant.model),
          retrievedAt: new Date().toISOString()
        };
        configurations.push(config);
        
        console.log('fetch-assistant-config: mapped assistant', {
          name: assistant.name,
          agentId,
          model: assistant.model,
          promptLength: assistant.instructions?.length || 0
        });
      } else {
        console.log('fetch-assistant-config: unmapped assistant', assistant.name);
      }
    }

    // Sauvegarder en cache dans Supabase (table user metadata ou cache dédié)
    if (configurations.length > 0) {
      await cacheConfigurations(user.id, configurations);
    }

    return new Response(JSON.stringify({
      success: true,
      configurations,
      retrievedAt: new Date().toISOString(),
      totalFound: assistants.length,
      mapped: configurations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('fetch-assistant-config error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function findAgentIdForAssistant(assistantName: string): string | null {
  // Recherche exacte d'abord
  if (ASSISTANT_MAPPING[assistantName]) {
    return ASSISTANT_MAPPING[assistantName];
  }
  
  // Recherche partielle (case insensitive)
  const lowerName = assistantName.toLowerCase();
  for (const [mappedName, agentId] of Object.entries(ASSISTANT_MAPPING)) {
    if (lowerName.includes(mappedName.toLowerCase()) || 
        mappedName.toLowerCase().includes(lowerName)) {
      return agentId;
    }
  }
  
  return null;
}

function determineMaxTokens(model: string): number {
  if (model.includes('gpt-4')) return 4000;
  if (model.includes('gpt-3.5')) return 3000;
  if (model.includes('gpt-5')) return 8000;
  return 3000; // default
}

async function cacheConfigurations(userId: string, configs: AssistantConfig[]) {
  try {
    // Stocker dans la table profiles ou créer une table dédiée
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        assistant_configs: configs,
        configs_updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error caching configs:', error);
    } else {
      console.log('Successfully cached configurations for user', userId);
    }
  } catch (error) {
    console.error('Cache error:', error);
  }
}