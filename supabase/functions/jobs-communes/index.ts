
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Public: uniquement approuvées / actives / non expirées
    const { data, error } = await supabase
      .from("job_posts")
      .select("commune")
      .eq("is_active", true)
      .eq("status", "approved")
      .gt("expires_at", new Date().toISOString());

    if (error) {
      // If table doesn't exist yet, return empty array gracefully (42P01 undefined_table)
      // @ts-ignore
      if (error.code === "42P01" || (typeof error.message === "string" && error.message.includes("does not exist"))) {
        console.error("jobs-communes: table job_posts missing, returning empty list");
        return new Response(JSON.stringify({ communes: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.error("jobs-communes error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    const set = new Set<string>();
    (data ?? []).forEach((row) => {
      if (row.commune) set.add(row.commune);
    });
    const communes = Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));

    return new Response(JSON.stringify({ communes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jobs-communes exception:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
