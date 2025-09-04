import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Wifi, WifiOff } from 'lucide-react';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface TrainingHeaderProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  source: 'ai' | 'cache' | 'fallback' | null;
  timeElapsed: number;
  isActive: boolean;
  averageResponseTime: number;
  diversityScore?: number;
  cacheHitRate?: number;
  onExit: () => void;
}

export function TrainingHeader({
  trainingType,
  level,
  domain,
  source,
  timeElapsed,
  isActive,
  averageResponseTime,
  diversityScore,
  cacheHitRate,
  onExit
}: TrainingHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFromAI = source === 'ai';
  const isFromCache = source === 'cache';
  const isFromFallback = source === 'fallback';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b border-border z-60"
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={onExit} 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quitter
          </Button>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              {isFromAI && <Bot className="w-3 h-3" />}
              {isFromCache && <Wifi className="w-3 h-3" />}
              {isFromFallback && <WifiOff className="w-3 h-3" />}
              {trainingType}
            </Badge>
            <Badge variant="outline">{level}</Badge>
            <Badge variant="outline">{domain}</Badge>
            
            {isFromAI && (
              <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                PrepaCDS AI
              </Badge>
            )}
            {isFromCache && (
              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                Cache
              </Badge>
            )}
            {isFromFallback && (
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                Mode hors ligne
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Temps écoulé:</span>
            <span className="font-mono">{formatTime(timeElapsed)}</span>
          </div>
          
          {isActive && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              En cours
            </div>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {averageResponseTime > 0 && (
              <span>Réponse: {Math.round(averageResponseTime)}ms</span>
            )}
            {diversityScore !== undefined && diversityScore > 0 && (
              <span>Diversité: {Math.round(diversityScore)}%</span>
            )}
            {cacheHitRate !== undefined && cacheHitRate > 0 && (
              <span>Cache: {Math.round(cacheHitRate * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}