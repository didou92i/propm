import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';

interface TrueFalseQuestion {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  domain: string;
}

interface TrueFalseAnimatedProps {
  questions: TrueFalseQuestion[];
  onComplete: (score: number, answers: boolean[]) => void;
  onExit: () => void;
  title?: string;
}

export function TrueFalseAnimated({ 
  questions, 
  onComplete, 
  onExit, 
  title = "Vrai ou Faux" 
}: TrueFalseAnimatedProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animationInProgress, setAnimationInProgress] = useState(false);

  // Animation engine pour les effets visuels
  const { flipCard, bounceScale, glowEffect, injectPrepaCdsStyles } = useAnimationEngine();
  
  // Refs pour manipulation directe des boutons
  const trueBtnRef = React.useRef<HTMLButtonElement>(null);
  const falseBtnRef = React.useRef<HTMLButtonElement>(null);

  // Injection des styles d'animation au montage
  useEffect(() => {
    injectPrepaCdsStyles();
  }, [injectPrepaCdsStyles]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: boolean) => {
    if (animationInProgress) return;
    
    setSelectedAnswer(answer);
    setAnimationInProgress(true);
    
    // Animation immédiate sur le bouton sélectionné
    const selectedBtn = answer ? trueBtnRef.current : falseBtnRef.current;
    const isCorrect = answer === currentQuestion.isTrue;
    
    if (selectedBtn) {
      // Appliquer l'animation de sélection
      selectedBtn.classList.add('answer-select');
      
      // Animation de feedback persistante
      setTimeout(() => {
        if (isCorrect) {
          selectedBtn.classList.add('correct-reveal');
          selectedBtn.style.cssText += `
            background-color: hsl(142, 76%, 36%) !important;
            border-color: hsl(142, 76%, 36%) !important;
            color: white !important;
            transform: scale(1.1) !important;
            box-shadow: 0 0 25px hsl(142, 76%, 36%, 0.6) !important;
            animation: correctReveal 1.5s ease-out forwards !important;
          `;
          bounceScale(selectedBtn);
        } else {
          selectedBtn.classList.add('incorrect-shake');
          selectedBtn.style.cssText += `
            background-color: hsl(0, 84%, 60%) !important;
            border-color: hsl(0, 84%, 60%) !important;
            color: white !important;
            animation: incorrectShake 1s ease-in-out forwards !important;
          `;
          
          // Montrer aussi la bonne réponse
          const correctBtn = currentQuestion.isTrue ? trueBtnRef.current : falseBtnRef.current;
          if (correctBtn && correctBtn !== selectedBtn) {
            correctBtn.style.cssText += `
              background-color: hsl(142, 76%, 36%) !important;
              border-color: hsl(142, 76%, 36%) !important;
              color: white !important;
              box-shadow: 0 0 15px hsl(142, 76%, 36%, 0.4) !important;
            `;
          }
        }
      }, 200);
    }
    
    // Flip de la carte après un délai
    setTimeout(() => {
      setIsFlipped(true);
      setTimeout(() => {
        setShowResult(true);
        const newAnswers = [...userAnswers, answer];
        setUserAnswers(newAnswers);
        
        if (answer === currentQuestion.isTrue) {
          setScore(prev => prev + 1);
        }

        // Transition vers la question suivante avec délai prolongé
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            nextQuestion();
          } else {
            onComplete(score + (answer === currentQuestion.isTrue ? 1 : 0), newAnswers);
          }
        }, 4000);
      }, 600);
    }, 2500); // Délai prolongé pour voir l'animation du bouton
  };

  const nextQuestion = () => {
    // Nettoyer les styles des boutons
    [trueBtnRef.current, falseBtnRef.current].forEach(btn => {
      if (btn) {
        btn.classList.remove('answer-select', 'correct-reveal', 'incorrect-shake');
        btn.style.cssText = '';
      }
    });
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsFlipped(false);
    setAnimationInProgress(false);
  };

  const isCorrect = selectedAnswer === currentQuestion.isTrue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <Card className="mb-6 border-prepacds-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-prepacds-primary flex items-center justify-center gap-2">
              <RotateCcw className="h-6 w-6" />
              {title}
            </CardTitle>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <Badge variant="secondary">
                {currentQuestion.domain}
              </Badge>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Flip Card */}
        <div className="perspective-1000 mb-6">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative preserve-3d"
          >
            {/* Front of card - Question */}
            <Card className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : ''}`}>
              <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
                <div className="text-center">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                      {currentQuestion.statement}
                    </h2>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <motion.div whileHover={{ scale: animationInProgress ? 1 : 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        ref={trueBtnRef}
                        size="lg"
                        className="interactive-hover bg-green-500 hover:bg-green-600 text-white px-8 py-4 focus-ring"
                        onClick={() => handleAnswer(true)}
                        disabled={showResult || animationInProgress}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        VRAI
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: animationInProgress ? 1 : 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        ref={falseBtnRef}
                        size="lg"
                        className="interactive-hover bg-red-500 hover:bg-red-600 text-white px-8 py-4 focus-ring"
                        onClick={() => handleAnswer(false)}
                        disabled={showResult || animationInProgress}
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        FAUX
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back of card - Result */}
            <Card 
              className={`absolute inset-0 backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}
            >
              <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      {/* Result Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-4"
                      >
                        {isCorrect ? (
                          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                        )}
                      </motion.div>

                      <h3 className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? 'Correct !' : 'Incorrect !'}
                      </h3>

                      <p className="text-lg mb-4">
                        La bonne réponse est : <strong>{currentQuestion.isTrue ? 'VRAI' : 'FAUX'}</strong>
                      </p>

                      {/* Explanation */}
                      <div className="bg-muted/50 p-4 rounded-lg text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-prepacds-primary" />
                          <span className="font-semibold text-sm text-prepacds-primary">Explication :</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Score: {score}/{questions.length}
            </Badge>
            {showResult && (
              <Badge variant={isCorrect ? "default" : "destructive"}>
                {isCorrect ? '+1 point' : '0 point'}
              </Badge>
            )}
          </div>
          <Button variant="outline" onClick={onExit}>
            Quitter
          </Button>
        </div>
      </motion.div>
    </div>
  );
}