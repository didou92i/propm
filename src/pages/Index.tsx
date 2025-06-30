
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { Settings } from "lucide-react";

const Index = () => {
  const [selectedAgent, setSelectedAgent] = useState("redacpro");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem("openai-api-key", key);
  };

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
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-border/40 bg-card/30">
              <ApiKeyInput
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyChange}
              />
            </div>
          )}

          {/* Chat Area */}
          <ChatArea
            selectedAgent={selectedAgent}
            apiKey={apiKey}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
