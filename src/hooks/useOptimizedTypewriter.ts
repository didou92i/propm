import { useState, useEffect, useRef } from 'react';
import { getPerformanceConfig } from '@/config/performance';

interface UseOptimizedTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  disabled?: boolean;
  adaptiveSpeed?: boolean;
}

export const useOptimizedTypewriter = ({ 
  text, 
  speed,
  delay = 0,
  onComplete,
  disabled = false,
  adaptiveSpeed = true
}: UseOptimizedTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationFrameRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const config = getPerformanceConfig();
  
  // Calculate optimal speed based on text length and config
  const getOptimalSpeed = () => {
    if (speed !== undefined) return speed;
    if (disabled || config.disableAnimations) return 0;
    
    if (adaptiveSpeed && config.adaptiveSpeed) {
      // Adaptive speed: faster for longer messages
      const baseSpeed = config.typewriterSpeed;
      if (text.length > 2000) return 1; // Very fast for long messages
      if (text.length > 500) return Math.max(1, baseSpeed - 1);
      return baseSpeed;
    }
    
    return config.typewriterSpeed;
  };

  // Calculate chunk size for character revelation
  const getChunkSize = () => {
    if (disabled || config.disableAnimations) return text.length;
    
    const baseChunkSize = config.chunkSize;
    if (adaptiveSpeed && text.length > 1000) {
      return Math.min(baseChunkSize * 2, 5); // Larger chunks for long text
    }
    return baseChunkSize;
  };

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(false);

    if (!text) return;
    
    // Clear any existing timers
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const optimalSpeed = getOptimalSpeed();
    const chunkSize = getChunkSize();
    
    // Instant display if disabled or speed is 0
    if (disabled || config.disableAnimations || optimalSpeed === 0) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      onComplete?.();
      return;
    }

    const startTyping = () => {
      setIsTyping(true);
      let localIndex = 0;
      
      const typeNextChunk = () => {
        if (localIndex >= text.length) {
          setIsTyping(false);
          onComplete?.();
          return;
        }
        
        const nextIndex = Math.min(localIndex + chunkSize, text.length);
        const nextText = text.slice(0, nextIndex);
        
        setDisplayedText(nextText);
        setCurrentIndex(nextIndex);
        localIndex = nextIndex;
        
        if (localIndex < text.length) {
          // Use requestAnimationFrame for better performance
          timeoutRef.current = setTimeout(() => {
            animationFrameRef.current = requestAnimationFrame(typeNextChunk);
          }, optimalSpeed);
        } else {
          setIsTyping(false);
          onComplete?.();
        }
      };
      
      // Start typing
      animationFrameRef.current = requestAnimationFrame(typeNextChunk);
    };

    timeoutRef.current = setTimeout(startTyping, delay);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, disabled, adaptiveSpeed, config]);

  const skipAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setDisplayedText(text);
    setCurrentIndex(text.length);
    setIsTyping(false);
    onComplete?.();
  };

  const fastForward = () => {
    const remainingText = text.slice(currentIndex);
    if (remainingText.length > 0) {
      // Skip to 80% completion, then let normal animation finish
      const targetIndex = Math.floor(text.length * 0.8);
      setDisplayedText(text.slice(0, targetIndex));
      setCurrentIndex(targetIndex);
    }
  };

  return {
    displayedText,
    isTyping,
    skipAnimation,
    fastForward,
    progress: text.length > 0 ? currentIndex / text.length : 1
  };
};