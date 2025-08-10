
import React from "react";
import { JobForm } from "@/components/recruitment";

const JobCreatePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Publier une annonce</h1>
      <p className="text-sm text-muted-foreground">
        Remplissez ce formulaire simple. Temps de remplissage cible: moins de 3 minutes.
      </p>
      <JobForm />
    </div>
  );
};

export default JobCreatePage;
