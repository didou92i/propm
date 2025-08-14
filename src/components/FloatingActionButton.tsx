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
  primary: 'gradient-agent-animated text-primary-foreground shadow-lg hover:shadow-xl',
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
        className={`${sizeClasses[size]} ${variantClasses[variant]} ${className} 
          rounded-full p-0 transition-all duration-300 overflow-hidden relative
          hover:scale-110 active:scale-95 
          sm:${sizeClasses[size]} 
          xs:w-12 xs:h-12`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltip}
        aria-label={tooltip}
      >
        <Icon 
          size={iconSizes[size]} 
          className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`} 
        />
        {tooltip && (
          <div className={`absolute ${position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'} 
            ${position.includes('bottom') ? 'bottom-0' : 'top-0'} 
            bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap
            opacity-0 pointer-events-none transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
            hidden sm:block`}
          >
            {tooltip}
          </div>
        )}
      </Button>
    </div>
  );
};