import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import type { HealthStatus } from './types';

interface MonitoringHeaderProps {
  healthStatus: HealthStatus;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function MonitoringHeader({ healthStatus, onRefresh, isRefreshing = false }: MonitoringHeaderProps) {
  const getStatusColor = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'Système opérationnel';
      case 'warning':
        return 'Attention requise';
      case 'critical':
        return 'Problème critique';
      default:
        return 'État inconnu';
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Monitoring du système</h1>
        <Badge className={`${getStatusColor(healthStatus.status)} text-white`}>
          {getStatusText(healthStatus.status)}
        </Badge>
      </div>
      
      <Button 
        onClick={onRefresh} 
        variant="outline" 
        size="sm"
        disabled={isRefreshing}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Actualiser
      </Button>
    </div>
  );
}