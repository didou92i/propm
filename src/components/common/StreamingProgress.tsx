import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface StreamingProgressProps {
  isVisible: boolean;
  status: string;
  progress: number;
  onCancel?: () => void;
}

export function StreamingProgress({ isVisible, status, progress, onCancel }: StreamingProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="animate-fade-in fixed bottom-4 right-4 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg p-4 shadow-lg min-w-[300px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-card-foreground">
            IA en traitement...
          </span>
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground animate-pulse">
            {status}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        
        <Progress 
          value={progress} 
          className="h-2 bg-muted/50 transition-all duration-300"
        />
        
        <div 
          className="h-0.5 bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {progress < 50 ? '🔄 Connexion à l\'IA...' : progress < 90 ? '⚡ Génération de la réponse...' : '✨ Finalisation...'}
      </div>
    </div>
  );
}