import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  gradient?: string;
  delay?: number;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  gradient = "from-primary/20 to-primary/5",
  delay = 0,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        damping: 20,
        stiffness: 300
      }}
      whileHover={{ 
        scale: 1.03, 
        y: -8,
        rotateX: 5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "cursor-pointer transform-3d group",
        onClick ? "active:scale-95" : ""
      )}
      onClick={onClick}
    >
      <Card className={`glass-intense neomorphism hover-lift gradient-border p-6 bg-gradient-to-br ${gradient} border border-primary/20 backdrop-blur-xl shadow-glow`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground/80 font-medium tracking-wide">{title}</p>
            <motion.p 
              className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", damping: 15 }}
            >
              {value}
            </motion.p>
            {change && (
              <motion.p 
                className="text-xs font-medium text-green-500 dark:text-green-400"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
              >
                {change}
              </motion.p>
            )}
          </div>
          <motion.div 
            className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-transparent backdrop-blur-sm border border-primary/30 group-hover:border-primary/50"
            whileHover={{ 
              scale: 1.15,
              rotate: 8,
              boxShadow: "0 0 30px hsl(var(--primary) / 0.4)"
            }}
            transition={{ type: "spring", damping: 15 }}
          >
            <Icon className="h-5 w-5 text-primary group-hover:text-primary/90 transition-colors duration-300" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};