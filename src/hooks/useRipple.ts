import { useCallback } from 'react';

export const useRipple = (intensity: 'normal' | 'enhanced' | 'intense' = 'normal') => {
  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    // Apply different ripple effects based on intensity
    switch (intensity) {
      case 'enhanced':
        ripple.classList.add('ripple-effect');
        ripple.style.background = 'radial-gradient(circle, hsl(var(--agent-primary) / 0.4) 0%, hsl(var(--agent-primary) / 0.1) 50%, transparent 70%)';
        ripple.style.animation = 'ripple-enhanced 0.8s ease-out';
        break;
      case 'intense':
        ripple.classList.add('ripple-effect');
        ripple.style.background = 'radial-gradient(circle, hsl(var(--agent-primary) / 0.6) 0%, hsl(var(--agent-accent) / 0.3) 40%, transparent 70%)';
        ripple.style.animation = 'ripple-intense 1s ease-out';
        ripple.style.boxShadow = '0 0 20px hsl(var(--agent-primary) / 0.3)';
        break;
      default:
        ripple.classList.add('ripple-effect');
        ripple.style.animation = 'ripple 0.6s linear';
    }
    
    // Remove existing ripples
    const existingRipple = button.querySelector('.ripple-effect');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, intensity === 'intense' ? 1000 : intensity === 'enhanced' ? 800 : 600);
  }, [intensity]);

  return createRipple;
};