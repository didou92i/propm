import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParallaxBackground } from "@/components/common/ParallaxBackground";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";

const NATINF_URL = "https://natinf.propm.fr/";

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

export default function ProNatinf() {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "timeout">("loading");

  useEffect(() => {
    document.title = "Pro NATINF – Recherche NATINF | Propm";
    setMeta("description", "Accédez à Pro NATINF directement dans Propm pour les agents de Police Municipale.");
    setCanonical(`${window.location.origin}/natinf`);

    logger.info("Ouverture de Pro NATINF", { path: window.location.pathname }, "ProNatinf");

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
            <h1 className="text-lg sm:text-xl font-semibold">Pro NATINF – Base NATINF</h1>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href={NATINF_URL} target="_blank" rel="noopener noreferrer">Ouvrir dans un nouvel onglet</a>
          </Button>
        </nav>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4">
        {loadState === "timeout" && (
          <section className="mb-4">
            <div className="rounded-md border border-border/40 bg-muted/40 p-3">
              <p className="text-sm">Si l'intégration est bloquée par le navigateur, utilisez « Ouvrir dans un nouvel onglet » ci‑dessus.</p>
            </div>
          </section>
        )}

        <section aria-label="Zone d'intégration Pro NATINF" className="rounded-lg overflow-hidden border border-border/40 bg-background/40">
          <div className="w-full h-[calc(100vh-10rem)]">
            <iframe
              src={NATINF_URL}
              title="Pro NATINF"
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
