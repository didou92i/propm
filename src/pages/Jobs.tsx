import React from "react";
import { JobsFilterBar } from "@/components/recruitment";
import { JobCard } from "@/components/recruitment";
import { getCommunes, listJobs, searchJobsAI, type JobPost } from "@/services/jobsService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";
import { useAdmin } from "@/hooks/useAdmin";

const PAGE_SIZE = 20;

const JobsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [communes, setCommunes] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState({ commune: "", dateRange: "" as any, keywords: "" });
  const [loading, setLoading] = React.useState(false);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [items, setItems] = React.useState<JobPost[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const { isAdmin, loading: adminLoading } = useAdmin();

  React.useEffect(() => {
    document.title = "Nous recrutons | Offres d'emploi • Propm";
    const content = "Offres d'emploi du secteur public. Filtrez par commune et profitez de la recherche IA.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  React.useEffect(() => {
    getCommunes().then((d) => setCommunes(d.communes)).catch(() => setCommunes([]));
  }, []);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      logger.debug('jobs_list_fetch_start', { page, filters }, 'JobsPage');
      const res = await listJobs({
        page,
        pageSize: PAGE_SIZE,
        commune: filters.commune || null,
        dateRange: filters.dateRange || null,
        keywords: filters.keywords || null,
      });
      setItems(res.items);
      setTotal(res.total);
      logger.info('jobs_list_fetch_success', { count: res.items.length, total: res.total }, 'JobsPage');
    } catch (e: any) {
      logger.error('jobs_list_fetch_error', e, 'JobsPage');
      toast({ title: "Erreur", description: e.message ?? "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, page, toast]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onSearchAI = async () => {
    if (!filters.keywords) {
      toast({ title: "Info", description: "Saisissez d'abord des mots-clés pour la recherche IA." });
      return;
    }
    setLoadingAI(true);
    try {
      const res = await searchJobsAI(filters.keywords, 20);
      setItems(res.items as any);
      setTotal(res.items?.length ?? 0);
      setPage(1);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Recherche IA indisponible", variant: "destructive" });
    } finally {
      setLoadingAI(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Nous recrutons</h1>
          <div className="text-sm text-muted-foreground">
            {total} annonce{total > 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            disabled={adminLoading}
            title={adminLoading ? "Vérification des droits..." : !isAdmin ? "Accès restreint aux administrateurs" : "Gérer les annonces"}
            onClick={() => {
              if (adminLoading) {
                toast({ title: "Vérification en cours", description: "Merci de patienter..." });
                return;
              }
              logger.info("navigate_manage_jobs", { from: "/jobs", isAdmin }, "JobsPage");
              navigate("/jobs/manage");
            }}
            className={`w-full sm:w-auto ${!isAdmin && !adminLoading ? "opacity-60" : ""}`}
          >
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Gérer les annonces</span>
            <span className="sm:hidden">Gérer</span>
          </Button>
          <Button
            onClick={() => {
              logger.info("navigate_new_job", { from: "/jobs" }, "JobsPage");
              navigate("/jobs/new");
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" /> 
            <span className="hidden sm:inline">Publier une annonce</span>
            <span className="sm:hidden">Publier</span>
          </Button>
        </div>
      </div>

      <JobsFilterBar
        communes={communes}
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        onSearchAI={onSearchAI}
        loadingAI={loadingAI}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Chargement...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-4">
          <Button 
            variant="secondary" 
            disabled={page === 1} 
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-full sm:w-auto touch-manipulation"
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground order-first sm:order-none">
            Page {page} / {totalPages}
          </div>
          <Button 
            variant="secondary" 
            disabled={page === totalPages} 
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-full sm:w-auto touch-manipulation"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
