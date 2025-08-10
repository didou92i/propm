
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ListPayload = {
  page?: number;
  pageSize?: number;
  commune?: string | null;
  dateRange?: "recent" | "week" | "month" | null;
  keywords?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { page = 1, pageSize = 20, commune, dateRange, keywords } = (await req.json()) as ListPayload;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("job_posts")
      .select("id,title,commune,description,skills,contact,deadline,status,created_at,expires_at", { count: "exact" })
      .eq("is_active", true)
      .eq("status", "approved");

    // non expirées
    query = query.gt("expires_at", new Date().toISOString());

    if (commune) {
      query = query.ilike("commune", `%${commune}%`);
    }

    if (dateRange) {
      const now = new Date();
      let since = new Date();
      if (dateRange === "recent") {
        since = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
      } else if (dateRange === "week") {
        since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      } else if (dateRange === "month") {
        since = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      }
      query = query.gte("created_at", since.toISOString());
    }

    if (keywords) {
      // full-text search sur la colonne tsvector générée
      // Note: textSearch fonctionne aussi pour tsvector côté PostgREST
      query = query.textSearch("search_tsv", keywords, { type: "websearch", config: "french" });
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty results gracefully
      // Postgres error code 42P01 = undefined_table
      // @ts-ignore - Supabase error may not always carry code field
      if (error.code === "42P01" || (typeof error.message === "string" && error.message.includes("does not exist"))) {
        console.error("jobs-list: table job_posts missing, returning empty list");
        return new Response(JSON.stringify({ items: [], total: 0, page, pageSize }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("jobs-list error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ items: data ?? [], total: count ?? 0, page, pageSize }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jobs-list exception:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
