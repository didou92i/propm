
import { useState } from "react";
import { Bot, FileText, Calculator, MessageSquare, Search, Settings, Plus, User } from "lucide-react";
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
} from "@/components/ui/sidebar";

const agents = [
  { id: "redacpro", name: "RedacPro", icon: Bot, color: "text-blue-400" },
  { id: "cdspro", name: "CDS Pro", icon: FileText, color: "text-purple-400" },
  { id: "arrete", name: "ArreteForritorial", icon: MessageSquare, color: "text-green-400" },
];

const tools = [
  { id: "salary", name: "Simulateur de salaire", icon: Calculator, color: "text-yellow-400" },
  { id: "natif", name: "Pro Natif", icon: Search, color: "text-cyan-400" },
  { id: "azzabi", name: "Azzabi", icon: User, color: "text-pink-400" },
];

interface AppSidebarProps {
  selectedAgent: string;
  onAgentSelect: (agentId: string) => void;
}

export function AppSidebar({ selectedAgent, onAgentSelect }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border/40 bg-sidebar">
      <SidebarHeader className="p-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Propm.fr</span>
        </div>
        <button className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-sidebar-accent">
          <Plus className="w-4 h-4" />
          Nouvelle conversation
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
            Agents IA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent) => (
                <SidebarMenuItem key={agent.id}>
                  <SidebarMenuButton
                    onClick={() => onAgentSelect(agent.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      selectedAgent === agent.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                        : "hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <agent.icon className={`w-5 h-5 ${agent.color}`} />
                    <span className="font-medium">{agent.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
            Outils
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    onClick={() => onAgentSelect(tool.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      selectedAgent === tool.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                        : "hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <tool.icon className={`w-5 h-5 ${tool.color}`} />
                    <span className="font-medium">{tool.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <SidebarMenuButton className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span>Déconnexion</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
