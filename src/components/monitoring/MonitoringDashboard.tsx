import { useState } from 'react';
import { useMonitoringStats } from '@/hooks/monitoring/useMonitoringStats';
import { MonitoringHeader } from './MonitoringHeader';
import { MonitoringMetrics } from './MonitoringMetrics';
import { MonitoringAnalytics } from './MonitoringAnalytics';

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
      
      <MonitoringMetrics stats={stats} />
      
      <MonitoringAnalytics 
        stats={stats} 
        getSeverityColor={getSeverityColor}
      />
    </div>
  );
}