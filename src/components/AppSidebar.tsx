
import { useState } from "react";
import { Bot, FileText, Calculator, MessageSquare, Search, Settings, Plus, User, Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
import { useRipple } from "@/hooks/useRipple";
import { useTheme } from "@/hooks/useTheme";

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
  const createRipple = useRipple('enhanced');
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleAgentSelect = (agentId: string, event: React.MouseEvent<HTMLElement>) => {
    createRipple(event);
    onAgentSelect(agentId);
  };

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
    <Sidebar className="border-r border-border/40 glass-subtle theme-transition">
      <SidebarHeader className="p-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <div className="w-8 h-8 rounded-lg gradient-agent-animated flex items-center justify-center float neomorphism-subtle overflow-hidden">
            <img 
              src="/lovable-uploads/421ea4e9-730f-4336-9bcb-78a111f9c741.png" 
              alt="Propm.fr Logo" 
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="font-semibold text-lg">Propm.fr</span>
        </div>
        <button className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-sidebar-accent ripple-container hover-lift glass-hover neomorphism-hover">
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
              {agents.map((agent, index) => (
                <SidebarMenuItem key={agent.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <SidebarMenuButton
                    onClick={(e) => handleAgentSelect(agent.id, e)}
                    className={`flex items-center gap-3 p-3 rounded-lg ripple-container hover-lift transform-3d hover-tilt glass-hover neomorphism-hover ${
                      selectedAgent === agent.id
                        ? "glass-intense text-sidebar-accent-foreground border-l-2 border-primary pulse-glow neomorphism"
                        : "hover:bg-sidebar-accent/50 hover-glow glass-subtle"
                    }`}
                  >
                    {agent.id === "redacpro" ? (
                      <div className="w-5 h-5 rounded-full overflow-hidden">
                        <img 
                          src="/lovable-uploads/a40d9ab7-e2e3-425a-82f4-714b033f9aa8.png" 
                          alt="RedacPro Avatar" 
                          className={`w-5 h-5 object-cover transition-all duration-300 ${
                            selectedAgent === agent.id ? 'scale-110' : ''
                          }`}
                        />
                      </div>
                    ) : agent.id === "cdspro" ? (
                      <div className="w-5 h-5 rounded-full overflow-hidden">
                        <img 
                          src="/lovable-uploads/cds-pro-avatar.png" 
                          alt="CDS Pro Avatar" 
                          className={`w-5 h-5 object-cover transition-all duration-300 ${
                            selectedAgent === agent.id ? 'scale-110' : ''
                          }`}
                        />
                      </div>
                    ) : (
                      <agent.icon className={`w-5 h-5 transition-all duration-300 ${
                        selectedAgent === agent.id ? 'text-primary scale-110' : agent.color
                      }`} />
                    )}
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
              {tools.map((tool, index) => (
                <SidebarMenuItem key={tool.id} className="animate-fade-in" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
                  <SidebarMenuButton
                    onClick={(e) => handleAgentSelect(tool.id, e)}
                    className={`flex items-center gap-3 p-3 rounded-lg ripple-container hover-lift transform-3d hover-tilt glass-hover neomorphism-hover ${
                      selectedAgent === tool.id
                        ? "glass-intense text-sidebar-accent-foreground border-l-2 border-primary pulse-glow neomorphism"
                        : "hover:bg-sidebar-accent/50 hover-glow glass-subtle"
                    }`}
                  >
                    <tool.icon className={`w-5 h-5 transition-all duration-300 ${
                      selectedAgent === tool.id ? 'text-primary scale-110' : tool.color
                    }`} />
                    <span className="font-medium">{tool.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <div className="flex gap-2">
          <SidebarMenuButton 
            onClick={handleSignOut}
            className="flex-1 items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors glass-hover neomorphism-hover ripple-container"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span>Déconnexion</span>
          </SidebarMenuButton>
          <button
            onClick={(e) => {
              createRipple(e);
              toggleTheme();
            }}
            className="p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors glass-hover neomorphism-hover ripple-container"
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
