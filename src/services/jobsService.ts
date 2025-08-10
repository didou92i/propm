
import { supabase } from "@/integrations/supabase/client";

export type JobPost = {
  id: string;
  title: string;
  commune: string;
  description: string;
  skills: string[];
  contact: string;
  deadline: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  expires_at: string;
};

export type ListFilters = {
  page?: number;
  pageSize?: number;
  commune?: string | null;
  dateRange?: "recent" | "week" | "month" | null;
  keywords?: string | null;
};

export async function createJob(payload: {
  title: string;
  commune: string;
  description: string;
  skills?: string[];
  contact: string;
  deadline?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke("jobs-create", {
    body: payload,
  });
  if (error) throw error;
  return data as { id: string; status: "pending" | "approved" | "rejected" };
}

export async function listJobs(filters: ListFilters) {
  const { data, error } = await supabase.functions.invoke("jobs-list", {
    body: filters,
  });
  if (error) throw error;
  return data as { items: JobPost[]; total: number; page: number; pageSize: number };
}

export async function searchJobsAI(query: string, limit = 10) {
  const { data, error } = await supabase.functions.invoke("jobs-search-ai", {
    body: { query, limit },
  });
  if (error) throw error;
  return data as { items: JobPost[] };
}

export async function deleteJob(id: string) {
  const { data, error } = await supabase.functions.invoke("jobs-delete", {
    body: { id },
  });
  if (error) throw error;
  return data as { ok: boolean };
}

export async function getCommunes() {
  const { data, error } = await supabase.functions.invoke("jobs-communes");
  if (error) throw error;
  return data as { communes: string[] };
}
