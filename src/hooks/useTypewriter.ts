import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export const useTypewriter = ({ 
  text, 
  speed = 50, 
  delay = 0,
  onComplete 
}: UseTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(false);

    if (!text) return;

    const startTyping = () => {
      setIsTyping(true);
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          setDisplayedText(text.slice(0, nextIndex));
          
          if (nextIndex >= text.length) {
            clearInterval(timer);
            setIsTyping(false);
            onComplete?.();
            return nextIndex;
          }
          
          return nextIndex;
        });
      }, speed);

      return () => clearInterval(timer);
    };

    const delayTimer = setTimeout(startTyping, delay);
    return () => clearTimeout(delayTimer);
  }, [text, speed, delay, onComplete]);

  const skipAnimation = () => {
    setDisplayedText(text);
    setCurrentIndex(text.length);
    setIsTyping(false);
    onComplete?.();
  };

  return {
    displayedText,
    isTyping,
    skipAnimation
  };
};