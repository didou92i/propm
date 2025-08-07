import { ParallaxBackground } from "@/components/common/ParallaxBackground";
import { PlatformDiagnostics } from "@/components/PlatformDiagnostics";

export default function Diagnostics() {
  // Basic SEO tags via react-helmet are not used in this project; keep it simple
  return (
    <ParallaxBackground className="min-h-screen">
      <main className="container mx-auto max-w-5xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Diagnostics système</h1>
          <p className="text-muted-foreground">Vérifiez le bon fonctionnement des assistants et services.</p>
        </header>
        <section>
          <PlatformDiagnostics />
        </section>
      </main>
    </ParallaxBackground>
  );
}
