import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Target } from 'lucide-react';

interface TrainingLoadingIndicatorProps {
  step: string;
  progress: number;
  subtitle?: string;
}

export const TrainingLoadingIndicator: React.FC<TrainingLoadingIndicatorProps> = ({
  step,
  progress,
  subtitle
}) => {
  const steps = [
    { icon: Brain, label: "Initialisation IA", color: "text-blue-500" },
    { icon: Target, label: "Génération contenu", color: "text-purple-500" },
    { icon: Zap, label: "Optimisation", color: "text-green-500" }
  ];

  const currentStepIndex = steps.findIndex(s => step.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-6 glass rounded-2xl space-y-6"
    >
      {/* Progress Ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="w-16 h-16 border-4 border-primary/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-16 h-16 border-4 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <Brain className="absolute w-6 h-6 text-primary" />
      </div>

      {/* Current Step */}
      <div className="text-center space-y-2">
        <motion.h3
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-foreground"
        >
          {step}
        </motion.h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2 glass" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-center space-x-4">
        {steps.map((stepInfo, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          
          return (
            <motion.div
              key={stepInfo.label}
              className={`p-2 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-primary/20 border-2 border-primary' 
                  : isCompleted 
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : 'bg-muted/50 border-2 border-muted'
              }`}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <stepInfo.icon 
                className={`w-4 h-4 ${
                  isActive 
                    ? 'text-primary' 
                    : isCompleted 
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                }`} 
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};