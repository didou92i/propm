import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Zap } from "lucide-react";
// Animation utility for now, can be enhanced later
const motion = {
  div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>
};
const AnimatePresence = ({ children }: any) => <>{children}</>;

interface StreamingProgressProps {
  isVisible: boolean;
  status: string;
  progress: number;
  onCancel?: () => void;
}

export function StreamingProgress({ isVisible, status, progress, onCancel }: StreamingProgressProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 text-primary"
              >
                <Zap className="w-full h-full" />
              </motion.div>
              <span className="text-sm font-medium text-foreground">
                Réponse rapide activée
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
              <span className="text-xs text-muted-foreground">
                {status}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            
            <Progress 
              value={progress} 
              className="h-2 bg-muted/50"
            />
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-0.5 bg-gradient-to-r from-primary/50 to-primary rounded-full"
            />
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            Optimisations activées: polling adaptatif, streaming temps réel
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}