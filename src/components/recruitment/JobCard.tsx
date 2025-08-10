
import React from "react";
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

export const JobCard: React.FC<Props> = ({ job, onDelete, canDelete = false }) => {
  const created = new Date(job.created_at).toLocaleDateString("fr-FR");
  const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString("fr-FR") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <Card className="transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{job.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {job.status === "approved" && <Badge>Publié</Badge>}
            {job.status === "pending" && <Badge variant="secondary">En attente</Badge>}
            {job.status === "rejected" && <Badge variant="destructive">Refusé</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {job.commune}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" /> Publié le {created}
            </span>
            {deadline && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> Limite {deadline}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-4">{job.description}</p>
          <div className="flex flex-wrap gap-2">
            {(job.skills ?? []).slice(0, 8).map((s, i) => (
              <Badge key={i} variant="outline">{s}</Badge>
            ))}
          </div>
          {canDelete && onDelete && (
            <div className="pt-2">
              <button
                onClick={() => onDelete(job.id)}
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
};
