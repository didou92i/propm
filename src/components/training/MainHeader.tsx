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
  return <header className="flex items-center justify-between p-4 border-b border-border/20 backdrop-blur-xl bg-background/80 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="p-2 hover-lift glass" />
        <div className="flex items-center gap-3">
          <motion.div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow" animate={{
          rotate: [0, 360]
        }} transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}>
            <Brain className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-foreground text-lg font-bold gradient-text">Propm Academy </h1>
            <p className="text-sm text-muted-foreground">
              Entraînement IA avec Analytics Avancées
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user && <Badge variant="outline" className="flex items-center gap-2 glass">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {user.email}
          </Badge>}
        <Button variant={showConfiguration ? "default" : "outline"} size="sm" onClick={onShowConfiguration} className="glass">
          <Settings className="w-4 h-4 mr-2" />
          Configuration
        </Button>
        <Button variant="outline" size="sm" onClick={onSignOut} className="glass text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
        <Badge variant="secondary" className="flex items-center gap-2 glass">
          <motion.div className="w-2 h-2 rounded-full bg-green-500" animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }} transition={{
          duration: 2,
          repeat: Infinity
        }} />
          Système Actif
        </Badge>
      </div>
    </header>;
};