import { useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HelpMenu } from "@/components/HelpMenu";
import { WelcomeCards } from "@/components/WelcomeCards";
import { MorphingIcon } from "@/components/MorphingIcon";
import { PlatformDiagnostics } from "@/components/PlatformDiagnostics";
import { SemanticSearchDialog } from "@/components/SemanticSearchDialog";
import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { DocumentTemplates } from "@/components/DocumentTemplates";
import { ConversationExport } from "@/components/ConversationExport";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { Bot, Sparkles, Plus, Settings, FileSearch, Activity, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState("redacpro");
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSemanticSearch, setShowSemanticSearch] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasMessages, setHasMessages] = useState(false);
  const [sharedContext, setSharedContext] = useState<{
    sourceAgent: string;
    messages: any[];
  } | undefined>(undefined);

  // Apply agent theme transitions
  useAgentTheme(selectedAgent);
  const handleNewChat = useCallback(() => {
    setIsNewChatMode(true);
    setShowWelcome(false);
    // Refresh the page to start a new chat
    window.location.reload();
  }, []);

  const handleSemanticSearch = useCallback(() => {
    setShowSemanticSearch(true);
  }, []);

  const handleMonitoring = useCallback(() => {
    setShowMonitoring(true);
  }, []);

  const handleDiagnostics = useCallback(() => {
    setShowDiagnostics(true);
  }, []);

  const handleTemplates = useCallback(() => {
    setShowTemplates(true);
  }, []);

  const handleExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const handleStartOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const handleFirstMessage = useCallback(() => {
    setHasMessages(true);
    setShowWelcome(false);
  }, []);
  const handleContextShare = (sourceAgent: string, targetAgent: string, messages: any[]) => {
    setSharedContext({
      sourceAgent,
      messages
    });
    setSelectedAgent(targetAgent);
  };
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    // Clear shared context when manually switching agents
    setSharedContext(undefined);
  };
  return <ParallaxBackground className="min-h-screen">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar 
            selectedAgent={selectedAgent} 
            onAgentSelect={handleAgentSelect} 
            onContextShare={handleContextShare}
            data-tour="agents"
          />
          
          <div className="flex-1 flex flex-col">
            {/* Header with Help Menu */}
            <header className="flex items-center justify-between p-4 border-b border-border/40 glass backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover-lift neomorphism-hover" />
                <div>
                  <h1 className="agent-transition text-gray-200 text-lg font-bold">Bienvenue sur Propm.fr</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Help Menu */}
                <div data-tour="tools">
                  <HelpMenu
                    onSemanticSearch={handleSemanticSearch}
                    onExportConversation={handleExport}
                    onShowMonitoring={handleMonitoring}
                    onShowTemplates={handleTemplates}
                    onRestartTour={handleStartOnboarding}
                  />
                </div>
                
                {/* Agent indicator with morphing icon */}
                <div className="flex items-center gap-3">
                  <MorphingIcon fromIcon={Bot} toIcon={Sparkles} isActive={isNewChatMode} size={20} className="text-primary" />
                  <div className="w-3 h-3 rounded-full gradient-agent-animated pulse-glow" />
                  <span className="text-sm font-medium capitalize">{selectedAgent}</span>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            {showWelcome ? (
              <div className="flex-1 overflow-auto">
                <WelcomeCards
                  onStartChat={() => {
                    setShowWelcome(false);
                    handleNewChat();
                  }}
                  onUploadDocument={() => {
                    setShowWelcome(false);
                    // Trigger upload via chat area
                  }}
                  onSemanticSearch={handleSemanticSearch}
                  onShowTemplates={handleTemplates}
                />
              </div>
            ) : (
              <div data-tour="chat-area">
                <ChatArea 
                  selectedAgent={selectedAgent} 
                  sharedContext={sharedContext}
                  onFirstMessage={handleFirstMessage}
                  hasMessages={hasMessages}
                />
              </div>
            )}
          </div>
          
          {/* Floating Action Button for New Chat (only when not on welcome screen) */}
          {!showWelcome && (
            <FloatingActionButton 
              icon={Plus} 
              onClick={handleNewChat} 
              position="bottom-right" 
              variant="primary" 
              size="md" 
              tooltip="Nouvelle conversation" 
            />
          )}

          {/* Onboarding Tour */}
          {showOnboarding && (
            <OnboardingTour onComplete={handleOnboardingComplete} />
          )}

          {/* Dialogs */}
          <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
            <DialogTrigger asChild>
              <div className="fixed top-6 left-6 z-50">
                <FloatingActionButton icon={Activity} onClick={handleDiagnostics} position="top-left" variant="accent" size="sm" tooltip="Diagnostics système" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <PlatformDiagnostics />
            </DialogContent>
          </Dialog>

          <SemanticSearchDialog open={showSemanticSearch} onOpenChange={setShowSemanticSearch} />

          <Dialog open={showMonitoring} onOpenChange={setShowMonitoring}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <MonitoringDashboard />
            </DialogContent>
          </Dialog>

          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogContent className="max-w-4xl">
              <DocumentTemplates 
                selectedAgent={selectedAgent}
                onUseTemplate={(template) => {
                  // Handle template usage - could pass to chat area or show message
                  setShowTemplates(false);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showExport} onOpenChange={setShowExport}>
            <DialogContent className="max-w-2xl">
              <ConversationExport 
                messages={[]}
                agentName={selectedAgent}
              >
                <div>Export conversation</div>
              </ConversationExport>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarProvider>
    </ParallaxBackground>;
};
export default Index;