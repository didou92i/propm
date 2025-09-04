import { useState, useEffect, useRef, useCallback } from 'react';

interface ContentAnalysis {
  type: 'code' | 'narrative' | 'list' | 'title' | 'mixed';
  hasCode: boolean;
  hasTables: boolean;
  avgSentenceLength: number;
  punctuationDensity: number;
}

interface UseNaturalTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  disabled?: boolean;
  naturalPauses?: boolean;
  showCursor?: boolean;
}

const SPEEDS = {
  narrative: { base: 25, variance: 10 },
  code: { base: 15, variance: 5 },
  list: { base: 20, variance: 8 },
  title: { base: 35, variance: 15 },
  mixed: { base: 22, variance: 12 }
};

const PAUSE_AFTER = {
  '.': 300,
  '!': 350,
  '?': 320,
  ':': 200,
  ';': 180,
  ',': 120,
  '\n': 150
};

export const useNaturalTypewriter = ({ 
  text, 
  speed,
  delay = 0,
  onComplete,
  disabled = false,
  naturalPauses = true,
  showCursor = true
}: UseNaturalTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBlinkingCursor, setShowBlinkingCursor] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastCharacterRef = useRef<string>('');

  // Analyze content type for adaptive speed
  const analyzeContent = useCallback((content: string): ContentAnalysis => {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const inlineCodeRegex = /`[^`]+`/g;
    const tableRegex = /\|.*?\|/g;
    const titleRegex = /^#{1,6}\s+.*/gm;
    const listRegex = /^[\s]*[-*+]\s+/gm;
    
    const hasCode = codeBlockRegex.test(content) || inlineCodeRegex.test(content);
    const hasTables = tableRegex.test(content);
    const titleMatches = content.match(titleRegex)?.length || 0;
    const listMatches = content.match(listRegex)?.length || 0;
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;
    const punctuationCount = (content.match(/[.!?,:;]/g) || []).length;
    const punctuationDensity = punctuationCount / content.length;
    
    let type: ContentAnalysis['type'] = 'narrative';
    
    if (hasCode && titleMatches > 0 && listMatches > 0) {
      type = 'mixed';
    } else if (hasCode) {
      type = 'code';
    } else if (titleMatches > listMatches && titleMatches > 0) {
      type = 'title';
    } else if (listMatches > 0) {
      type = 'list';
    }
    
    return {
      type,
      hasCode,
      hasTables,
      avgSentenceLength: avgSentenceLength || 50,
      punctuationDensity
    };
  }, []);

  // Get dynamic speed based on content and position
  const getDynamicSpeed = useCallback((char: string, position: number, analysis: ContentAnalysis): number => {
    if (speed !== undefined) return speed;
    
    const speedConfig = SPEEDS[analysis.type];
    const baseSpeed = speedConfig.base;
    const variance = speedConfig.variance;
    
    // Add natural variance (±variance ms)
    const naturalVariance = (Math.random() - 0.5) * 2 * variance;
    let finalSpeed = baseSpeed + naturalVariance;
    
    // Adjust for specific patterns
    if (char === ' ') {
      finalSpeed *= 0.7; // Spaces are faster
    } else if (/[A-Z]/.test(char) && position > 0) {
      finalSpeed *= 1.2; // Capital letters slightly slower
    } else if (/\d/.test(char)) {
      finalSpeed *= 0.8; // Numbers faster
    }
    
    // Length adjustment - longer messages slightly faster
    if (text.length > 1000) {
      finalSpeed *= 0.85;
    } else if (text.length > 500) {
      finalSpeed *= 0.92;
    }
    
    return Math.max(10, Math.min(60, finalSpeed));
  }, [speed, text.length]);

  // Get pause duration after character
  const getPauseDuration = useCallback((char: string): number => {
    if (!naturalPauses) return 0;
    return PAUSE_AFTER[char] || 0;
  }, [naturalPauses]);

  // Type one character with natural timing
  const typeCharacter = useCallback((
    analysis: ContentAnalysis, 
    currentPos: number, 
    callback: () => void
  ) => {
    if (currentPos >= text.length) {
      setIsTyping(false);
      setShowBlinkingCursor(true);
      onComplete?.();
      return;
    }
    
    const char = text[currentPos];
    const nextText = text.slice(0, currentPos + 1);
    
    setDisplayedText(nextText);
    setCurrentIndex(currentPos + 1);
    lastCharacterRef.current = char;
    
    // Calculate timing for next character
    const charSpeed = getDynamicSpeed(char, currentPos, analysis);
    const pauseAfter = getPauseDuration(char);
    const totalDelay = charSpeed + pauseAfter;
    
    timeoutRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        typeCharacter(analysis, currentPos + 1, callback);
      });
    }, totalDelay);
  }, [text, getDynamicSpeed, getPauseDuration, onComplete]);

  // Handle special content blocks (code, lists)
  const shouldRevealAsBlock = useCallback((position: number): number => {
    const remaining = text.slice(position);
    
    // Code blocks - reveal line by line
    if (remaining.startsWith('```')) {
      const endPos = remaining.indexOf('```', 3);
      if (endPos !== -1) {
        return position + endPos + 3;
      }
    }
    
    // List items - reveal complete items
    if (remaining.match(/^[\s]*[-*+]\s+/)) {
      const nextNewline = remaining.indexOf('\n');
      if (nextNewline !== -1) {
        return position + nextNewline;
      }
    }
    
    return position;
  }, [text]);

  useEffect(() => {
    // Reset state
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(false);
    setShowBlinkingCursor(false);
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (!text || disabled) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      onComplete?.();
      return;
    }
    
    const analysis = analyzeContent(text);
    
    const startTyping = () => {
      setIsTyping(true);
      setShowBlinkingCursor(false);
      typeCharacter(analysis, 0, () => {});
    };
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(startTyping, delay);
    } else {
      startTyping();
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [text, delay, disabled, analyzeContent, typeCharacter]);

  const skipAnimation = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setDisplayedText(text);
    setCurrentIndex(text.length);
    setIsTyping(false);
    setShowBlinkingCursor(false);
    onComplete?.();
  }, [text, onComplete]);

  const pauseResume = useCallback(() => {
    if (isTyping) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsTyping(false);
      setShowBlinkingCursor(true);
    } else if (currentIndex < text.length) {
      setShowBlinkingCursor(false);
      const analysis = analyzeContent(text);
      typeCharacter(analysis, currentIndex, () => {});
    }
  }, [isTyping, currentIndex, text, analyzeContent, typeCharacter]);

  const speedUp = useCallback(() => {
    // Reduce all timings by 50% for faster typing
    // This would need to be implemented in the timing logic
  }, []);

  return {
    displayedText: showCursor && (isTyping || showBlinkingCursor) 
      ? displayedText + (showBlinkingCursor ? '|' : '')
      : displayedText,
    isTyping,
    skipAnimation,
    pauseResume,
    speedUp,
    progress: text.length > 0 ? currentIndex / text.length : 1,
    showBlinkingCursor
  };
};