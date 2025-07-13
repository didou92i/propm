
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";

const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState("redacpro");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          selectedAgent={selectedAgent}
          onAgentSelect={setSelectedAgent}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2" />
              <div>
                <h1 className="font-semibold">Assistant IA pour agents municipaux</h1>
                <p className="text-sm text-muted-foreground">
                  Propulsé par OpenAI GPT-4
                </p>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <ChatArea
            selectedAgent={selectedAgent}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
