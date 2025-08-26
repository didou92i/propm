import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';
import { AnimatedQuizPlayer } from './AnimatedQuizPlayer';
import { TrueFalseAnimated } from './TrueFalseAnimated';
import { CasePracticeSimulator } from './CasePracticeSimulator';
import { usePrepaCdsChat } from '@/hooks/usePrepaCdsChat';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { generateContent } = usePrepaCdsChat();
  const { injectPrepaCdsStyles } = useAnimationEngine();

  // Génération du contenu interactif
  const generateInteractiveContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Génération contenu pour:', { trainingType, level, domain });
      
      const response = await generateContent(trainingType, level, domain);
      
      console.log('Réponse reçue:', response);
      
      // La réponse est déjà un objet structuré
      if (response && typeof response === 'object') {
        console.log('Contenu reçu et défini:', response);
        setContent(response);
      } else {
        console.warn('Réponse invalide, utilisation du fallback');
        const fallbackContent = generateFallbackContent();
        setContent(fallbackContent);
      }
      
    } catch (err) {
      console.error('Erreur génération contenu:', err);
      setError('Impossible de générer le contenu. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
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
    if (!content || !session.isActive) return null;

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

  // Auto-start et gestion du contenu
  useEffect(() => {
    // Injecter les styles d'animation PrepaCDS optimisés
    injectPrepaCdsStyles();
    
    // Use initial content if provided, otherwise generate
    if (initialContent) {
      console.log('Using provided initial content:', initialContent);
      setContent(initialContent);
    } else if (!content && !isLoading) {
      generateInteractiveContent();
    }
  }, [initialContent, injectPrepaCdsStyles]);

  // Auto-activer la session une fois le contenu prêt
  useEffect(() => {
    if (content && !session.isActive) {
      console.log('Activation automatique de la session avec contenu:', content);
      setSession(prev => ({ ...prev, content, isActive: true }));
    }
  }, [content]);

  if (isLoading) {
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
    <AnimatePresence mode="wait">
      {session.isActive && content ? (
        <motion.div
          key="training-active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderTrainingComponent()}
        </motion.div>
      ) : (
        <motion.div
          key="training-setup"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 flex items-center justify-center"
        >
          <Card className="p-8 border-prepacds-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-prepacds-primary">Session Prête</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">{level}</Badge>
                <Badge variant="outline">{domain}</Badge>
                <Badge variant="default">{trainingType}</Badge>
              </div>
              <Button onClick={() => {
                console.log('Démarrage manuel avec contenu:', content);
                setSession(prev => ({ ...prev, isActive: true }));
              }} className="w-full gap-2">
                <Play className="h-4 w-4" />
                Commencer l'entraînement
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}