import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRipple } from '@/hooks/useRipple';
import { useIsMobile } from '@/hooks/use-mobile';
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
  'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
  'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
  'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
  'top-left': 'top-4 left-4 sm:top-6 sm:left-6'
};

const mobilePositionClasses = {
  'bottom-right': 'bottom-20 right-4', // Above mobile tab bar
  'bottom-left': 'bottom-20 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4'
};

const variantClasses = {
  primary: 'gradient-agent-animated text-primary-foreground shadow-xl hover:shadow-2xl backdrop-blur-sm',
  secondary: 'glass neomorphism text-foreground hover:glass-intense backdrop-blur-md bg-background/80',
  accent: 'bg-accent/90 text-accent-foreground shadow-xl hover:shadow-2xl backdrop-blur-sm'
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
  const createRipple = useRipple('enhanced');
  const isMobile = useIsMobile();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    // Haptic feedback on mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onClick();
  };
  
  return (
    <div className={`fixed ${isMobile ? mobilePositionClasses[position] : positionClasses[position]} z-50`}>
      <Button
        className={`
          ${sizeClasses[size]} ${variantClasses[variant]} ${className}
          rounded-full p-0 transition-all duration-300 overflow-hidden relative
          ${isMobile ? 'active:scale-90 touch-manipulation' : 'hover:scale-110 active:scale-95'}
          ${isMobile ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'}
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
          ${isMobile ? 'min-h-[48px] min-w-[48px]' : ''}
        `}
        onClick={handleClick}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onTouchStart={() => isMobile && setIsHovered(true)}
        onTouchEnd={() => isMobile && setIsHovered(false)}
        title={tooltip}
        aria-label={tooltip}
      >
        <Icon 
          size={isMobile ? Math.max(iconSizes[size] - 2, 16) : iconSizes[size]} 
          className={`transition-transform duration-200 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`} 
        />
        
        {/* Tooltip - hidden on mobile, shown on desktop */}
        {tooltip && !isMobile && (
          <div className={`
            absolute ${position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'} 
            ${position.includes('bottom') ? 'bottom-0' : 'top-0'} 
            bg-popover text-popover-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap
            opacity-0 pointer-events-none transition-all duration-200 shadow-lg backdrop-blur-sm
            ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
            z-50 border border-border/50
          `}>
            {tooltip}
            {/* Arrow */}
            <div className={`
              absolute ${position.includes('right') ? 'left-full' : 'right-full'} 
              ${position.includes('bottom') ? 'bottom-2' : 'top-2'}
              w-0 h-0 border-2 border-transparent
              ${position.includes('right') 
                ? 'border-l-popover' 
                : 'border-r-popover'
              }
            `} />
          </div>
        )}
      </Button>
    </div>
  );
};