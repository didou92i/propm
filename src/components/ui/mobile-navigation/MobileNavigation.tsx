import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Calculator, 
  Search, 
  Brain,
  User,
  Activity
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '../enhanced-mobile-support';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    path: '/'
  },
  {
    id: 'training',
    label: 'Formation',
    icon: Brain,
    path: '/training'
  },
  {
    id: 'simulateur',
    label: 'Simulateur',
    icon: Calculator,
    path: '/simulateur'
  },
  {
    id: 'jobs',
    label: 'Emplois',
    icon: Search,
    path: '/jobs'
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: Activity,
    path: '/diagnostics'
  }
];

export function MobileNavigationTabBar() {
  const isMobile = useIsMobile();
  const location = useLocation();

  if (!isMobile) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-full bg-background/95 backdrop-blur-xl border-t border-border/40 px-2 pb-safe-area-inset-bottom pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className="flex-1 max-w-16"
            >
              <EnhancedButton
                variant="ghost"
                size="sm"
                withRipple
                className={cn(
                  "flex flex-col items-center gap-1 p-2 h-auto min-h-14 w-full",
                  "rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive ? "scale-110" : ""
                  )} 
                />
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </EnhancedButton>
            </NavLink>
          );
        })}
      </div>
    </motion.div>
  );
}

interface MobileHeaderProps {
  title: string;
  onMenuToggle?: () => void;
  showMenu?: boolean;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, onMenuToggle, showMenu, actions }: MobileHeaderProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onMenuToggle && (
            <EnhancedButton
              variant="ghost"
              size="sm"
              withRipple
              onClick={onMenuToggle}
              className="p-2 rounded-lg"
            >
              <div className="flex flex-col gap-1">
                <div className={cn(
                  "w-4 h-0.5 bg-current transition-all duration-200",
                  showMenu ? "rotate-45 translate-y-1.5" : ""
                )} />
                <div className={cn(
                  "w-4 h-0.5 bg-current transition-all duration-200",
                  showMenu ? "opacity-0" : ""
                )} />
                <div className={cn(
                  "w-4 h-0.5 bg-current transition-all duration-200",
                  showMenu ? "-rotate-45 -translate-y-1.5" : ""
                )} />
              </div>
            </EnhancedButton>
          )}
          
          <h1 className="text-lg font-semibold truncate">
            {title}
          </h1>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  );
}