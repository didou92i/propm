import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className={onClick ? "cursor-pointer" : ""}
      onClick={onClick}
    >
      <Card className={`glass neomorphism p-6 bg-gradient-to-br ${gradient} border border-white/10 backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <p className="text-xs text-green-600 dark:text-green-400">{change}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};