import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
}

interface AnimatedQuizPlayerProps {
  questions: QuizQuestion[];
  onComplete: (score: number, answers: number[]) => void;
  onExit: () => void;
  title?: string;
}

export function AnimatedQuizPlayer({ 
  questions, 
  onComplete, 
  onExit, 
  title = "Quiz Interactif" 
}: AnimatedQuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  
  // Animation engine pour les effets visuels
  const { flipCard, bounceScale, glowEffect, applyAnimation, injectPrepaCdsStyles } = useAnimationEngine();
  
  // Refs pour manipulation directe du DOM
  const answerButtonsRef = React.useRef<HTMLElement[]>([]);
  
  // Injecter les styles d'animation au montage
  useEffect(() => {
    injectPrepaCdsStyles();
  }, [injectPrepaCdsStyles]);

  // Vérification de sécurité pour éviter les erreurs
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Aucune question disponible</h3>
            <p className="text-muted-foreground mb-4">Le contenu du quiz n'a pas pu être chargé.</p>
            <Button onClick={onExit}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // Vérification supplémentaire pour la question actuelle
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Erreur de navigation</h3>
            <p className="text-muted-foreground mb-4">Question introuvable.</p>
            <Button onClick={onExit}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer logic
  useEffect(() => {
    if (!isActive || timeLeft === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleTimeout = () => {
    if (selectedAnswer === null) {
      handleAnswer(-1); // -1 pour timeout
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (animationInProgress) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setIsActive(false);
    setAnimationInProgress(true);
    
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    // Animation immédiate avec préservation des classes
    setTimeout(() => {
      const selectedButton = answerButtonsRef.current[answerIndex];
      const correctButton = answerButtonsRef.current[currentQuestion.correctAnswer];
      
      if (selectedButton) {
        // Appliquer les animations avec persistance
        if (isCorrect) {
          setScore(prev => prev + 1);
          selectedButton.classList.add('correct-reveal');
          selectedButton.style.cssText += `
            background-color: hsl(142, 76%, 36%) !important;
            border-color: hsl(142, 76%, 36%) !important;
            color: white !important;
            transform: scale(1.05);
            box-shadow: 0 0 20px hsl(142, 76%, 36%, 0.5);
          `;
          bounceScale(selectedButton);
        } else {
          selectedButton.classList.add('incorrect-shake');
          selectedButton.style.cssText += `
            background-color: hsl(0, 84%, 60%) !important;
            border-color: hsl(0, 84%, 60%) !important;
            color: white !important;
            animation: incorrectShake 0.6s ease-in-out;
          `;
          
          // Révéler la bonne réponse
          if (correctButton) {
            correctButton.style.cssText += `
              background-color: hsl(142, 76%, 36%) !important;
              border-color: hsl(142, 76%, 36%) !important;
              color: white !important;
              box-shadow: 0 0 15px hsl(142, 76%, 36%, 0.4);
            `;
          }
        }
      }
    }, 200);

    // Transition vers la question suivante avec délai prolongé
    setTimeout(() => {
      setAnimationInProgress(false);
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        onComplete(score + (isCorrect ? 1 : 0), newAnswers);
      }
    }, 3500);
  };

  const nextQuestion = () => {
    // Nettoyer les styles des boutons précédents
    answerButtonsRef.current.forEach(button => {
      if (button) {
        button.classList.remove('correct-reveal', 'incorrect-shake');
        button.style.cssText = '';
      }
    });
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(30);
    setIsActive(true);
    setAnimationInProgress(false);
    answerButtonsRef.current = [];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'hsl(142, 76%, 36%)';
      case 'moyen': return 'hsl(39, 96%, 56%)';
      case 'difficile': return 'hsl(0, 84%, 60%)';
      default: return 'hsl(221, 83%, 53%)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <Card className="mb-6 border-prepacds-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-prepacds-primary flex items-center justify-center gap-2">
              <Target className="h-6 w-6" />
              {title}
            </CardTitle>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="outline" className="text-xs">
                Question {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={`font-mono ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                  {timeLeft}s
                </span>
              </div>
              <Badge 
                style={{ backgroundColor: getDifficultyColor(currentQuestion?.difficulty || 'moyen') }}
                className="text-white"
              >
                {currentQuestion?.difficulty || 'moyen'}
              </Badge>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6 text-foreground leading-relaxed">
                  {currentQuestion.question}
                </h2>
                
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const isWrong = showResult && isSelected && !isCorrect;
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: showResult ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          ref={(el: HTMLButtonElement | null) => {
                            if (el) answerButtonsRef.current[index] = el;
                          }}
                          variant={isSelected ? "default" : "outline"}
                          className="answer-button interactive-hover w-full p-4 h-auto text-left justify-start"
                          onClick={() => !showResult && !animationInProgress && handleAnswer(index)}
                          disabled={showResult || animationInProgress}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-shrink-0">
                              {showResult && isCorrect && <CheckCircle className="h-5 w-5" />}
                              {isWrong && <XCircle className="h-5 w-5" />}
                              {!showResult && (
                                <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                                  {String.fromCharCode(65 + index)}
                                </div>
                              )}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 p-4 bg-muted/50 rounded-lg"
                    >
                      <h4 className="font-semibold text-sm mb-2 text-prepacds-primary">Explication :</h4>
                      <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-prepacds-primary" />
            <span className="font-semibold">Score: {score}/{questions.length}</span>
          </div>
          <Button variant="outline" onClick={onExit}>
            Quitter
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}