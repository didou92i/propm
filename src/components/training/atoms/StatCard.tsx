import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  delay = 0,
  className = ''
}) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        damping: 20,
        stiffness: 300 
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={className}
    >
      <Card className="glass-intense neomorphism hover-lift gradient-border p-6 bg-gradient-to-br from-background/90 via-background/70 to-background/50 border border-primary/20 backdrop-blur-xl shadow-glow group cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground/80 font-medium tracking-wide">{title}</p>
            <motion.p 
              className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: delay + 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              {value}
            </motion.p>
            {subtitle && (
              <motion.p 
                className={`text-xs font-medium ${trendColors[trend]}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.4 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm border border-primary/30 group-hover:shadow-glow group-hover:border-primary/50"
            whileHover={{ 
              scale: 1.1, 
              rotate: 5,
              boxShadow: "0 0 30px hsl(var(--primary) / 0.3)"
            }}
            transition={{ type: "spring", damping: 15 }}
          >
            <Icon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};