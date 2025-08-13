import React from "react";
import { JobCard } from "@/components/recruitment";
import { listJobs, deleteJob, type JobPost } from "@/services/jobsService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { NavLink, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

const PAGE_SIZE = 20;

const JobManagePage: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<JobPost[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Afficher un loader pendant la vérification des droits
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Vérification des droits d'accès...
        </div>
      </div>
    );
  }

  // Afficher message d'accès refusé si pas admin (mais connecté)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center gap-2 text-destructive justify-center">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Accès refusé</h1>
          </div>
          <p className="text-muted-foreground">
            Cette page est réservée aux administrateurs.
          </p>
          <Button variant="secondary" asChild>
            <NavLink to="/jobs">Retour aux offres</NavLink>
          </Button>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    document.title = "Gestion des annonces | Admin • Propm";
    const content = "Interface d'administration pour modérer les offres d'emploi.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      // Construire la requête de base
      let query = supabase
        .from("job_posts")
        .select("id,title,commune,description,skills,contact,deadline,status,created_at,expires_at,author_id", { count: "exact" })
        .eq("is_active", true);

      // Appliquer le filtre de statut seulement si ce n'est pas "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (error) throw error;

      setItems((data || []) as JobPost[]);
      setTotal(data?.length || 0);
    } catch (e: any) {
      console.error("Erreur lors du chargement des annonces:", e);
      toast({ title: "Erreur", description: e.message ?? "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const moderateJob = async (jobId: string, newStatus: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("job_posts")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Modération effectuée",
        description: `Annonce ${newStatus === "approved" ? "approuvée" : "refusée"}.`,
      });

      // Rafraîchir la liste
      fetchList();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de modérer", variant: "destructive" });
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      toast({ title: "Suppression", description: "Annonce supprimée." });
      fetchList();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de supprimer", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestion des annonces
          </h1>
          <div className="text-sm text-muted-foreground">
            {total} annonce{total > 1 ? "s" : ""} ({statusFilter})
          </div>
        </div>
        <Button variant="secondary" asChild>
          <NavLink to="/jobs">Retour aux offres</NavLink>
        </Button>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => {
              setStatusFilter(status as any);
              setPage(1);
            }}
          >
            {status === "all" && "Toutes"}
            {status === "pending" && "En attente"}
            {status === "approved" && "Approuvées"}
            {status === "rejected" && "Refusées"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Chargement...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((job) => (
            <div key={job.id} className="relative">
              <JobCard job={job} onDelete={handleDelete} canDelete />
              
              {/* Boutons de modération */}
              {job.status === "pending" && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => moderateJob(job.id, "approved")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => moderateJob(job.id, "rejected")}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">Page {page}</div>
          <Button variant="secondary" disabled={items.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobManagePage;