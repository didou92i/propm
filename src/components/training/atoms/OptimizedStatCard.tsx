import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OptimizedStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
  delay?: number;
  className?: string;
}

/**
 * Carte de statistique optimisée avec memoization
 */
export const OptimizedStatCard = memo<OptimizedStatCardProps>(({
  icon,
  label,
  value,
  color = 'text-primary',
  bgColor = 'bg-primary/10',
  delay = 0,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring", 
        damping: 25,
        stiffness: 400
      }}
      whileHover={{ 
        y: -6, 
        scale: 1.03,
        rotateY: 5,
        transition: { duration: 0.2 }
      }}
      className={cn('group cursor-pointer transform-3d', className)}
    >
      <Card className="glass-intense neomorphism hover-lift gradient-border border border-primary/15 backdrop-blur-xl shadow-glow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground/90 font-medium tracking-wide">
                {label}
              </p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent"
                key={value}
                initial={{ scale: 1.2, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                whileHover={{ scale: 1.05 }}
              >
                {value}
              </motion.p>
            </div>
            <motion.div 
              className={cn(
                'p-4 rounded-xl border border-primary/20 backdrop-blur-sm bg-gradient-to-br transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40',
                bgColor || 'from-primary/15 via-primary/10 to-transparent'
              )}
              whileHover={{ 
                scale: 1.15,
                rotate: 10,
                boxShadow: "0 0 25px hsl(var(--primary) / 0.4)"
              }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className={cn('w-6 h-6 transition-colors duration-300', color || 'text-primary')}>
                {icon}
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

OptimizedStatCard.displayName = 'OptimizedStatCard';