
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { MorphingIcon } from "@/components/MorphingIcon";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentManager } from "@/components/DocumentManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { Bot, Sparkles, Plus, Settings, FileText, Upload } from "lucide-react";

const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState("redacpro");
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  
  // Apply agent theme transitions
  useAgentTheme(selectedAgent);

  const handleNewChat = () => {
    setIsNewChatMode(true);
  };

  const handleQuickAction = () => {
    console.log("Quick action triggered");
  };

  return (
    <ParallaxBackground className="min-h-screen">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar
            selectedAgent={selectedAgent}
            onAgentSelect={setSelectedAgent}
          />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border/40 glass backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover-lift neomorphism-hover" />
                <div>
                  <h1 className="font-semibold agent-transition">Assistant IA pour agents municipaux</h1>
                  <p className="text-sm text-muted-foreground">
                    Propulsé par OpenAI GPT-4
                  </p>
                </div>
              </div>
              {/* Agent indicator with morphing icon */}
              <div className="flex items-center gap-3">
                <MorphingIcon
                  fromIcon={Bot}
                  toIcon={Sparkles}
                  isActive={isNewChatMode}
                  size={20}
                  className="text-primary"
                />
                <div className="w-3 h-3 rounded-full gradient-agent-animated pulse-glow" />
                <span className="text-sm font-medium capitalize">{selectedAgent}</span>
              </div>
            </header>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 glass-subtle w-fit">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Télécharger
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 mt-0">
                <ChatArea selectedAgent={selectedAgent} />
              </TabsContent>

              <TabsContent value="documents" className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Gestion des documents</h2>
                    <p className="text-muted-foreground">
                      Gérez vos documents téléchargés et consultez leur contenu analysé.
                    </p>
                  </div>
                  <DocumentManager />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Téléchargement de documents</h2>
                    <p className="text-muted-foreground">
                      Téléchargez vos documents pour les intégrer dans l'analyse des assistants IA.
                      Les documents seront automatiquement traités et indexés.
                    </p>
                  </div>
                  <DocumentUpload onDocumentProcessed={() => setActiveTab("documents")} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Floating Action Buttons */}
          <FloatingActionButton
            icon={Plus}
            onClick={handleNewChat}
            position="bottom-right"
            variant="primary"
            size="md"
            tooltip="Nouvelle conversation"
          />
          
          <FloatingActionButton
            icon={Settings}
            onClick={handleQuickAction}
            position="bottom-left"
            variant="secondary"
            size="sm"
            tooltip="Paramètres rapides"
          />
        </div>
      </SidebarProvider>
    </ParallaxBackground>
  );
};

export default Index;
