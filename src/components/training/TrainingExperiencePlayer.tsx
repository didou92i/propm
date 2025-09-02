import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, Square, RotateCcw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
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
  // Machine à états avec double verrou
  const [displayState, setDisplayState] = useState<DisplayState>('loading');
  const [contentReady, setContentReady] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparingTimeLeft, setPreparingTimeLeft] = useState(8);
  const [countdown, setCountdown] = useState(3);
  
  // Session avec ID corrélé
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [session, setSession] = useState<TrainingSession>({
    id: sessionIdRef.current,
    trainingType,
    level,
    domain,
    isActive: false,
    progress: 0
  });
  
  // Refs pour timers et verrouillage
  const preparingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionLockRef = useRef<boolean>(false);
  
  const { generateContent } = usePrepaCdsChat();
  const { injectPrepaCdsStyles } = useAnimationEngine();

  // Génération avec logs corrélés par sessionId
  const generateInteractiveContent = async () => {
    if (transitionLockRef.current) {
      logger.warn('🔒 Génération bloquée', { sessionId: sessionIdRef.current }, 'TrainingExperiencePlayer');
      return;
    }
    
    transitionLockRef.current = true;
    const startTime = new Date().toISOString();
    
    logger.info('🚀 [START] Génération contenu', { 
      sessionId: sessionIdRef.current,
      trainingType, level, domain,
      timestamp: startTime
    }, 'TrainingExperiencePlayer');
    
    setDisplayState('loading');
    setError(null);
    setContentReady(false);
    
    try {
      const response = await generateContent(trainingType, level, domain);
      
      // Garantir un contenu non vide
      let finalContent;
      if (response?.content && typeof response.content === 'object') {
        finalContent = {
          ...response.content,
          meta: { status: 'OK', sessionId: sessionIdRef.current }
        };
      } else if (response && typeof response === 'object') {
        finalContent = {
          ...response,
          meta: { status: 'OK', sessionId: sessionIdRef.current }
        };
      } else {
        logger.warn('⚠️ Réponse vide/invalide - fallback activé', { response }, 'TrainingExperiencePlayer');
        finalContent = {
          ...generateFallbackContent(),
          meta: { status: 'FALLBACK', sessionId: sessionIdRef.current }
        };
      }
      
      const endTime = new Date().toISOString();
      logger.info('✅ [END] Contenu généré avec succès', { 
        sessionId: sessionIdRef.current,
        contentStatus: finalContent.meta.status,
        startTime,
        endTime,
        duration: Date.parse(endTime) - Date.parse(startTime)
      }, 'TrainingExperiencePlayer');
      
      setContent(finalContent);
      setContentReady(true);
      setDisplayState('preparing');
      setPreparingTimeLeft(8);
      
    } catch (err) {
      logger.error('❌ [ERROR] Génération échouée', { 
        sessionId: sessionIdRef.current,
        error: err
      }, 'TrainingExperiencePlayer');
      
      // Fallback toujours non vide
      const fallbackContent = {
        ...generateFallbackContent(),
        meta: { status: 'ERROR', sessionId: sessionIdRef.current }
      };
      
      setContent(fallbackContent);
      setContentReady(true);
      setDisplayState('preparing');
      setPreparingTimeLeft(8);
    } finally {
      setTimeout(() => {
        transitionLockRef.current = false;
      }, 1000);
    }
  };

  // Fallback garanti non vide avec métadonnées
  const generateFallbackContent = () => {
    const baseContent = {
      sessionInfo: {
        id: sessionIdRef.current,
        trainingType,
        level,
        domain,
        createdAt: new Date().toISOString(),
        estimatedDuration: 15
      }
    };

    switch (trainingType) {
      case 'qcm':
        return {
          ...baseContent,
          questions: [
            {
              id: 'fallback-1',
              question: `Quelle est la principale mission du Chef de Service de Police Municipale en ${domain} ?`,
              options: [
                'Assurer la sécurité publique',
                'Gérer les finances publiques', 
                'Organiser les élections',
                'Superviser les travaux publics'
              ],
              correctAnswer: 0,
              explanation: 'Le Chef de Service de Police Municipale a pour mission principale d\'assurer la sécurité publique sur le territoire communal.',
              difficulty: level,
              animationType: 'standard'
            }
          ],
          metadata: {
            estimatedTime: 15,
            passingScore: 70,
            tips: ['Lisez attentivement chaque question', 'Réfléchissez avant de répondre']
          }
        };
      case 'vrai_faux':
        return {
          ...baseContent,
          questions: [
            {
              id: 'fallback-1',
              statement: 'Un agent de police municipale peut verbaliser sans l\'autorisation du maire.',
              isTrue: false,
              explanation: 'L\'agent de police municipale agit sous l\'autorité du maire et dans le cadre de ses compétences définies.',
              domain: domain,
              confidence: 'high',
              animationType: 'flip'
            }
          ],
          metadata: {
            estimatedTime: 10,
            difficulty: level
          }
        };
      case 'cas_pratique':
        return {
          ...baseContent,
          title: `Gestion de situation en ${domain}`,
          context: 'Vous êtes Chef de Service de Police Municipale et devez gérer une situation complexe.',
          steps: [
            {
              id: 'fallback-step-1',
              title: 'Analyse de la situation',
              scenario: 'Une situation conflictuelle nécessite votre intervention immédiate.',
              question: 'Quelles sont vos premières actions et quelle méthode appliquez-vous ?',
              expectedPoints: ['Évaluation rapide', 'Sécurisation', 'Communication'],
              timeLimit: 15,
              animationType: 'typewriter'
            }
          ],
          metadata: {
            totalTime: 45,
            difficulty: level,
            evaluationCriteria: ['Méthode', 'Rapidité', 'Pertinence']
          }
        };
      default:
        return {
          ...baseContent,
          error: 'Type d\'entraînement non supporté',
          fallbackMessage: 'Contenu de démonstration disponible'
        };
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
    console.log('🎯 DEBUG renderTrainingComponent:', { 
      hasContent: !!content, 
      content: content,
      sessionActive: session.isActive,
      displayState,
      trainingType,
      timestamp: new Date().toISOString()
    });
    
    if (!content) {
      console.log('❌ Pas de contenu disponible');
      return <div className="flex items-center justify-center h-full text-white text-xl">Aucun contenu généré</div>;
    }
    
    if (displayState !== 'active') {
      console.log('❌ DisplayState pas actif:', displayState);
      return null;
    }

    console.log('🎮 Rendu du composant:', trainingType);

    switch (trainingType) {
      case 'qcm':
        console.log('📝 Rendu QCM avec questions:', content.questions);
        if (!content.questions || !Array.isArray(content.questions)) {
          return <div className="flex items-center justify-center h-full text-white text-xl">Questions QCM non valides</div>;
        }
        return (
          <AnimatedQuizPlayer
            questions={content.questions}
            onComplete={handleSessionComplete}
            onExit={onExit}
            title="Quiz Interactif PrepaCDS"
          />
        );
        
      case 'vrai_faux':
        console.log('✅ Rendu Vrai/Faux avec questions:', content.questions);
        if (!content.questions || !Array.isArray(content.questions)) {
          return <div className="flex items-center justify-center h-full text-white text-xl">Questions Vrai/Faux non valides</div>;
        }
        return (
          <TrueFalseAnimated
            questions={content.questions}
            onComplete={handleSessionComplete}
            onExit={onExit}
            title="Vrai ou Faux PrepaCDS"
          />
        );
        
      case 'cas_pratique':
        console.log('🏛️ Rendu Cas Pratique avec données:', content);
        return (
          <CasePracticeSimulator
            caseData={content}
            onComplete={(answers, timeSpent) => handleSessionComplete(undefined, answers)}
            onExit={onExit}
          />
        );
        
      default:
        console.log('❓ Type d\'entraînement non supporté:', trainingType);
        return <div className="flex items-center justify-center h-full text-white text-xl">Type d'entraînement non supporté: {trainingType}</div>;
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
      setContentReady(true);
      setDisplayState('preparing');
    } else if (!content && displayState === 'loading') {
      logger.info('🔄 Lancement génération de contenu', { displayState }, 'TrainingExperiencePlayer');
      generateInteractiveContent();
    }
  }, [initialContent, injectPrepaCdsStyles]);

  // Machine à états avec double verrou : contentReady && timeElapsed
  useEffect(() => {
    const canActivate = contentReady && timeElapsed;
    
    logger.info('🎛️ [STATE] Machine à états', { 
      sessionId: sessionIdRef.current,
      displayState, 
      contentReady,
      timeElapsed,
      canActivate,
      preparingTimeLeft, 
      countdown,
      timestamp: new Date().toISOString()
    }, 'TrainingExperiencePlayer');
    
    // Phase preparing : timer de 8 secondes
    if (displayState === 'preparing' && preparingTimeLeft > 0) {
      logger.info('⏳ [PREPARING] Début phase (8s verrouillées)', { 
        sessionId: sessionIdRef.current,
        preparingTimeLeft,
        timestamp: new Date().toISOString()
      }, 'TrainingExperiencePlayer');
      
      preparingTimerRef.current = setInterval(() => {
        setPreparingTimeLeft(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            logger.info('✅ [PREPARING] Fin phase - temps écoulé', {
              sessionId: sessionIdRef.current,
              timestamp: new Date().toISOString()
            }, 'TrainingExperiencePlayer');
            setTimeElapsed(true);
            setDisplayState('countdown');
            setCountdown(3);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    // Phase countdown : timer de 3 secondes
    if (displayState === 'countdown' && countdown > 0) {
      logger.info('⏰ [COUNTDOWN] Début phase (3s)', { 
        sessionId: sessionIdRef.current,
        countdown,
        timestamp: new Date().toISOString()
      }, 'TrainingExperiencePlayer');
      
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            logger.info('🎯 [COUNTDOWN] Fin - vérification double verrou', {
              sessionId: sessionIdRef.current,
              contentReady,
              timeElapsed: true,
              canActivate: contentReady && true,
              timestamp: new Date().toISOString()
            }, 'TrainingExperiencePlayer');
            
            // Double verrou : on n'active que si contenu prêt ET temps écoulé
            if (contentReady) {
              setDisplayState('active');
              setSession(prev => ({ ...prev, content, isActive: true }));
              logger.info('🚀 [ACTIVE] Session activée', {
                sessionId: sessionIdRef.current,
                timestamp: new Date().toISOString()
              }, 'TrainingExperiencePlayer');
            } else {
              logger.warn('⚠️ [BLOCK] Activation bloquée - contenu non prêt', {
                sessionId: sessionIdRef.current,
                contentReady,
                timestamp: new Date().toISOString()
              }, 'TrainingExperiencePlayer');
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    // Cleanup timers
    return () => {
      if (preparingTimerRef.current) {
        clearInterval(preparingTimerRef.current);
        preparingTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [displayState, preparingTimeLeft, countdown, contentReady, timeElapsed]);

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
      {/* Overlay permanent - ne se démonte jamais */}
      <div 
        className="training-overlay"
        data-state={displayState}
        data-session-id={sessionIdRef.current}
      >
        {displayState !== 'active' && (
          <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 flex items-center justify-center">
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
                    
                    {displayState === 'preparing' && (
                      <motion.div
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-center mb-4"
                      >
                        <div className="flex items-center justify-center gap-2 text-3xl font-bold text-prepacds-primary">
                          <Clock className="h-8 w-8" />
                          {preparingTimeLeft}
                        </div>
                        <p className="text-lg text-prepacds-primary mt-2">
                          Interface VERROUILLÉE
                        </p>
                      </motion.div>
                    )}
                    
                    {displayState === 'countdown' && (
                      <motion.div
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-center mb-4"
                      >
                        <div className="flex items-center justify-center gap-2 text-4xl font-bold text-prepacds-primary animate-pulse">
                          <Play className="h-10 w-10" />
                          {countdown}
                        </div>
                        <p className="text-lg text-prepacds-primary mt-2">
                          Lancement imminent...
                        </p>
                      </motion.div>
                    )}
                    
                    <Progress 
                      value={displayState === 'preparing' ? ((8 - preparingTimeLeft) / 8) * 100 : 100} 
                      className="w-full"
                    />
                    
                    <div className="text-center text-sm text-muted-foreground">
                      {displayState === 'preparing' && `Temps restant: ${preparingTimeLeft}s`}
                      {displayState === 'countdown' && `Lancement dans: ${countdown}s`}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={onExit}>
                    Annuler
                  </Button>
                  {displayState === 'preparing' && preparingTimeLeft > 6 && (
                    <Button 
                      onClick={() => {
                        setPreparingTimeLeft(0);
                        setTimeElapsed(true);
                        setDisplayState('countdown');
                        setCountdown(3);
                      }}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Démarrer maintenant
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Zone de contenu training - rendu conditionnel mais overlay permanent */}
      {displayState === 'active' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderTrainingComponent()}
        </motion.div>
      )}
    </div>
  );
}