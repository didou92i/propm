import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle, Bot, Wifi, WifiOff } from 'lucide-react';
import { AnimatedQuizPlayer } from './AnimatedQuizPlayer';
import { TrueFalseAnimated } from './TrueFalseAnimated';
import { CasePracticeSimulator } from './CasePracticeSimulator';
import { usePrepaCdsChat } from '@/hooks/usePrepaCdsChat';
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
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [contentSource, setContentSource] = useState<'ai' | 'fallback'>('ai');
  
  const { generateContent, isLoading: isPrepaCdsLoading } = usePrepaCdsChat();

  // Charger le contenu via l'assistant PrepaCDS
  useEffect(() => {
    console.log('🤖 SimpleTrainingPlayer - Chargement contenu PrepaCDS:', { trainingType, domain, level });
    
    const loadContent = async () => {
      try {
        setIsLoading(true);
        
        // Essayer d'abord l'assistant PrepaCDS
        const aiContent = await generateContent(trainingType, level, domain);
        
        if (aiContent && Object.keys(aiContent).length > 0) {
          console.log('✅ Contenu PrepaCDS chargé:', aiContent);
          
          // Valider et normaliser le contenu AI
          const validation = validateTrainingContent(aiContent, trainingType);
          if (validation.isValid) {
            const normalizedContent = normalizeTrainingContent(aiContent, trainingType);
            setContent(normalizedContent);
            setContentSource('ai');
          } else {
            console.warn('⚠️ Contenu PrepaCDS invalide:', validation.errors);
            throw new Error('Contenu PrepaCDS invalide');
          }
        } else {
          throw new Error('Contenu PrepaCDS vide');
        }
        
      } catch (error) {
        console.warn('⚠️ Fallback vers contenu statique:', error);
        
        // Fallback vers contenu statique
        const staticContent = getStaticContent(trainingType, domain, level);
        console.log('📚 Contenu statique chargé:', staticContent);
        
        // Format and validate static content
        let formattedContent;
        if (trainingType === 'qcm' || trainingType === 'vrai_faux') {
          formattedContent = { questions: staticContent };
        } else {
          formattedContent = staticContent;
        }
        
        const normalizedContent = normalizeTrainingContent(formattedContent, trainingType);
        const validation = validateTrainingContent(normalizedContent, trainingType);
        
        if (validation.isValid) {
          setContent(normalizedContent);
          setContentSource('fallback');
        } else {
          console.error('❌ Contenu statique invalide:', validation.errors);
          setContent(null);
        }
      } finally {
        setIsLoading(false);
        setIsActive(true);
      }
    };

    loadContent();
  }, [trainingType, domain, level, generateContent]);

  // Timer pour mesurer le temps d'entraînement
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  const handleComplete = (score: number, answers: any[]) => {
    console.log('🎯 SimpleTrainingPlayer - Entraînement terminé:', { score, answers, timeElapsed });
    setIsActive(false);
    onComplete(score, answers);
  };

  const handleExit = () => {
    console.log('🚪 SimpleTrainingPlayer - Sortie utilisateur');
    setIsActive(false);
    onExit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Génération du contenu PrepaCDS
            </h3>
            <p className="text-muted-foreground">
              {trainingType} • {level} • {domain}
            </p>
            <p className="text-xs text-muted-foreground">
              Connexion à l'assistant spécialisé...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <ArrowLeft className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Contenu non disponible</h3>
            <p className="text-muted-foreground">
              Impossible de charger le contenu pour ce type d'entraînement.
            </p>
          </div>
          <Button onClick={onExit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
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
                {contentSource === 'ai' ? <Bot className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                {trainingType}
              </Badge>
              <Badge variant="outline">{level}</Badge>
              <Badge variant="outline">{domain}</Badge>
              {contentSource === 'ai' && (
                <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                  PrepaCDS AI
                </Badge>
              )}
              {contentSource === 'fallback' && (
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