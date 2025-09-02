import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle, Bot, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { AnimatedQuizPlayer } from './AnimatedQuizPlayer';
import { TrueFalseAnimated } from './TrueFalseAnimated';
import { CasePracticeSimulator } from './CasePracticeSimulator';
import { useTrainingContentGenerator } from '@/hooks/useTrainingContentGenerator';
import { getStaticContent } from '@/data/trainingData';
import { validateTrainingContent, normalizeTrainingContent } from '@/utils/trainingValidation';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface SimpleTrainingPlayerProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  onComplete: (score: number, answers: any[]) => void;
  onExit: () => void;
}

export function SimpleTrainingPlayer({
  trainingType,
  level,
  domain,
  onComplete,
  onExit
}: SimpleTrainingPlayerProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionId] = useState(`training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Utilisation du nouveau hook de génération
  const {
    isLoading,
    content,
    error,
    source,
    generateContent,
    resetState,
    metrics,
    hasContent,
    isFromCache,
    isFromAI,
    isFromFallback
  } = useTrainingContentGenerator();

  // Charger le contenu au montage
  useEffect(() => {
    console.log('🎮 [SimpleTrainingPlayer] Initialisation:', { trainingType, level, domain, sessionId });
    
    const loadContent = async () => {
      try {
        await generateContent(trainingType, level, domain, { sessionId });
        setIsActive(true);
      } catch (error) {
        console.error('❌ [SimpleTrainingPlayer] Échec génération primaire:', error);
        
        // Fallback vers contenu statique uniquement en cas d'échec complet
        console.log('📚 [SimpleTrainingPlayer] Tentative fallback statique');
        const staticContent = getStaticContent(trainingType, domain, level);
        
        if (staticContent) {
          let formattedContent;
          if (trainingType === 'qcm' || trainingType === 'vrai_faux') {
            formattedContent = { questions: staticContent };
          } else {
            formattedContent = staticContent;
          }
          
          const normalizedContent = normalizeTrainingContent(formattedContent, trainingType);
          const validation = validateTrainingContent(normalizedContent, trainingType);
          
          if (validation.isValid) {
            // On utilise directement les données statiques sans passer par le hook
            console.log('✅ [SimpleTrainingPlayer] Fallback statique chargé');
            setIsActive(true);
          } else {
            console.error('❌ [SimpleTrainingPlayer] Fallback statique invalide:', validation.errors);
          }
        }
      }
    };

    loadContent();
  }, [trainingType, level, domain, sessionId, generateContent]);

  // Timer pour mesurer le temps d'entraînement
  useEffect(() => {
    if (!isActive || isLoading) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isLoading]);

  const handleComplete = (score: number, answers: any[]) => {
    console.log('🎯 SimpleTrainingPlayer - Entraînement terminé:', { 
      score, 
      answers, 
      timeElapsed,
      source,
      metrics 
    });
    setIsActive(false);
    onComplete(score, answers);
  };

  const handleExit = () => {
    console.log('🚪 SimpleTrainingPlayer - Sortie utilisateur');
    setIsActive(false);
    resetState();
    onExit();
  };

  const handleRetry = async () => {
    console.log('🔄 SimpleTrainingPlayer - Retry demandé');
    setTimeElapsed(0);
    try {
      await generateContent(trainingType, level, domain, { 
        sessionId: `retry-${Date.now()}`,
        forceRefresh: true 
      });
      setIsActive(true);
    } catch (error) {
      console.error('❌ Retry failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <Bot className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
              <Bot className="w-5 h-5 text-primary" />
              Génération de contenu PrepaCDS
            </h3>
            <p className="text-muted-foreground">
              {trainingType} • {level} • {domain}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Connexion à l'assistant spécialisé...</div>
              {metrics.requestCount > 0 && (
                <div className="flex justify-center gap-4">
                  <span>Requêtes: {metrics.requestCount}</span>
                  <span>Succès: {metrics.successCount}</span>
                  {metrics.errorCount > 0 && <span className="text-destructive">Erreurs: {metrics.errorCount}</span>}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleExit} variant="outline" size="sm">
            Annuler
          </Button>
        </motion.div>
      </div>
    );
  }

  // État d'erreur
  if (error && !hasContent) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Erreur de génération</h3>
            <p className="text-muted-foreground text-sm">
              {error}
            </p>
            <div className="text-xs text-muted-foreground">
              Configuration: {trainingType} • {level} • {domain}
            </div>
            {metrics.requestCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Tentatives: {metrics.requestCount} | Erreurs: {metrics.errorCount}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            <Button onClick={handleExit} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header de contrôle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b border-border z-60"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleExit} 
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
            {metrics.averageResponseTime > 0 && (
              <div className="text-xs text-muted-foreground">
                Temps réponse: {Math.round(metrics.averageResponseTime)}ms
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Zone de contenu principale */}
      <div className="pt-20 h-full overflow-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {trainingType === 'qcm' && (
            <AnimatedQuizPlayer
              questions={content?.questions || []}
              onComplete={handleComplete}
              onExit={handleExit}
              title={`QCM ${domain} - ${level}`}
            />
          )}
          
          {trainingType === 'vrai_faux' && (
            <TrueFalseAnimated
              questions={content?.questions || []}
              onComplete={handleComplete}
              onExit={handleExit}
              title={`Vrai/Faux ${domain} - ${level}`}
            />
          )}
          
          {trainingType === 'cas_pratique' && (
            <CasePracticeSimulator
              caseData={content}
              onComplete={(answers: string[], timeSpent: number) => {
                // Adapter l'interface : calculer un score basé sur les réponses
                const score = Math.min(100, Math.max(0, (answers.length * 20))); // Score simple basé sur le nombre de réponses
                handleComplete(score, answers);
              }}
              onExit={handleExit}
            />
          )}
          
          {!['qcm', 'vrai_faux', 'cas_pratique'].includes(trainingType) && (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Type d'entraînement en développement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Le type d'entraînement "{trainingType}" sera bientôt disponible.
                  </p>
                  <Button onClick={handleExit} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la sélection
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}