
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { MorphingIcon } from "@/components/MorphingIcon";
import { PlatformDiagnostics } from "@/components/PlatformDiagnostics";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { Bot, Sparkles, Plus, Settings, FileSearch, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState("redacpro");
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [sharedContext, setSharedContext] = useState<{
    sourceAgent: string;
    messages: any[];
  } | undefined>(undefined);

  // Apply agent theme transitions
  useAgentTheme(selectedAgent);

  const handleNewChat = () => {
    setIsNewChatMode(true);
    // Refresh the page to start a new chat
    window.location.reload();
  };

  const handleQuickAction = () => {
    console.log("Quick semantic search action triggered");
  };

  const handleDiagnostics = () => {
    setShowDiagnostics(true);
  };

  const handleContextShare = (sourceAgent: string, targetAgent: string, messages: any[]) => {
    setSharedContext({ sourceAgent, messages });
    setSelectedAgent(targetAgent);
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    // Clear shared context when manually switching agents
    setSharedContext(undefined);
  };

  return (
    <ParallaxBackground className="min-h-screen">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar 
            selectedAgent={selectedAgent} 
            onAgentSelect={handleAgentSelect}
            onContextShare={handleContextShare}
          />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border/40 glass backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover-lift neomorphism-hover" />
                <div>
                  <h1 className="font-semibold agent-transition">Assistant IA pour agents municipaux</h1>
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
            <ChatArea 
              selectedAgent={selectedAgent} 
              sharedContext={sharedContext}
            />
          </div>
          
          {/* Enhanced Floating Action Buttons */}
          <FloatingActionButton 
            icon={Plus} 
            onClick={handleNewChat} 
            position="bottom-right" 
            variant="primary" 
            size="md" 
            tooltip="Nouvelle conversation" 
          />
          
          <FloatingActionButton 
            icon={FileSearch} 
            onClick={handleQuickAction} 
            position="bottom-left" 
            variant="secondary" 
            size="sm" 
            tooltip="Recherche sémantique" 
          />

          {/* Diagnostics Dialog */}
          <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
            <DialogTrigger asChild>
              <div className="fixed top-6 right-6 z-50">
                <FloatingActionButton 
                  icon={Activity} 
                  onClick={handleDiagnostics} 
                  position="top-right" 
                  variant="accent" 
                  size="sm" 
                  tooltip="Diagnostics système" 
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <PlatformDiagnostics />
            </DialogContent>
          </Dialog>
        </div>
      </SidebarProvider>
    </ParallaxBackground>
  );
};

export default Index;
