
import React from "react";
import { JobForm } from "@/components/recruitment";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const JobCreatePage: React.FC = () => {
  React.useEffect(() => {
    document.title = "Publier une annonce | Nous recrutons • Propm";
    const content = "Publiez une offre d'emploi en moins de 3 minutes. Modération rapide et diffusion immédiate.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Publier une annonce</h1>
          <p className="text-sm text-muted-foreground">
            Remplissez ce formulaire simple. Temps de remplissage cible: moins de 3 minutes.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <NavLink to="/jobs">Retour aux offres</NavLink>
        </Button>
      </div>
      <JobForm />
    </div>
  );
};

export default JobCreatePage;
