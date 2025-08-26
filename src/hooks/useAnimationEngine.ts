import { useCallback, useRef } from 'react';
import { useAnimationOptimization } from '@/hooks/performance';

interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

interface TransitionConfig extends AnimationConfig {
  property?: string;
}

export function useAnimationEngine() {
  const { optimizeForAnimation, cleanupAnimation, animateWithCleanup } = useAnimationOptimization();
  const activeAnimations = useRef<Set<string>>(new Set());

  // Injecter les styles CSS spécifiques PrepaCDS
  const injectPrepaCdsStyles = useCallback(() => {
    const styleId = 'prepacds-animations';
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* PrepaCDS Animation Classes */
        .quiz-entrance { 
          animation: questionEntrance 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .answer-select { 
          animation: answerSelect 0.2s ease-out; 
        }
        .correct-reveal { 
          animation: correctReveal 0.6s ease-out forwards; 
        }
        .incorrect-shake { 
          animation: incorrectShake 0.4s ease-in-out; 
        }
        .step-progression { 
          animation: stepProgression 0.5s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .validation-pulse { 
          animation: validation 0.6s ease-out; 
        }
        .flip-card { 
          transform-style: preserve-3d; 
          perspective: 1000px; 
        }
        .flip-card-front,
        .flip-card-back {
          backface-visibility: hidden;
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
        .interactive-hover {
          transition: all 0.2s ease-out;
        }
        .interactive-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .focus-ring:focus {
          outline: 2px solid hsl(39, 96%, 56%);
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
      console.log('PrepaCDS animation styles injected');
    }
  }, []);

  // Créer une animation CSS personnalisée
  const createCSSAnimation = useCallback((
    name: string,
    keyframes: Record<string, Record<string, string>>,
    config: AnimationConfig = {}
  ) => {
    const { duration = 300, easing = 'ease-out', delay = 0 } = config;
    
    const keyframeString = Object.entries(keyframes)
      .map(([percent, styles]) => {
        const styleString = Object.entries(styles)
          .map(([prop, value]) => `${prop}: ${value}`)
          .join('; ');
        return `${percent} { ${styleString} }`;
      })
      .join(' ');

    const animationRule = `
      @keyframes ${name} {
        ${keyframeString}
      }
    `;

    // Injecter la CSS
    if (!document.getElementById(`animation-${name}`)) {
      const style = document.createElement('style');
      style.id = `animation-${name}`;
      style.textContent = animationRule;
      document.head.appendChild(style);
    }

    return `${name} ${duration}ms ${easing} ${delay}ms`;
  }, []);

  // Appliquer une animation à un élément
  const applyAnimation = useCallback((
    element: HTMLElement,
    animationName: string,
    config: AnimationConfig = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      const { duration = 300 } = config;
      const animationId = `${animationName}-${Date.now()}`;
      
      activeAnimations.current.add(animationId);
      optimizeForAnimation(element, ['transform', 'opacity']);

      element.style.animation = createCSSAnimation(animationName, {}, config);

      const cleanup = () => {
        element.style.animation = '';
        cleanupAnimation(element);
        activeAnimations.current.delete(animationId);
        resolve();
      };

      element.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, duration + 100); // Fallback
    });
  }, [createCSSAnimation, optimizeForAnimation, cleanupAnimation]);

  // Créer une transition fluide
  const createTransition = useCallback((
    element: HTMLElement,
    properties: Record<string, string>,
    config: TransitionConfig = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      const { duration = 300, easing = 'ease-out', delay = 0 } = config;
      
      optimizeForAnimation(element, Object.keys(properties));

      element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;
      
      Object.entries(properties).forEach(([prop, value]) => {
        (element.style as any)[prop] = value;
      });

      const cleanup = () => {
        element.style.transition = '';
        cleanupAnimation(element);
        resolve();
      };

      element.addEventListener('transitionend', cleanup, { once: true });
      setTimeout(cleanup, duration + delay + 100);
    });
  }, [optimizeForAnimation, cleanupAnimation]);

  // Animation de flip card
  const flipCard = useCallback((element: HTMLElement, direction: 'horizontal' | 'vertical' = 'horizontal') => {
    const rotateProperty = direction === 'horizontal' ? 'rotateY' : 'rotateX';
    
    return animateWithCleanup(element, async () => {
      await createTransition(element, {
        transform: `${rotateProperty}(180deg)`
      }, { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    });
  }, [animateWithCleanup, createTransition]);

  // Animation de slide
  const slideIn = useCallback((element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };

    element.style.transform = transforms[direction];
    element.style.opacity = '0';

    return createTransition(element, {
      transform: 'translate(0)',
      opacity: '1'
    }, { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
  }, [createTransition]);

  // Animation de scale avec bounce
  const bounceScale = useCallback((element: HTMLElement, scale: number = 1.1) => {
    return animateWithCleanup(element, async () => {
      await createTransition(element, {
        transform: `scale(${scale})`
      }, { duration: 150 });
      
      await createTransition(element, {
        transform: 'scale(1)'
      }, { duration: 150, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' });
    });
  }, [animateWithCleanup, createTransition]);

  // Animation de glow effect
  const glowEffect = useCallback((element: HTMLElement, color: string = 'hsl(39, 96%, 56%)') => {
    return createTransition(element, {
      boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40, 0 0 60px ${color}20`
    }, { duration: 300 });
  }, [createTransition]);

  // Nettoyer toutes les animations actives
  const clearAllAnimations = useCallback(() => {
    activeAnimations.current.clear();
  }, []);

  return {
    createCSSAnimation,
    applyAnimation,
    createTransition,
    flipCard,
    slideIn,
    bounceScale,
    glowEffect,
    clearAllAnimations,
    injectPrepaCdsStyles,
    activeAnimationsCount: activeAnimations.current.size
  };
}