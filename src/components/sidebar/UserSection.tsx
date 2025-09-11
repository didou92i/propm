/**
 * Section utilisateur dans la sidebar (header + footer)
 * Extraction sécurisée depuis AppSidebar.tsx
 */

import { useCallback } from "react";
import { Plus, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRipple } from "@/hooks/useRipple";
import { useTheme } from "@/hooks/useTheme";
import {
  SidebarHeader,
  SidebarFooter,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface UserSectionProps {
  onNewChat?: () => void;
  collapsed: boolean;
  isMobile: boolean;
}

export function UserSection({ onNewChat, collapsed, isMobile }: UserSectionProps) {
  const createRipple = useRipple('enhanced');
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleNewConversation = useCallback(() => {
    if (onNewChat) {
      onNewChat();
      toast({
        title: "Nouvelle conversation",
        description: "Conversation réinitialisée avec succès",
      });
    }
  }, [onNewChat, toast]);

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
    <>
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
    </>
  );
}