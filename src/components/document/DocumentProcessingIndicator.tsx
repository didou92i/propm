import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DocumentProcessingIndicatorProps {
  isProcessing: boolean;
  error: string | null;
  onRetry?: () => void;
  fileName?: string;
}

export function DocumentProcessingIndicator({
  isProcessing,
  error,
  onRetry,
  fileName
}: DocumentProcessingIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      setStage("Téléchargement...");
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 30) {
            setStage("Analyse du document...");
            return prev + 5;
          } else if (prev < 60) {
            setStage("Extraction du texte...");
            return prev + 3;
          } else if (prev < 90) {
            setStage("Génération des embeddings...");
            return prev + 2;
          } else {
            setStage("Finalisation...");
            return Math.min(prev + 1, 95);
          }
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setStage("Terminé");
    }
  }, [isProcessing]);

  if (!isProcessing && !error) return null;

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-3">
      {isProcessing && (
        <>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Traitement en cours</span>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{fileName}</span>
          </div>
          
          <div className="text-xs text-muted-foreground">{stage}</div>
        </>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold mb-1">Erreur de traitement</div>
              <div className="text-sm">{error}</div>
              {error.includes("rate limit") && (
                <div className="text-xs mt-2 text-muted-foreground">
                  💡 L'API est temporairement saturée. Réessayez dans quelques secondes.
                </div>
              )}
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-3"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!isProcessing && !error && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          <span>Document traité avec succès</span>
        </div>
      )}
    </div>
  );
}