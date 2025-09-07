import { useState } from 'react';
import { useMonitoringStats } from '@/hooks/monitoring/useMonitoringStats';
import { MonitoringHeader } from './MonitoringHeader';
import { MonitoringMetrics } from './MonitoringMetrics';
import { MonitoringAnalytics } from './MonitoringAnalytics';
import { SecurityPanel } from './SecurityPanel';
import { BetaLogsViewer } from './BetaLogsViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveGrid } from '@/components/ui/responsive-grid';

export function MonitoringDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { stats, refreshStats, getHealthStatus, getSeverityColor } = useMonitoringStats();
  
  const healthStatus = getHealthStatus();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStats();
    setTimeout(() => setIsRefreshing(false), 1000); // Show loading for 1 second
  };

  return (
    <div className="space-y-6">
      <MonitoringHeader 
        healthStatus={healthStatus}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="beta-logs">Beta Logs</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <MonitoringMetrics stats={stats} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <MonitoringAnalytics 
            stats={stats} 
            getSeverityColor={getSeverityColor}
          />
        </TabsContent>
        
        <TabsContent value="beta-logs" className="space-y-6">
          <BetaLogsViewer />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <SecurityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}