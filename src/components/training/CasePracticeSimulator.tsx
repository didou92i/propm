import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, User, Building, CheckSquare, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { TrainingResultsModal } from './TrainingResultsModal';

interface CasePracticeStep {
  id: string;
  title: string;
  scenario: string;
  question: string;
  expectedPoints: string[];
  timeLimit: number; // minutes
}

interface CasePracticeData {
  title: string;
  context: string;
  steps: CasePracticeStep[];
  totalTime: number;
}

interface TrainingEvaluation {
  score: number;
  isCorrect: boolean;
  feedback: string;
  strongPoints: string[];
  improvementAreas: string[];
  recommendations: string[];
  detailedAnalysis: string;
}

interface CasePracticeSimulatorProps {
  caseData: CasePracticeData;
  onComplete: (answers: string[], timeSpent: number) => void;
  onExit: () => void;
}

export function CasePracticeSimulator({ 
  caseData, 
  onComplete, 
  onExit 
}: CasePracticeSimulatorProps) {
  // Vérification de sécurité pour éviter les erreurs
  if (!caseData || !caseData.steps || caseData.steps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Aucun cas pratique disponible</h3>
            <p className="text-muted-foreground mb-4">Le contenu du cas pratique n'a pas pu être chargé.</p>
            <Button onClick={onExit}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [evaluation, setEvaluation] = useState<TrainingEvaluation | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentStep = caseData.steps[currentStepIndex];
  
  // Vérification supplémentaire pour l'étape actuelle
  if (!currentStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Erreur de navigation</h3>
            <p className="text-muted-foreground mb-4">Étape du cas pratique introuvable.</p>
            <Button onClick={onExit}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const progress = ((currentStepIndex + 1) / caseData.steps.length) * 100;

  // Generate visual for current step
  const generateVisual = async () => {
    if (!currentStep) return;
    
    setIsGeneratingVisual(true);
    try {
      const visualTypes = ['press_clipping', 'official_document', 'field_photo', 'infraction_scene'];
      const randomType = visualTypes[Math.floor(Math.random() * visualTypes.length)];
      
      const { data, error } = await supabase.functions.invoke('generate-training-visuals', {
        body: {
          context: caseData.context,
          scenario: currentStep.scenario,
          visualType: randomType,
          domain: 'police_municipale'
        }
      });

      if (error) throw error;
      setGeneratedVisual(data.image);
    } catch (error) {
      console.error('Error generating visual:', error);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  // Evaluate user answer
  const evaluateAnswer = async (answer: string): Promise<TrainingEvaluation> => {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-user-answer', {
        body: {
          userAnswer: answer,
          expectedAnswer: currentStep.expectedPoints.join('\n'),
          level: 'intermediaire',
          domain: 'police_municipale'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Fallback evaluation
      return {
        score: 12,
        isCorrect: true,
        feedback: "Votre réponse a été enregistrée. L'évaluation détaillée n'est pas disponible actuellement.",
        strongPoints: ["Réponse structurée"],
        improvementAreas: ["Développer certains aspects"],
        recommendations: ["Continuer à pratiquer"],
        detailedAnalysis: "Analyse non disponible"
      };
    }
  };

  const handleNext = async () => {
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    
    const stepTime = (Date.now() - stepStartTime) / 1000 / 60; // minutes
    const totalTimeSpent = timeSpent + stepTime;
    setTimeSpent(totalTimeSpent);

    if (currentStepIndex < caseData.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setCurrentAnswer('');
      setStepStartTime(Date.now());
      setGeneratedVisual(null);
    } else {
      // Evaluate final performance
      setIsEvaluating(true);
      try {
        const finalAnswer = newAnswers.join('\n\n--- ÉTAPE SUIVANTE ---\n\n');
        const evaluation = await evaluateAnswer(finalAnswer);
        setEvaluation(evaluation);
        setShowResults(true);
      } catch (error) {
        console.error('Error during evaluation:', error);
      } finally {
        setIsEvaluating(false);
      }
      
      setIsCompleted(true);
      onComplete(newAnswers, totalTimeSpent);
    }
  };

  // Generate visual when step changes
  useEffect(() => {
    if (currentStep && !generatedVisual) {
      generateVisual();
    }
  }, [currentStepIndex]);

  const canProceed = currentAnswer.trim().length > 50; // Minimum 50 characters

  return (
    <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <Card className="mb-6 border-prepacds-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-prepacds-primary flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {caseData.title}
            </CardTitle>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="outline">
                Étape {currentStepIndex + 1} / {caseData.steps.length}
              </Badge>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {currentStep.timeLimit} min recommandées
                </span>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Context (only on first step) */}
        {currentStepIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <Card className="border-l-4 border-l-prepacds-primary">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-prepacds-primary" />
                  <h3 className="font-semibold text-prepacds-primary">Contexte</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {caseData.context}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {currentStep.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scenario */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-prepacds-primary">Situation :</h4>
                  <p className="text-sm leading-relaxed">{currentStep.scenario}</p>
                </div>

                {/* Question */}
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 text-primary">Question :</h4>
                  <p className="text-sm font-medium">{currentStep.question}</p>
                </div>

                {/* Expected Points */}
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 text-prepacds-primary flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Points à aborder :
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.expectedPoints.map((point, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-prepacds-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-prepacds-primary"></div>
                        </div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Context */}
                {(generatedVisual || isGeneratingVisual) && (
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3 text-prepacds-primary flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Document Contextuel :
                    </h4>
                    {isGeneratingVisual ? (
                      <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-prepacds-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Génération du visuel...</span>
                      </div>
                    ) : generatedVisual ? (
                      <div className="relative">
                        <img 
                          src={generatedVisual} 
                          alt="Document contextuel généré par IA" 
                          className="w-full max-w-md mx-auto rounded-lg shadow-md border"
                        />
                        <Badge variant="outline" className="absolute top-2 right-2 bg-background/90">
                          Généré par IA
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Answer Area */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Votre réponse :</label>
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Rédigez votre réponse détaillée ici..."
                    className="min-h-[200px] resize-none"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{currentAnswer.length} caractères</span>
                    <span>Minimum 50 caractères requis</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Étape {currentStepIndex + 1}/{caseData.steps.length}
            </Badge>
            <Badge variant="secondary">
              {Math.round(timeSpent)} min écoulées
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExit}>
              Quitter
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!canProceed || isEvaluating}
              className="gap-2"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Évaluation...
                </>
              ) : (
                <>
                  {currentStepIndex === caseData.steps.length - 1 ? 'Terminer' : 'Suivant'}
                  <CheckSquare className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Modal */}
        {evaluation && (
          <TrainingResultsModal
            isOpen={showResults}
            onClose={() => setShowResults(false)}
            evaluation={evaluation}
            totalTime={timeSpent}
            caseTitle={caseData.title}
            onRestart={() => {
              setCurrentStepIndex(0);
              setAnswers([]);
              setCurrentAnswer('');
              setTimeSpent(0);
              setStepStartTime(Date.now());
              setIsCompleted(false);
              setGeneratedVisual(null);
              setEvaluation(null);
              setShowResults(false);
            }}
            onNewTraining={() => {
              setShowResults(false);
              onExit();
            }}
          />
        )}
      </motion.div>
    </div>
  );
}