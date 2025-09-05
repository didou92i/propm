import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedActionButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Bouton d'action optimisé avec memoization et animations fluides
 */
export const OptimizedActionButton = memo<OptimizedActionButtonProps>(({
  variant = 'primary',
  onClick,
  isLoading = false,
  disabled = false,
  icon,
  children,
  className,
  size = 'md'
}) => {
  const baseClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };

  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          'relative font-semibold transition-all duration-300',
          'shadow-lg hover:shadow-xl',
          'focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          baseClasses[size],
          variantClasses[variant],
          className
        )}
      >
        <motion.div
          className="flex items-center gap-2"
          initial={false}
          animate={{ opacity: isLoading ? 0.7 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            icon && <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
        </motion.div>
      </Button>
    </motion.div>
  );
});

OptimizedActionButton.displayName = 'OptimizedActionButton';