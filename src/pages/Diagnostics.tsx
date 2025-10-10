import { ParallaxBackground } from "@/components/common/ParallaxBackground";
import { PlatformDiagnostics } from "@/components/PlatformDiagnostics";
import { IndexValidation } from "@/components/diagnostics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Diagnostics() {
  return (
    <ParallaxBackground className="min-h-screen">
      <main className="container mx-auto max-w-5xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Diagnostics système</h1>
          <p className="text-muted-foreground">Vérifiez le bon fonctionnement des assistants, services et index vectoriels.</p>
        </header>
        
        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platform">Diagnostics Plateforme</TabsTrigger>
            <TabsTrigger value="indexing">Validation Index Vectoriels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="platform" className="mt-6">
            <PlatformDiagnostics />
          </TabsContent>
          
          <TabsContent value="indexing" className="mt-6">
            <IndexValidation />
          </TabsContent>
        </Tabs>
      </main>
    </ParallaxBackground>
  );
}
