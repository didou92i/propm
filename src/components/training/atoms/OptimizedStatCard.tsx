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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className={cn('group cursor-pointer', className)}
    >
      <Card className="glass neomorphism hover-lift border border-white/10 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">
                {label}
              </p>
              <motion.p 
                className="text-2xl font-bold text-foreground"
                key={value}
                initial={{ scale: 1.2, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {value}
              </motion.p>
            </div>
            <div className={cn(
              'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
              bgColor
            )}>
              <div className={cn('w-6 h-6', color)}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

OptimizedStatCard.displayName = 'OptimizedStatCard';