
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SearchPayload = {
  query: string;
  limit?: number;
};

async function createEmbedding(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get("OPENAI_EMBEDDINGS_API_KEY") || Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("Missing OPENAI_EMBEDDINGS_API_KEY/OPENAI_API_KEY secret");
    return null;
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
      encoding_format: "float",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI embeddings error:", err);
    return null;
  }

  const json = await res.json();
  return json.data?.[0]?.embedding ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { query, limit = 10 } = (await req.json()) as SearchPayload;
    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ items: [] }), { headers: corsHeaders });
    }

    const embedding = await createEmbedding(query);
    if (!embedding) {
      return new Response(JSON.stringify({ error: "Embedding error" }), { status: 500, headers: corsHeaders });
    }

    const { data, error } = await supabase.rpc("match_job_posts", {
      query_embedding: embedding as unknown as number[],
      match_count: limit,
    });

    if (error) {
      console.error("match_job_posts error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ items: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jobs-search-ai error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
