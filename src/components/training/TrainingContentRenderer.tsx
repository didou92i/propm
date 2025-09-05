import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { AnimatedQuizPlayer } from './AnimatedQuizPlayer';
import { TrueFalseAnimated } from './TrueFalseAnimated';
import { CasePracticeSimulator } from './CasePracticeSimulator';
import { OpenEndedQuestionPlayer } from './OpenEndedQuestionPlayer';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface TrainingContentRendererProps {
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  content: any;
  onComplete: (score: number, answers: any[]) => void;
  onExit: () => void;
}

export function TrainingContentRenderer({
  trainingType,
  level,
  domain,
  content,
  onComplete,
  onExit
}: TrainingContentRendererProps) {
  const supportedTypes = ['qcm', 'vrai_faux', 'cas_pratique', 'question_ouverte'];

  // Rendu pour les types supportés
  if (supportedTypes.includes(trainingType)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        {trainingType === 'qcm' && (
          <AnimatedQuizPlayer
            questions={content?.questions || []}
            onComplete={onComplete}
            onExit={onExit}
            title={`QCM ${domain} - ${level}`}
          />
        )}
        
        {trainingType === 'vrai_faux' && (
          <TrueFalseAnimated
            questions={content?.questions || []}
            onComplete={onComplete}
            onExit={onExit}
            title={`Vrai/Faux ${domain} - ${level}`}
          />
        )}
        
        {trainingType === 'cas_pratique' && (
          <CasePracticeSimulator
            caseData={content}
            onComplete={(answers: string[], timeSpent: number) => {
              // Adapter l'interface : calculer un score basé sur les réponses
              const score = Math.min(100, Math.max(0, (answers.length * 20))); // Score simple basé sur le nombre de réponses
              onComplete(score, answers);
            }}
            onExit={onExit}
          />
        )}

        {trainingType === 'question_ouverte' && (
          <OpenEndedQuestionPlayer
            questions={content?.questions || []}
            onComplete={onComplete}
            onExit={onExit}
            title={`Questions Ouvertes ${domain} - ${level}`}
          />
        )}
      </motion.div>
    );
  }

  // Message pour les types non supportés
  return (
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
          <p className="text-sm text-muted-foreground">
            Types actuellement supportés : QCM, Vrai/Faux, Cas Pratiques
          </p>
          <Button onClick={onExit} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la sélection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}