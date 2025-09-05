import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
interface ActionButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}
export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'primary',
  children,
  onClick,
  isLoading = false,
  disabled = false,
  icon,
  className = ''
}) => {
  const baseClasses = "relative overflow-hidden transition-all duration-300";
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    outline: "border-2 border-primary/20 hover:border-primary/40 bg-background/50 hover:bg-primary/5"
  };
  return <motion.div whileHover={{
    scale: 1.02
  }} whileTap={{
    scale: 0.98
  }} transition={{
    duration: 0.2
  }}>
      
    </motion.div>;
};