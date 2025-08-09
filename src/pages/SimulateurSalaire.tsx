import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParallaxBackground } from "@/components/common/ParallaxBackground";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";

const SIMULATOR_URL = "https://simulateur.propm.fr/";

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

export default function SimulateurSalaire() {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "timeout">("loading");

  useEffect(() => {
    // Basic per-page SEO
    document.title = "Simulateur de salaire police municipale | Propm";
    setMeta("description", "Simulateur de salaire pour la Police Municipale – utilisez l'outil officiel directement dans Propm.");
    setCanonical(`${window.location.origin}/simulateur`);

    logger.info("Ouverture du simulateur de salaire", { path: window.location.pathname }, "SimulateurSalaire");

    const t = setTimeout(() => {
      setLoadState((s) => (s === "loading" ? "timeout" : s));
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <ParallaxBackground className="min-h-screen">
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-20">
        <nav className="flex items-center justify-between gap-4" aria-label="Fil d'Ariane">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Retour</Button>
            <h1 className="text-lg sm:text-xl font-semibold">Simulateur de salaire Police municipale</h1>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href={SIMULATOR_URL} target="_blank" rel="noopener noreferrer">Ouvrir dans un nouvel onglet</a>
          </Button>
        </nav>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4">
        {loadState === "timeout" && (
          <section className="mb-4">
            <div className="rounded-md border border-border/40 bg-muted/40 p-3">
              <p className="text-sm">Si l'outil ne s'affiche pas correctement (bloqué par le navigateur), utilisez le bouton « Ouvrir dans un nouvel onglet » ci‑dessus.</p>
            </div>
          </section>
        )}

        <section aria-label="Zone d'intégration du simulateur de salaire" className="rounded-lg overflow-hidden border border-border/40 bg-background/40">
          <div className="w-full h-[calc(100vh-10rem)]">
            <iframe
              src={SIMULATOR_URL}
              title="Simulateur de salaire – Police municipale"
              className="w-full h-full"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setLoadState("loaded")}
            />
          </div>
        </section>
      </main>
    </ParallaxBackground>
  );
}
