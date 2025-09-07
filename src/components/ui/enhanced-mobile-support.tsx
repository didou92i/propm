import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileTouchOptimizedProps {
  children: React.ReactNode
  className?: string
  withHaptic?: boolean
}

export const MobileTouchOptimized: React.FC<MobileTouchOptimizedProps> = ({
  children,
  className,
  withHaptic = false
}) => {
  const handleTouch = () => {
    if (withHaptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div 
      className={cn(
        "touch-manipulation",
        "min-h-[44px] min-w-[44px]", // iOS accessibility standards
        "select-none",
        "active:scale-95 transition-transform duration-150",
        className
      )}
      onTouchStart={handleTouch}
    >
      {children}
    </div>
  );
};

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  withRipple?: boolean
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  withRipple = true,
  onClick,
  ...props
}) => {
  const rippleRef = React.useRef<HTMLDivElement>(null);

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!withRipple || !rippleRef.current) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 600ms linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `;

    rippleRef.current.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);

    onClick?.(event);
  };

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };

  const sizeClasses = {
    sm: "h-9 rounded-md px-3",
    md: "h-10 px-4 py-2",
    lg: "h-11 rounded-md px-8"
  };

  return (
    <button
      className={cn(
        "relative overflow-hidden inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "touch-manipulation active:scale-95",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={createRipple}
      {...props}
    >
      <div ref={rippleRef} className="absolute inset-0" />
      {children}
    </button>
  );
};