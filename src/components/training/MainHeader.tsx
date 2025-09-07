import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Brain, Settings, LogOut } from 'lucide-react';

interface MainHeaderProps {
  user?: any;
  showConfiguration: boolean;
  onShowConfiguration: () => void;
  onSignOut: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  user,
  showConfiguration,
  onShowConfiguration,
  onSignOut
}) => {
  return (
    <header className="flex items-center justify-between p-3 md:p-4 border-b border-border/20 backdrop-blur-xl bg-background/80 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <SidebarTrigger className="p-2 hover-lift glass flex-shrink-0" />
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <motion.div 
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0" 
            animate={{ rotate: [0, 360] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-foreground text-sm md:text-lg font-bold gradient-text truncate">
              Propm Academy
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              Entraînement IA avec Analytics Avancées
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {user && (
          <Badge variant="outline" className="hidden lg:flex items-center gap-2 glass">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="truncate max-w-32">{user.email}</span>
          </Badge>
        )}
        
        <Button 
          variant={showConfiguration ? "default" : "outline"} 
          size="sm" 
          onClick={onShowConfiguration} 
          className="glass px-2 md:px-3"
        >
          <Settings className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Configuration</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSignOut} 
          className="glass text-muted-foreground hover:text-destructive px-2 md:px-3"
        >
          <LogOut className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Déconnexion</span>
        </Button>
        
        <Badge variant="secondary" className="hidden xl:flex items-center gap-2 glass">
          <motion.div 
            className="w-2 h-2 rounded-full bg-green-500" 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
            transition={{ duration: 2, repeat: Infinity }} 
          />
          Système Actif
        </Badge>
      </div>
    </header>
  );
};