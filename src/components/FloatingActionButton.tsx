
import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRipple } from '@/hooks/useRipple';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  tooltip?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16'
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24
};

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6'
};

const variantClasses = {
  primary: 'gradient-agent-animated text-white shadow-lg hover:shadow-xl',
  secondary: 'glass neomorphism text-foreground hover:glass-intense',
  accent: 'bg-accent text-accent-foreground shadow-lg hover:shadow-xl'
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  variant = 'primary',
  tooltip,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const createRipple = useRipple();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick();
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-full
          p-0
          hover-lift
          ripple-container
          transform-3d
          hover-tilt
          transition-all
          duration-300
          ${className}
        `}
        title={tooltip}
      >
        <Icon 
          size={iconSizes[size]} 
          className={`transition-transform duration-200 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
      </Button>
    </div>
  );
};
