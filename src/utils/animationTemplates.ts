// Templates d'animations CSS/JS pour PrepaCDS

export const QUIZ_ANIMATIONS = {
  // Animation d'apparition des questions
  questionEntrance: {
    keyframes: {
      '0%': { 
        opacity: '0', 
        transform: 'translateY(30px) scale(0.95)' 
      },
      '100%': { 
        opacity: '1', 
        transform: 'translateY(0) scale(1)' 
      }
    },
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Animation de sélection de réponse
  answerSelect: {
    keyframes: {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' }
    },
    duration: 200,
    easing: 'ease-out'
  },

  // Animation de révélation de la bonne réponse
  correctReveal: {
    keyframes: {
      '0%': { 
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))'
      },
      '50%': { 
        backgroundColor: 'hsl(142, 76%, 36%)',
        color: 'white',
        transform: 'scale(1.02)'
      },
      '100%': { 
        backgroundColor: 'hsl(142, 76%, 36%)',
        color: 'white',
        transform: 'scale(1)'
      }
    },
    duration: 600,
    easing: 'ease-out'
  },

  // Animation de mauvaise réponse
  incorrectShake: {
    keyframes: {
      '0%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(-5px)' },
      '50%': { transform: 'translateX(5px)' },
      '75%': { transform: 'translateX(-3px)' },
      '100%': { transform: 'translateX(0)' }
    },
    duration: 400,
    easing: 'ease-in-out'
  }
};

export const FLIP_CARD_ANIMATIONS = {
  // Animation de flip horizontal
  flipHorizontal: {
    keyframes: {
      '0%': { transform: 'rotateY(0deg)' },
      '100%': { transform: 'rotateY(180deg)' }
    },
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Animation de flip avec perspective
  flipPerspective: {
    keyframes: {
      '0%': { 
        transform: 'perspective(1000px) rotateY(0deg)' 
      },
      '50%': { 
        transform: 'perspective(1000px) rotateY(90deg) scale(0.8)' 
      },
      '100%': { 
        transform: 'perspective(1000px) rotateY(180deg)' 
      }
    },
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

export const CASE_STUDY_ANIMATIONS = {
  // Animation de progression étape par étape
  stepProgression: {
    keyframes: {
      '0%': { 
        opacity: '0',
        transform: 'translateX(100px)',
        filter: 'blur(5px)'
      },
      '100%': { 
        opacity: '1',
        transform: 'translateX(0)',
        filter: 'blur(0)'
      }
    },
    duration: 500,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Animation de validation
  validation: {
    keyframes: {
      '0%': { 
        transform: 'scale(1)',
        boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)'
      },
      '50%': { 
        transform: 'scale(1.05)',
        boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)'
      },
      '100%': { 
        transform: 'scale(1)',
        boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)'
      }
    },
    duration: 600,
    easing: 'ease-out'
  }
};

export const LOADING_ANIMATIONS = {
  // Animation de loading dots
  dots: {
    keyframes: {
      '0%': { opacity: '0.4' },
      '50%': { opacity: '1' },
      '100%': { opacity: '0.4' }
    },
    duration: 1000,
    easing: 'ease-in-out'
  },

  // Animation de pulse
  pulse: {
    keyframes: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '50%': { transform: 'scale(1.1)', opacity: '0.7' },
      '100%': { transform: 'scale(1)', opacity: '1' }
    },
    duration: 1500,
    easing: 'ease-in-out'
  }
};

// CSS Classes prêtes à l'emploi
export const ANIMATION_CLASSES = `
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

  .step-progression {
    animation: stepProgression 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .validation-pulse {
    animation: validation 0.6s ease-out;
  }

  .loading-dots {
    animation: dots 1s ease-in-out infinite;
  }

  .loading-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  /* Hover effects */
  .interactive-hover {
    transition: all 0.2s ease-out;
  }

  .interactive-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Focus states pour accessibilité */
  .focus-ring:focus {
    outline: 2px solid hsl(39, 96%, 56%);
    outline-offset: 2px;
  }
`;

// Fonction utilitaire pour injecter les animations CSS
export function injectAnimationStyles() {
  const styleId = 'prepacds-animations';
  
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = ANIMATION_CLASSES;
    document.head.appendChild(style);
  }
}