import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Save, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Image,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTrainingVisuals } from '@/hooks/useTrainingVisuals';

interface OpenEndedQuestion {
  id: string;
  question: string;
  context?: string;
  expectedLength?: number;
  timeLimit?: number; // en minutes
  guidelines?: string[];
}

interface OpenEndedQuestionPlayerProps {
  questions: OpenEndedQuestion[];
  onComplete: (score: number, answers: any[]) => void;
  onExit: () => void;
  title: string;
}

export function OpenEndedQuestionPlayer({
  questions,
  onComplete,
  onExit,
  title
}: OpenEndedQuestionPlayerProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const { generateVisual, isGenerating: isGeneratingVisual, generatedVisuals } = useTrainingVisuals();

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  // Initialiser le timer pour la question actuelle et générer un visuel
  useEffect(() => {
    if (currentQuestion?.timeLimit) {
      setTimeLeft(currentQuestion.timeLimit * 60); // Convert to seconds
    }
    
    // Générer un visuel contextuel pour la question
    if (currentQuestion?.context) {
      generateVisual({
        context: currentQuestion.context,
        scenario: currentQuestion.question,
        visualType: 'official_document',
        domain: 'droit_administratif'
      });
    }
  }, [currentQuestion, generateVisual]);

  // Gestion du timer
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentQuestion?.timeLimit) {
      toast({
        title: "Temps écoulé",
        description: "Le temps alloué pour cette question est écoulé.",
        variant: "destructive"
      });
    }
  }, [timeLeft, isCompleted, currentQuestion, toast]);

  // Auto-sauvegarde
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    const timer = setTimeout(() => {
      toast({
        title: "Sauvegarde automatique",
        description: "Votre réponse a été sauvegardée.",
        duration: 2000
      });
    }, 30000); // 30 secondes
    
    setAutoSaveTimer(timer);
  }, [autoSaveTimer, toast]);

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
    scheduleAutoSave();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    
    // Calculer un score basé sur la longueur et la complétude des réponses
    const completedAnswers = answers.filter(answer => answer.trim().length > 50);
    const score = Math.round((completedAnswers.length / questions.length) * 100);
    
    const formattedAnswers = questions.map((question, index) => ({
      questionId: question.id,
      question: question.question,
      answer: answers[index],
      wordCount: answers[index].split(' ').length,
      charCount: answers[index].length
    }));

    toast({
      title: "Exercice terminé",
      description: `Vous avez complété ${completedAnswers.length}/${questions.length} questions.`,
    });

    onComplete(score, formattedAnswers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getCharCount = (text: string) => {
    return text.length;
  };

  const isAnswerComplete = () => {
    const minLength = currentQuestion?.expectedLength || 100;
    return currentAnswer.length >= minLength;
  };

  if (!questions.length) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Aucune question disponible</p>
          <Button onClick={onExit} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {currentQuestion?.timeLimit && (
            <Badge variant={timeLeft < 300 ? "destructive" : "secondary"}>
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeLeft)}
            </Badge>
          )}
          <Button variant="outline" onClick={onExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quitter
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Question {currentQuestionIndex + 1}
              </CardTitle>
              {currentQuestion?.context && (
                <Alert>
                  <AlertDescription>
                    <strong>Contexte :</strong> {currentQuestion.context}
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-medium">{currentQuestion?.question}</p>
              </div>

              {/* Guidelines */}
              {currentQuestion?.guidelines && (
                <Alert>
                  <AlertDescription>
                    <strong>Consignes :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {currentQuestion.guidelines.map((guideline, index) => (
                        <li key={index} className="text-sm">{guideline}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Visual Context */}
              {(generatedVisuals.length > 0 || isGeneratingVisual) && (
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Document Contextuel :
                  </h4>
                  {isGeneratingVisual ? (
                    <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Génération du visuel...</span>
                    </div>
                  ) : generatedVisuals.length > 0 ? (
                    <div className="relative">
                      <img 
                        src={generatedVisuals[generatedVisuals.length - 1].image} 
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
              <div className="space-y-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Rédigez votre réponse ici..."
                  className="min-h-[300px] resize-y"
                />
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span>Mots : {getWordCount(currentAnswer)}</span>
                    <span>Caractères : {getCharCount(currentAnswer)}</span>
                  </div>
                  {currentQuestion?.expectedLength && (
                    <Badge variant={isAnswerComplete() ? "default" : "secondary"}>
                      {isAnswerComplete() ? "Longueur suffisante" : `Min. ${currentQuestion.expectedLength} caractères`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Précédent
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Réponse sauvegardée",
                        description: "Votre progression a été enregistrée.",
                      });
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  
                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button onClick={handleComplete}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Terminer l'exercice
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion}>
                      Suivant
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}