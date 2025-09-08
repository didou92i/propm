import React from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FallbackContentIndicatorProps {
  isVisible: boolean;
  onRetry?: () => void;
  message?: string;
}

export function FallbackContentIndicator({ 
  isVisible, 
  onRetry, 
  message = "Contenu de secours utilisé - La génération IA est temporairement indisponible" 
}: FallbackContentIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Alert variant="default" className="border-orange-200 bg-orange-50/50">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm text-orange-700">{message}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4 gap-2 h-8"
            >
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}