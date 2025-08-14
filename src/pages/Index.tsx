import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/chat";
import { ParallaxBackground, MorphingIcon } from "@/components/common";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PlatformDiagnostics } from "@/components/PlatformDiagnostics";
import { SemanticSearchDialog } from "@/components/search";
import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { useAdmin } from "@/hooks/useAdmin";
import { LegalFooter } from "@/components/legal";
import { Bot, Sparkles, Plus, Settings, FileSearch, Activity, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [selectedAgent, setSelectedAgent] = useState("redacpro");
  const [chatKey, setChatKey] = useState(0);
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSemanticSearch, setShowSemanticSearch] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [showConfirmNewChat, setShowConfirmNewChat] = useState(false);
  const [sharedContext, setSharedContext] = useState<{
    sourceAgent: string;
    messages: any[];
  } | undefined>(undefined);

  // Apply agent theme transitions
  useAgentTheme(selectedAgent);
  const handleNewChat = () => {
    setIsNewChatMode(true);
    setSharedContext(undefined);
    setChatKey((k) => k + 1);
  };
  const handleSemanticSearch = () => {
    setShowSemanticSearch(true);
  };
  const handleMonitoring = () => {
    setShowMonitoring(true);
  };
  const handleDiagnostics = () => {
    setShowDiagnostics(true);
  };
  const handleContextShare = (sourceAgent: string, targetAgent: string, messages: any[]) => {
    setSharedContext({
      sourceAgent,
      messages
    });
    setSelectedAgent(targetAgent);
  };
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    if (agentId === 'salary') {
      navigate('/simulateur');
      return;
    }
    if (agentId === 'natif') {
      navigate('/natinf');
      return;
    }
    // Clear shared context when manually switching agents
    setSharedContext(undefined);
  };

  // Keyboard shortcut: Cmd/Ctrl + N to start a new conversation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === 'n' || e.key === 'N')) {
        // Avoid triggering inside inputs/textareas/contenteditable
        const target = e.target as HTMLElement;
        const isTypingContext = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
        if (isTypingContext) return;
        e.preventDefault();
        setShowConfirmNewChat(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  return <ParallaxBackground className="min-h-screen">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar selectedAgent={selectedAgent} onAgentSelect={handleAgentSelect} onContextShare={handleContextShare} />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border/40 glass backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover-lift neomorphism-hover" />
                <div>
                  <h1 className="agent-transition text-gray-200 text-lg font-bold">Bienvenue sur Propm.fr</h1>
                </div>
              </div>
              {/* Agent indicator with morphing icon */}
              <div className="flex items-center gap-3">
                <MorphingIcon fromIcon={Bot} toIcon={Sparkles} isActive={isNewChatMode} size={20} className="text-primary" />
                <div className="w-3 h-3 rounded-full gradient-agent-animated pulse-glow" />
                <span className="text-sm font-medium capitalize">{selectedAgent}</span>
              </div>
            </header>

            {/* Main Chat Area */}
            <div>
              <ChatArea key={chatKey} selectedAgent={selectedAgent} sharedContext={sharedContext} />
            </div>
          </div>
          
          {/* Fixed Legal Footer */}
          <LegalFooter />
          
          {/* Enhanced Floating Action Buttons */}
          <FloatingActionButton icon={Plus} onClick={() => setShowConfirmNewChat(true)} position="bottom-right" variant="primary" size="md" tooltip="Nouvelle conversation (Ctrl/Cmd+N)" />
          
          {isAdmin && (
            <>
              <FloatingActionButton icon={FileSearch} onClick={handleSemanticSearch} position="bottom-left" variant="secondary" size="sm" tooltip="Recherche sémantique" />

              <div className="fixed bottom-6 left-20 z-40">
                <FloatingActionButton icon={BarChart3} onClick={handleMonitoring} position="bottom-left" variant="accent" size="sm" tooltip="Monitoring & Analytics" />
              </div>
            </>
          )}

          {/* Dialogs */}
          {isAdmin && (
            <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
              <DialogTrigger asChild>
                <div className="fixed top-6 right-6 z-50">
                  <FloatingActionButton icon={Activity} onClick={handleDiagnostics} position="top-right" variant="accent" size="sm" tooltip="Diagnostics système" />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <PlatformDiagnostics />
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && <SemanticSearchDialog open={showSemanticSearch} onOpenChange={setShowSemanticSearch} />}

          {isAdmin && (
            <Dialog open={showMonitoring} onOpenChange={setShowMonitoring}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <MonitoringDashboard />
              </DialogContent>
            </Dialog>
          )}

          {/* Confirm new conversation */}
          <AlertDialog open={showConfirmNewChat} onOpenChange={setShowConfirmNewChat}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Démarrer une nouvelle conversation ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cela réinitialisera l'affichage actuel pour repartir sur une discussion vierge. L'historique reste accessible dans la barre latérale.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => { handleNewChat(); setShowConfirmNewChat(false); }}>
                  Oui, démarrer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarProvider>
    </ParallaxBackground>;
};
export default Index;