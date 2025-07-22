import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { MorphingIcon } from "@/components/MorphingIcon";
import { useAgentTheme } from "@/hooks/useAgentTheme";
import { Bot, Sparkles, Plus, Settings, FileSearch } from "lucide-react";
const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState("redacpro");
  const [isNewChatMode, setIsNewChatMode] = useState(false);

  // Apply agent theme transitions
  useAgentTheme(selectedAgent);
  const handleNewChat = () => {
    setIsNewChatMode(true);
    // Refresh the page to start a new chat
    window.location.reload();
  };
  const handleQuickAction = () => {
    console.log("Quick action triggered");
  };
  return <ParallaxBackground className="min-h-screen">
      <SidebarProvider>
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar selectedAgent={selectedAgent} onAgentSelect={setSelectedAgent} />
          
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
            <ChatArea selectedAgent={selectedAgent} />
          </div>
          
          {/* Enhanced Floating Action Buttons */}
          <FloatingActionButton icon={Plus} onClick={handleNewChat} position="bottom-right" variant="primary" size="md" tooltip="Nouvelle conversation" />
          
          <FloatingActionButton icon={FileSearch} onClick={handleQuickAction} position="bottom-left" variant="secondary" size="sm" tooltip="Recherche sémantique" />
        </div>
      </SidebarProvider>
    </ParallaxBackground>;
};
export default Index;