import React, { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, CalendarDays } from "lucide-react";
import type { JobPost } from "@/services/jobsService";

type Props = {
  job: JobPost;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
};

const JobCard: React.FC<Props> = memo(({ job, onDelete, canDelete = false }) => {
  const created = React.useMemo(() => 
    new Date(job.created_at).toLocaleDateString("fr-FR"), 
    [job.created_at]
  );
  
  const deadline = React.useMemo(() => 
    job.deadline ? new Date(job.deadline).toLocaleDateString("fr-FR") : null,
    [job.deadline]
  );

  const handleDelete = React.useCallback(() => {
    if (onDelete) {
      onDelete(job.id);
    }
  }, [onDelete, job.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <Card className="transition-colors">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-sm sm:text-base leading-tight truncate">{job.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {job.status === "approved" && <Badge className="text-xs">Publié</Badge>}
            {job.status === "pending" && <Badge variant="secondary" className="text-xs">En attente</Badge>}
            {job.status === "rejected" && <Badge variant="destructive" className="text-xs">Refusé</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" /> {job.commune}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" /> Publié le {created}
            </span>
            {deadline && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" /> Limite {deadline}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 line-clamp-3 sm:line-clamp-4">{job.description}</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(job.skills ?? []).slice(0, 6).map((s, i) => (
              <Badge key={i} variant="outline" className="text-xs px-2 py-0.5">{s}</Badge>
            ))}
            {(job.skills ?? []).length > 6 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">+{(job.skills ?? []).length - 6}</Badge>
            )}
          </div>
          {canDelete && onDelete && (
            <div className="pt-2">
              <button
                onClick={handleDelete}
                className="text-sm text-destructive hover:underline"
              >
                Supprimer
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

JobCard.displayName = 'JobCard';

export { JobCard };