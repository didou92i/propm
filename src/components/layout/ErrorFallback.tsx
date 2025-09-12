import React from 'react';
import { AlertTriangle, Bug, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BetaIndicator } from '@/components/common/BetaIndicator';
import { useBetaErrorBoundary } from '@/hooks/useBetaErrorBoundary';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, componentName }: ErrorFallbackProps) {
  const { createErrorReport } = useBetaErrorBoundary();

  const handleCopyReport = () => {
    const report = createErrorReport();
    navigator.clipboard?.writeText(report);
    toast.success('Rapport d\'erreur copié');
  };

  const handleViewDetails = () => {
    const report = createErrorReport();
    console.log('Rapport d\'erreur complet:', report);
    navigator.clipboard?.writeText(report);
    toast.info('Rapport copié dans le presse-papier');
  };

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-destructive/5 border border-destructive/20 rounded-lg space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Erreur Beta Détectée</h3>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Une erreur s'est produite dans le composant: <strong>{componentName || 'Inconnu'}</strong>
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          {error.message}
        </p>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetErrorBoundary}
          className="flex items-center gap-1"
        >
          <Activity className="w-4 h-4" />
          Réessayer
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleCopyReport}
          className="flex items-center gap-1"
        >
          <Bug className="w-4 h-4" />
          Copier le rapport
        </Button>
      </div>

      <BetaIndicator className="mt-2" showMetrics />
    </div>
  );
}