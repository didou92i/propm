import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface MorphingIconProps {
  fromIcon: LucideIcon;
  toIcon: LucideIcon;
  isActive: boolean;
  size?: number;
  className?: string;
  duration?: number;
}

export const MorphingIcon: React.FC<MorphingIconProps> = ({
  fromIcon: FromIcon,
  toIcon: ToIcon,
  isActive,
  size = 24,
  className = '',
  duration = 300
}) => {
  const [isMorphing, setIsMorphing] = useState(false);

  useEffect(() => {
    setIsMorphing(true);
    const timer = setTimeout(() => setIsMorphing(false), duration);
    return () => clearTimeout(timer);
  }, [isActive, duration]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div
        className={`absolute inset-0 transition-all duration-${duration} ${
          isActive ? 'opacity-0 scale-75 rotate-180' : 'opacity-100 scale-100 rotate-0'
        }`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        <FromIcon size={size} />
      </div>
      <div
        className={`absolute inset-0 transition-all duration-${duration} ${
          isActive ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-180'
        }`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        <ToIcon size={size} />
      </div>
      {isMorphing && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer" />
      )}
    </div>
  );
};