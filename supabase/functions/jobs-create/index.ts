
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateJobPayload = {
  title: string;
  commune: string;
  description: string;
  skills?: string[];
  contact: string;
  deadline?: string | null;
};

type OpenAIEmbeddingResponse = {
  data: { embedding: number[] }[];
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

  const json = (await res.json()) as OpenAIEmbeddingResponse;
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

    const {
      title, commune, description, skills = [], contact, deadline = null,
    } = (await req.json()) as CreateJobPayload;

    // Basic validations mirrored to DB constraints
    if (!title || title.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid title" }), { status: 400, headers: corsHeaders });
    }
    if (!commune) {
      return new Response(JSON.stringify({ error: "Commune is required" }), { status: 400, headers: corsHeaders });
    }
    if (!description || description.length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid description" }), { status: 400, headers: corsHeaders });
    }
    if (!contact) {
      return new Response(JSON.stringify({ error: "Contact is required" }), { status: 400, headers: corsHeaders });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const authorId = userData.user.id;

    // Ensure profile exists to satisfy FK constraint
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", authorId)
      .maybeSingle();

    if (!existingProfile) {
      // Best-effort creation; ignore error if already exists or blocked
      await supabase
        .from("profiles")
        .insert({
          user_id: authorId,
          display_name: (userData.user.user_metadata as any)?.display_name ?? null,
        })
        .select("user_id")
        .maybeSingle();
    }

    const textForEmbedding = [title, description, skills.join(" ")].filter(Boolean).join("\n\n");
    const embedding = await createEmbedding(textForEmbedding);

    const { data, error } = await supabase
      .from("job_posts")
      .insert({
        author_id: authorId,
        title,
        commune,
        description,
        skills,
        contact,
        deadline: deadline ? deadline : null,
        status: "pending",
        is_active: true,
        embedding: embedding ?? null,
      })
      .select("id, status")
      .single();

    if (error) {
      console.error("Insert job_post error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ id: data.id, status: data.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jobs-create error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
