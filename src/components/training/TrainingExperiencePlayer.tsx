import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, Square, RotateCcw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';
import { AnimatedQuizPlayer } from './AnimatedQuizPlayer';
import { TrueFalseAnimated } from './TrueFalseAnimated';
import { CasePracticeSimulator } from './CasePracticeSimulator';
import { usePrepaCdsChat } from '@/hooks/usePrepaCdsChat';
import { logger } from '@/utils/logger';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

type DisplayState = 'loading' | 'preparing' | 'countdown' | 'active';

interface TrainingSession {
  id: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  content?: any;
  isActive: boolean;
  progress: number;
  score?: number;
}

interface TrainingExperiencePlayerProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  onComplete: (session: TrainingSession) => void;
  onExit: () => void;
  initialContent?: any;
}

export function TrainingExperiencePlayer({
  trainingType,
  level,
  domain,
  onComplete,
  onExit,
  initialContent
}: TrainingExperiencePlayerProps) {
  const [session, setSession] = useState<TrainingSession>({
    id: `session-${Date.now()}`,
    trainingType,
    level,
    domain,
    isActive: false,
    progress: 0
  });
  
  const [displayState, setDisplayState] = useState<DisplayState>('loading');
  const [content, setContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  
  // Refs pour éviter les conflits React
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef(session.id);
  
  const { generateContent } = usePrepaCdsChat();
  const { injectPrepaCdsStyles } = useAnimationEngine();

  // Génération du contenu interactif avec logs détaillés
  const generateInteractiveContent = async () => {
    const timestamp = new Date().toISOString();
    logger.info('🚀 Début génération contenu', { 
      trainingType, level, domain, sessionId: sessionIdRef.current, timestamp 
    }, 'TrainingExperiencePlayer');
    
    setDisplayState('loading');
    setError(null);
    
    try {
      logger.debug('📤 Appel API generateContent', { trainingType, level, domain }, 'TrainingExperiencePlayer');
      
      const response = await generateContent(trainingType, level, domain);
      
      logger.info('📥 Réponse API reçue', { 
        hasResponse: !!response, 
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        timestamp: new Date().toISOString()
      }, 'TrainingExperiencePlayer');
      
      // La réponse est déjà un objet structuré
      if (response && typeof response === 'object') {
        logger.info('✅ Contenu valide reçu - transition vers preparing', response, 'TrainingExperiencePlayer');
        setContent(response);
        setDisplayState('preparing');
      } else {
        logger.warn('⚠️ Réponse invalide - utilisation fallback', { response }, 'TrainingExperiencePlayer');
        const fallbackContent = generateFallbackContent();
        setContent(fallbackContent);
        setDisplayState('preparing');
      }
      
    } catch (err) {
      logger.error('❌ Erreur génération contenu', err, 'TrainingExperiencePlayer');
      setError('Impossible de générer le contenu. Veuillez réessayer.');
      setDisplayState('loading');
    }
  };

  const generateFallbackContent = () => {
    switch (trainingType) {
      case 'qcm':
        return {
          questions: [
            {
              id: '1',
              question: 'Quelle est la durée légale du travail en France ?',
              options: ['35 heures', '37 heures', '39 heures', '40 heures'],
              correctAnswer: 0,
              explanation: 'La durée légale du travail est de 35 heures par semaine.',
              difficulty: 'facile'
            }
          ]
        };
      case 'vrai_faux':
        return {
          questions: [
            {
              id: '1',
              statement: 'Un agent public peut cumuler plusieurs emplois sans autorisation.',
              isTrue: false,
              explanation: 'Le cumul d\'emplois est strictement réglementé pour les agents publics.',
              domain: domain
            }
          ]
        };
      case 'cas_pratique':
        return {
          title: 'Gestion de conflit en équipe',
          context: 'Vous êtes chef de service et devez gérer un conflit entre deux agents.',
          steps: [
            {
              id: '1',
              title: 'Analyse de la situation',
              scenario: 'Deux agents de votre service ne parviennent plus à collaborer efficacement.',
              question: 'Comment analysez-vous cette situation et quelles premières mesures prenez-vous ?',
              expectedPoints: ['Écoute active', 'Neutralité', 'Médiation'],
              timeLimit: 15
            }
          ],
          totalTime: 45
        };
      default:
        return null;
    }
  };

  const handleSessionComplete = (score?: number, answers?: any[]) => {
    const completedSession: TrainingSession = {
      ...session,
      progress: 100,
      score,
      isActive: false
    };
    
    setSession(completedSession);
    onComplete(completedSession);
  };

  const renderTrainingComponent = () => {
    logger.debug('🎯 renderTrainingComponent appelé', { 
      hasContent: !!content, 
      sessionActive: session.isActive,
      displayState,
      timestamp: new Date().toISOString()
    }, 'TrainingExperiencePlayer');
    
    if (!content || displayState !== 'active') {
      logger.debug('🚫 Conditions non remplies pour affichage composant', { 
        hasContent: !!content, 
        displayState,
        expectedState: 'active'
      }, 'TrainingExperiencePlayer');
      return null;
    }

    switch (trainingType) {
      case 'qcm':
        return (
          <AnimatedQuizPlayer
            questions={content.questions}
            onComplete={handleSessionComplete}
            onExit={onExit}
            title="Quiz Interactif PrepaCDS"
          />
        );
        
      case 'vrai_faux':
        return (
          <TrueFalseAnimated
            questions={content.questions}
            onComplete={handleSessionComplete}
            onExit={onExit}
            title="Vrai ou Faux PrepaCDS"
          />
        );
        
      case 'cas_pratique':
        return (
          <CasePracticeSimulator
            caseData={content}
            onComplete={(answers, timeSpent) => handleSessionComplete(undefined, answers)}
            onExit={onExit}
          />
        );
        
      default:
        return null;
    }
  };

  // Auto-start et gestion du contenu avec logs détaillés
  useEffect(() => {
    logger.info('🎬 Initialisation TrainingExperiencePlayer', { 
      sessionId: sessionIdRef.current,
      trainingType, level, domain,
      hasInitialContent: !!initialContent,
      timestamp: new Date().toISOString()
    }, 'TrainingExperiencePlayer');
    
    // Injecter les styles d'animation PrepaCDS optimisés
    injectPrepaCdsStyles();
    
    // Use initial content if provided, otherwise generate
    if (initialContent) {
      logger.info('📋 Utilisation du contenu initial fourni', initialContent, 'TrainingExperiencePlayer');
      setContent(initialContent);
      setDisplayState('preparing');
    } else if (!content && displayState === 'loading') {
      logger.info('🔄 Lancement génération de contenu', { displayState }, 'TrainingExperiencePlayer');
      generateInteractiveContent();
    }
  }, [initialContent, injectPrepaCdsStyles]);

  // Système de transition d'état contrôlé avec compteur
  useEffect(() => {
    if (displayState === 'preparing' && content) {
      logger.info('⏳ Début phase preparing - lancement compteur 5s', { 
        content: !!content,
        displayState,
        timestamp: new Date().toISOString()
      }, 'TrainingExperiencePlayer');
      
      // Nettoyer les timers précédents
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (activationTimerRef.current) clearTimeout(activationTimerRef.current);
      
      // Démarrer le compteur visuel
      setCountdown(5);
      setDisplayState('countdown');
      
      let currentCount = 5;
      countdownTimerRef.current = setInterval(() => {
        currentCount--;
        logger.debug('⏰ Compteur', { secondesRestantes: currentCount }, 'TrainingExperiencePlayer');
        setCountdown(currentCount);
        
        if (currentCount <= 0) {
          logger.info('🎯 Fin compteur - activation session', { 
            finalDisplayState: 'active',
            timestamp: new Date().toISOString()
          }, 'TrainingExperiencePlayer');
          
          clearInterval(countdownTimerRef.current!);
          setDisplayState('active');
          setSession(prev => ({ ...prev, content, isActive: true }));
        }
      }, 1000);
    }
    
    // Cleanup à la destruction
    return () => {
      if (countdownTimerRef.current) {
        logger.debug('🧹 Nettoyage timer compteur', {}, 'TrainingExperiencePlayer');
        clearInterval(countdownTimerRef.current);
      }
      if (activationTimerRef.current) {
        logger.debug('🧹 Nettoyage timer activation', {}, 'TrainingExperiencePlayer');
        clearTimeout(activationTimerRef.current);
      }
    };
  }, [displayState, content]);

  // Logs des changements d'état de rendu
  logger.debug('🖼️ Rendu état', { 
    displayState, 
    hasContent: !!content, 
    hasError: !!error,
    sessionActive: session.isActive,
    countdown
  }, 'TrainingExperiencePlayer');

  if (displayState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="p-8 border-prepacds-primary/20">
            <CardContent className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-prepacds-primary mx-auto" />
              <h3 className="text-lg font-semibold text-prepacds-primary">
                Génération de votre expérience d'entraînement...
              </h3>
              <p className="text-sm text-muted-foreground">
                Création du contenu personnalisé pour votre niveau et domaine
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 flex items-center justify-center">
        <Card className="p-8 border-destructive/20">
          <CardContent className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-destructive">Erreur</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onExit}>
                Retour
              </Button>
              <Button onClick={generateInteractiveContent} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {displayState === 'active' ? (
        <motion.div
          key="training-active"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderTrainingComponent()}
        </motion.div>
      ) : (
        <motion.div
          key={`training-${displayState}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 flex items-center justify-center"
        >
          <Card className="p-8 border-prepacds-primary/20 min-w-[400px]">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-prepacds-primary">
                {displayState === 'preparing' || displayState === 'countdown' 
                  ? 'Préparation de votre entraînement...' 
                  : 'Configuration de la session'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">{level}</Badge>
                <Badge variant="outline">{domain}</Badge>
                <Badge variant="default">{trainingType}</Badge>
              </div>

              {(displayState === 'preparing' || displayState === 'countdown') && content && (
                <motion.div
                  key="preparing-animation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-prepacds-primary/10 p-6 rounded-lg border border-prepacds-primary/20"
                >
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="animate-pulse w-3 h-3 bg-prepacds-primary rounded-full"></div>
                    <div className="animate-pulse w-3 h-3 bg-prepacds-primary rounded-full" style={{animationDelay: '0.2s'}}></div>
                    <div className="animate-pulse w-3 h-3 bg-prepacds-primary rounded-full" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  
                  {displayState === 'countdown' && (
                    <motion.div
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-center mb-4"
                    >
                      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-prepacds-primary">
                        <Clock className="h-6 w-6" />
                        {countdown}
                      </div>
                    </motion.div>
                  )}
                  
                  <p className="text-sm text-prepacds-primary text-center font-medium">
                    Interface d'animation en cours de préparation...
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {displayState === 'countdown' 
                      ? `Lancement automatique dans ${countdown} seconde${countdown > 1 ? 's' : ''}`
                      : 'Initialisation du compteur...'
                    }
                  </p>
                  <Progress 
                    value={displayState === 'countdown' ? ((5 - countdown) / 5) * 100 : 20} 
                    className="mt-3 h-2" 
                  />
                </motion.div>
              )}

              <Button 
                onClick={() => {
                  logger.info('🎮 Démarrage manuel forcé', { 
                    displayState, 
                    hasContent: !!content,
                    timestamp: new Date().toISOString()
                  }, 'TrainingExperiencePlayer');
                  
                  // Nettoyer les timers
                  if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                  if (activationTimerRef.current) clearTimeout(activationTimerRef.current);
                  
                  setDisplayState('active');
                  setSession(prev => ({ ...prev, isActive: true }));
                }} 
                className="w-full gap-2"
                disabled={!content}
              >
                {content ? (
                  <>
                    <Play className="h-4 w-4" />
                    Commencer maintenant
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Commencer l'entraînement
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}