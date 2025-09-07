import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LegalFooter } from "@/components/legal";
import { MainHeader } from './MainHeader';
import { MobileNavigationTabBar } from '@/components/ui/mobile-navigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrainingLayoutProps {
  children: React.ReactNode;
  selectedAgent: string;
  onAgentSelect: (agentId: string) => void;
  user?: any;
  showConfiguration: boolean;
  onShowConfiguration: () => void;
  onSignOut: () => void;
}

export const TrainingLayout: React.FC<TrainingLayoutProps> = ({
  children,
  selectedAgent,
  onAgentSelect,
  user,
  showConfiguration,
  onShowConfiguration,
  onSignOut
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      <SidebarProvider 
        defaultOpen={!isMobile}
      >
        <div className="min-h-screen flex w-full theme-transition">
          <AppSidebar selectedAgent={selectedAgent} onAgentSelect={onAgentSelect} />
          
          <div className="flex-1 flex flex-col min-w-0">
            <MainHeader 
              user={user}
              showConfiguration={showConfiguration}
              onShowConfiguration={onShowConfiguration}
              onSignOut={onSignOut}
            />

            <div className={`flex-1 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
              {children}
            </div>
          </div>
        </div>

        {isMobile && <MobileNavigationTabBar />}
        <LegalFooter />
      </SidebarProvider>
    </div>
  );
};