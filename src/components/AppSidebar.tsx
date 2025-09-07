import { useState, useCallback } from "react";
import { Calculator, Search, Settings, Plus, User, Moon, Sun, LogOut, MessageSquare, Activity, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { ConversationSwitcher } from "@/components/conversation";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Message } from "@/types/chat";
import { AGENTS, TOOLS } from "@/config/agents";
import { AgentAvatar } from "@/components/common";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRipple } from "@/hooks/useRipple";
import { useTheme } from "@/hooks/useTheme";
import { NavLink, useNavigate } from "react-router-dom";

interface AppSidebarProps {
  selectedAgent: string;
  onAgentSelect: (agentId: string) => void;
  onContextShare?: (sourceAgent: string, targetAgent: string, messages: Message[]) => void;
  onNewChat?: () => void;
}

export function AppSidebar({ selectedAgent, onAgentSelect, onContextShare, onNewChat }: AppSidebarProps) {
  const createRipple = useRipple('enhanced');
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { getConversationSummary } = useConversationHistory();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const collapsed = !open;

  const handleAgentSelect = (agentId: string, event?: React.MouseEvent<HTMLElement>) => {
    if (event) createRipple(event);
    onAgentSelect(agentId);
    // Navigate to main chat page when AI agent is selected
    navigate('/');
  };

  const handleContextShare = (sourceAgent: string, targetAgent: string, messages: Message[]) => {
    if (onContextShare) {
      onContextShare(sourceAgent, targetAgent, messages);
    }
  };

  const handleNewConversation = useCallback(() => {
    if (onNewChat) {
      onNewChat();
      toast({
        title: "Nouvelle conversation",
        description: "Conversation réinitialisée avec succès",
      });
    }
  }, [onNewChat]);

  const handleSignOut = async (event: React.MouseEvent<HTMLElement>) => {
    createRipple(event);
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Erreur de déconnexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Déconnexion réussie",
          description: "Vous avez été déconnecté avec succès",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className={`border-r border-border/40 glass-subtle theme-transition ${
      isMobile 
        ? collapsed 
          ? "w-0 min-w-0 max-w-0 overflow-hidden" 
          : "w-64 min-w-64 max-w-64" 
        : "max-w-[15rem] min-w-[15rem] w-[15rem]"
    }`}>
      <SidebarHeader className={`p-4 border-b border-border/40 ${isMobile && collapsed ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <div className="w-8 h-8 rounded-lg gradient-agent-animated flex items-center justify-center float neomorphism-subtle overflow-hidden">
            <img 
              src="/lovable-uploads/421ea4e9-730f-4336-9bcb-78a111f9c741.png" 
              alt="Propm.fr Logo" 
              className="w-6 h-6 object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          {!collapsed && <span className="font-semibold text-lg">Propm.fr</span>}
        </div>
        {!collapsed && (
          <button 
            onClick={handleNewConversation}
            className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-sidebar-accent ripple-container hover-lift glass-hover neomorphism-hover"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className={`flex items-center justify-between px-4 py-2 ${collapsed ? 'px-2' : ''}`}>
            {!collapsed && (
              <>
                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agents IA
                </SidebarGroupLabel>
                <ConversationSwitcher
                  currentAgent={selectedAgent}
                  onAgentSwitch={(agentId) => handleAgentSelect(agentId)}
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
                    onClick={(e) => handleAgentSelect(agent.id, e)}
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

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
              Outils
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {TOOLS.map((tool, index) => (
                <SidebarMenuItem key={tool.id} className="animate-fade-in" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
                  {tool.id === 'salary' ? (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/simulateur"
                        className={({ isActive }) =>
                          `flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors ${
                            isActive
                              ? 'glass-intense text-sidebar-accent-foreground border-l-2 border-primary pulse-glow neomorphism'
                              : 'glass-subtle hover-glow'
                          }`
                        }
                      >
                        <img
                          src="/lovable-uploads/97f6fd6a-15b0-4cd6-9c69-62d6ed11ce5e.png"
                          alt="Simulateur de salaire - avatar"
                          className="w-5 h-5 rounded-full object-cover transition-all duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">{tool.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  ) : tool.id === 'natif' ? (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/natinf"
                        className={({ isActive }) =>
                          `flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors ${
                            isActive
                              ? 'glass-intense text-sidebar-accent-foreground border-l-2 border-primary pulse-glow neomorphism'
                              : 'glass-subtle hover-glow'
                          }`
                        }
                      >
                        <img
                          src="/lovable-uploads/97f6fd6a-15b0-4cd6-9c69-62d6ed11ce5e.png"
                          alt="Pro NATINF - avatar"
                          className="w-5 h-5 rounded-full object-cover transition-all duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                         <span className="font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">{tool.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  ) : tool.id === 'jobs' ? (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/jobs"
                        className={({ isActive }) =>
                          `flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors ${
                            isActive
                              ? 'glass-intense text-sidebar-accent-foreground border-l-2 border-primary pulse-glow neomorphism'
                              : 'glass-subtle hover-glow'
                          }`
                        }
                      >
                        <tool.icon className={`w-5 h-5 ${tool.color}`} />
                         <span className="font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">{tool.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      onClick={(e) => handleAgentSelect(tool.id, e)}
                      className={`flex items-center gap-3 p-3 rounded-lg ripple-container glass-hover ${
                        selectedAgent === tool.id
                          ? 'glass-intense text-sidebar-accent-foreground border-l-2 border-primary'
                          : 'hover:bg-sidebar-accent/50 glass-subtle'
                      }`}
                    >
                      <tool.icon className={`w-5 h-5 transition-all duration-300 ${
                        selectedAgent === tool.id ? 'text-primary scale-110' : tool.color
                      }`} />
                      <span className="font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">{tool.name}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
              Système
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/training" className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors ${isActive ? 'glass-intense border-l-2 border-primary' : 'glass-subtle'}`
                  }>
                    <Brain className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">Entraînement ( Beta )</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/diagnostics" className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors ${isActive ? 'glass-intense border-l-2 border-primary' : 'glass-subtle'}`
                  }>
                    <Activity className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">Diagnostics</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className={`p-4 border-t border-border/40 ${collapsed ? 'p-2' : ''}`}>
        <div className={`flex gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <SidebarMenuButton 
            onClick={handleSignOut}
            className={`${collapsed ? 'justify-center p-2' : 'flex-1'} items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors glass-hover ripple-container overflow-hidden`}
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            {!collapsed && <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">Déconnexion</span>}
          </SidebarMenuButton>
          <button
            onClick={(e) => {
              createRipple(e);
              toggleTheme();
            }}
            className={`${collapsed ? 'p-2' : 'p-3'} rounded-lg hover:bg-sidebar-accent/50 transition-colors glass-hover ripple-container`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
