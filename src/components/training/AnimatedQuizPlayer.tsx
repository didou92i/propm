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
  
  // Animation engine pour les effets visuels
  const { flipCard, bounceScale, glowEffect, applyAnimation } = useAnimationEngine();

  const currentQuestion = questions[currentQuestionIndex];
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
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setIsActive(false);
    
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      // Animation de succès
      const buttons = document.querySelectorAll('.answer-button');
      if (buttons[answerIndex]) {
        bounceScale(buttons[answerIndex] as HTMLElement);
        glowEffect(buttons[answerIndex] as HTMLElement, 'hsl(var(--prepacds-primary))');
      }
    } else {
      // Animation d'erreur
      const buttons = document.querySelectorAll('.answer-button');
      if (buttons[answerIndex]) {
        applyAnimation(buttons[answerIndex] as HTMLElement, 'shake', {
          duration: 500,
          easing: 'ease-in-out'
        });
      }
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        onComplete(score + (isCorrect ? 1 : 0), newAnswers);
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(30);
    setIsActive(true);
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
                style={{ backgroundColor: getDifficultyColor(currentQuestion.difficulty) }}
                className="text-white"
              >
                {currentQuestion.difficulty}
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
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            answer-button w-full p-4 h-auto text-left justify-start transition-all duration-300
                            ${showResult && isCorrect ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}
                            ${isWrong ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : ''}
                          `}
                          onClick={() => !showResult && handleAnswer(index)}
                          disabled={showResult}
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