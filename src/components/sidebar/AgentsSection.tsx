/**
 * Section des agents IA dans la sidebar
 * Extraction sécurisée depuis AppSidebar.tsx
 */

import { Badge } from "@/components/ui/badge";
import { ConversationSwitcher } from "@/components/conversation";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Message } from "@/types/chat";
import { AGENTS } from "@/config/agents";
import { AgentAvatar } from "@/components/common";
import { MessageSquare } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AgentsSectionProps {
  selectedAgent: string;
  onAgentSelect: (agentId: string, event?: React.MouseEvent<HTMLElement>) => void;
  onContextShare?: (sourceAgent: string, targetAgent: string, messages: Message[]) => void;
  collapsed: boolean;
}

export function AgentsSection({ 
  selectedAgent, 
  onAgentSelect, 
  onContextShare, 
  collapsed 
}: AgentsSectionProps) {
  const { getConversationSummary } = useConversationHistory();

  const handleContextShare = (sourceAgent: string, targetAgent: string, messages: Message[]) => {
    if (onContextShare) {
      onContextShare(sourceAgent, targetAgent, messages);
    }
  };

  return (
    <SidebarGroup>
      <div className={`flex items-center justify-between px-4 py-2 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && (
          <>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Agents IA
            </SidebarGroupLabel>
            <ConversationSwitcher
              currentAgent={selectedAgent}
              onAgentSwitch={(agentId) => onAgentSelect(agentId)}
              onContextShare={handleContextShare}
            >
              <button className="p-1 rounded hover:bg-sidebar-accent/50 transition-colors">
                <MessageSquare className="w-3 h-3 text-muted-foreground" />
              </button>
            </ConversationSwitcher>
          </>
        )}
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {AGENTS.map((agent, index) => (
            <SidebarMenuItem key={agent.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <SidebarMenuButton
                onClick={(e) => onAgentSelect(agent.id, e)}
                className={`flex items-center gap-3 p-3 rounded-lg ripple-container glass-hover ${
                  selectedAgent === agent.id
                    ? "glass-intense text-sidebar-accent-foreground border-l-2 border-primary"
                    : "hover:bg-sidebar-accent/50 glass-subtle"
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <AgentAvatar 
                  agentId={agent.id}
                  agentName={agent.name}
                  avatarUrl={agent.avatar}
                  fallbackIcon={agent.icon}
                  size="sm"
                  className={`transition-all duration-300 ${
                    selectedAgent === agent.id ? 'scale-110' : ''
                  }`}
                />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis">{agent.name}</span>
                    {(() => {
                      const summary = getConversationSummary(agent.id);
                      return summary.messageCount > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-[1.5rem] max-w-[2rem] overflow-hidden">
                          {summary.messageCount > 99 ? '99+' : summary.messageCount}
                        </Badge>
                      );
                    })()}
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}