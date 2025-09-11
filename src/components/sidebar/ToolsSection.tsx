/**
 * Section des outils dans la sidebar
 * Extraction sécurisée depuis AppSidebar.tsx
 */

import { NavLink } from "react-router-dom";
import { Brain, Activity } from "lucide-react";
import { TOOLS } from "@/config/agents";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface ToolsSectionProps {
  selectedAgent: string;
  onAgentSelect: (agentId: string, event?: React.MouseEvent<HTMLElement>) => void;
  collapsed: boolean;
}

export function ToolsSection({ selectedAgent, onAgentSelect, collapsed }: ToolsSectionProps) {
  return (
    <>
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
                    onClick={(e) => onAgentSelect(tool.id, e)}
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
    </>
  );
}