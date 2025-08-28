import { useCallback, useRef } from 'react';
import { useAnimationOptimization } from '@/hooks/performance';
import { logger } from '@/utils/logger';

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

  // Injecter les styles CSS spécifiques PrepaCDS - VERSION CONSOLIDÉE
  const injectPrepaCdsStyles = useCallback(() => {
    const styleId = 'prepacds-animations';
    
    // Toujours réinjecter pour forcer la persistence
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      logger.debug("Ancien style supprimé pour réinjection", { styleId }, "useAnimationEngine");
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* KEYFRAMES CONSOLIDÉES - Durées étendues pour visibilité */
      @keyframes questionEntrance {
        0% { opacity: 0; transform: translateY(30px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      
      @keyframes answerSelect {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes correctReveal {
        0% { 
          background-color: hsl(var(--background)); 
          color: hsl(var(--foreground));
          transform: scale(1);
        }
        20% { 
          background-color: hsl(142, 76%, 36%); 
          color: white;
          transform: scale(1.05);
        }
        100% { 
          background-color: hsl(142, 76%, 36%) !important; 
          color: white !important;
          transform: scale(1.1) !important;
          box-shadow: 0 0 25px hsl(142, 76%, 36%, 0.6) !important;
        }
      }
      
      @keyframes incorrectShake {
        0% { transform: translateX(0); background-color: hsl(var(--background)); }
        10% { transform: translateX(-8px); background-color: hsl(0, 84%, 60%); color: white; }
        20% { transform: translateX(8px); }
        30% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        50% { transform: translateX(-4px); }
        60% { transform: translateX(4px); }
        70% { transform: translateX(-2px); }
        80% { transform: translateX(2px); }
        100% { 
          transform: translateX(0); 
          background-color: hsl(0, 84%, 60%) !important; 
          color: white !important;
        }
      }
      
      /* CLASSES AVEC PERSISTENCE RENFORCÉE */
      .quiz-entrance { 
        animation: questionEntrance 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important; 
      }
      
      .answer-select { 
        animation: answerSelect 0.3s ease-out !important;
        animation-fill-mode: forwards !important;
      }
      
      .correct-reveal { 
        animation: correctReveal 3s ease-out forwards !important;
        animation-fill-mode: forwards !important;
        background-color: hsl(142, 76%, 36%) !important;
        border-color: hsl(142, 76%, 36%) !important;
        color: white !important;
        box-shadow: 0 0 25px hsl(142, 76%, 36%, 0.6) !important;
        transform: scale(1.1) !important;
      }
      
      .incorrect-shake { 
        animation: incorrectShake 2s ease-in-out forwards !important;
        animation-fill-mode: forwards !important;
        background-color: hsl(0, 84%, 60%) !important;
        border-color: hsl(0, 84%, 60%) !important;
        color: white !important;
      }
      
      /* PROTECTION CONTRE LES OVERRIDES */
      [data-animation-lock="true"] {
        animation-fill-mode: forwards !important;
        animation-play-state: running !important;
      }
      
      [data-correct="true"] {
        background-color: hsl(142, 76%, 36%) !important;
        border-color: hsl(142, 76%, 36%) !important;
        color: white !important;
        transform: scale(1.1) !important;
        box-shadow: 0 0 25px hsl(142, 76%, 36%, 0.6) !important;
      }
      
      [data-incorrect="true"] {
        background-color: hsl(0, 84%, 60%) !important;
        border-color: hsl(0, 84%, 60%) !important;
        color: white !important;
      }
      
      [data-correct-reveal="true"] {
        background-color: hsl(142, 76%, 36%) !important;
        border-color: hsl(142, 76%, 36%) !important;
        color: white !important;
        box-shadow: 0 0 15px hsl(142, 76%, 36%, 0.4) !important;
      }
      
      /* UTILITAIRES */
      .flip-card { 
        transform-style: preserve-3d; 
        perspective: 1000px; 
      }
      .flip-card-front, .flip-card-back {
        backface-visibility: hidden;
        position: absolute;
        width: 100%;
        height: 100%;
      }
      .flip-card-back { transform: rotateY(180deg); }
      
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
    
    logger.info("Styles PrepaCDS injectés avec persistence renforcée", { 
      styleId,
      contentLength: style.textContent.length 
    }, "useAnimationEngine");
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

  // Appliquer une animation à un élément avec logs détaillés
  const applyAnimation = useCallback((
    element: HTMLElement,
    animationName: string,
    config: AnimationConfig & { persist?: boolean } = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      const { duration = 300, persist = false } = config;
      const animationId = `${animationName}-${Date.now()}`;
      
      logger.debug("Début applyAnimation", { 
        animationName, 
        animationId, 
        duration, 
        persist,
        elementTag: element.tagName,
        elementClasses: element.className 
      }, "useAnimationEngine");
      
      activeAnimations.current.add(animationId);
      optimizeForAnimation(element, ['transform', 'opacity', 'background-color', 'border-color', 'box-shadow']);

      element.style.animation = createCSSAnimation(animationName, {}, config);
      
      logger.debug("Animation appliquée", { 
        animationId,
        appliedStyle: element.style.animation,
        totalActiveAnimations: activeAnimations.current.size 
      }, "useAnimationEngine");

      const cleanup = () => {
        if (!persist) {
          element.style.animation = '';
          logger.debug("Animation nettoyée", { animationId }, "useAnimationEngine");
        } else {
          logger.debug("Animation persistée", { animationId }, "useAnimationEngine");
        }
        activeAnimations.current.delete(animationId);
        resolve();
      };

      element.addEventListener('animationend', cleanup, { once: true });
      
      // Timeout étendu pour éviter nettoyage prématuré
      const timeoutDuration = persist ? duration * 2 : duration + 500;
      setTimeout(cleanup, timeoutDuration);
    });
  }, [createCSSAnimation, optimizeForAnimation]);

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