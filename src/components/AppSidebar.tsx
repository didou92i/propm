import { useIsMobile } from "@/hooks/use-mobile";
import { Message } from "@/types/chat";
import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { AgentsSection } from "@/components/sidebar/AgentsSection";
import { ToolsSection } from "@/components/sidebar/ToolsSection";
import { UserSection } from "@/components/sidebar/UserSection";

interface AppSidebarProps {
  selectedAgent: string;
  onAgentSelect: (agentId: string) => void;
  onContextShare?: (sourceAgent: string, targetAgent: string, messages: Message[]) => void;
  onNewChat?: () => void;
}

export function AppSidebar({ selectedAgent, onAgentSelect, onContextShare, onNewChat }: AppSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const collapsed = !open;

  const handleAgentSelect = (agentId: string, event?: React.MouseEvent<HTMLElement>) => {
    onAgentSelect(agentId);
    // Navigate to main chat page when AI agent is selected
    navigate('/');
  };

  return (
    <Sidebar className={`border-r border-border/40 glass-subtle theme-transition ${
      isMobile 
        ? collapsed 
          ? "w-0 min-w-0 max-w-0 overflow-hidden" 
          : "w-64 min-w-64 max-w-64" 
        : "max-w-[15rem] min-w-[15rem] w-[15rem]"
    }`}>
      <UserSection onNewChat={onNewChat} collapsed={collapsed} isMobile={isMobile} />

      <SidebarContent>
        <AgentsSection 
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentSelect}
          onContextShare={onContextShare}
          collapsed={collapsed}
        />

        <ToolsSection 
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentSelect}
          collapsed={collapsed}
        />
      </SidebarContent>
    </Sidebar>
  );
}
