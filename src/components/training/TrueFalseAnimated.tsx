import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';
import { logger } from '@/utils/logger';

interface TrueFalseQuestion {
  id: string;
  statement: string;
  isCorrect: boolean; // Standardisation sur isCorrect uniquement
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
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Injection des styles d'animation au montage
  useEffect(() => {
    logger.info("Initialisation TrueFalseAnimated", { questionCount: questions.length }, "TrueFalseAnimated");
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

  const handleAnswer = (answer: boolean) => {
    if (animationInProgress) {
      logger.warn("Animation en cours, clic ignoré", { answer }, "TrueFalseAnimated");
      return;
    }
    
    // Log de debug pour analyser l'état avant traitement
    logger.info("🎯 Début handleAnswer", { 
      answer, 
      isCorrect: answer === currentQuestion.isCorrect,
      currentQuestionIndex,
      questionId: currentQuestion.id,
      questionStatement: currentQuestion.statement,
      questionCorrectAnswer: currentQuestion.isCorrect
    }, "TrueFalseAnimated");
    
    // Log des classes CSS présentes avant modification
    const trueBtnClasses = trueBtnRef.current?.className || "N/A";
    const falseBtnClasses = falseBtnRef.current?.className || "N/A";
    const cardClasses = cardRef.current?.className || "N/A";
    
    logger.info("📝 État CSS avant animation", {
      trueBtnClasses,
      falseBtnClasses,
      cardClasses,
      perspective: window.getComputedStyle(document.querySelector('.perspective-1000') || document.body).perspective || "N/A",
      preserv3d: window.getComputedStyle(document.querySelector('.preserve-3d') || document.body).transformStyle || "N/A"
    }, "TrueFalseAnimated");
    
    setSelectedAnswer(answer);
    setAnimationInProgress(true);
    
    // Animation immédiate sur le bouton sélectionné
    const selectedBtn = answer ? trueBtnRef.current : falseBtnRef.current;
    const otherBtn = answer ? falseBtnRef.current : trueBtnRef.current;
    const questionCorrectAnswer = currentQuestion.isCorrect;
    const isCorrect = answer === questionCorrectAnswer;
    
    if (selectedBtn) {
      logger.info("Application des styles d'animation", { 
        buttonType: answer ? "VRAI" : "FAUX", 
        isCorrect 
      }, "TrueFalseAnimated");
      
      // PHASE 1: Animation de sélection immédiate (persistante)
      selectedBtn.classList.add('answer-select');
      selectedBtn.setAttribute('data-animation-lock', 'true');
      
      // PHASE 2: Animation de feedback après 300ms (visible 3 secondes)
      setTimeout(() => {
        logger.info("Début animation feedback", { isCorrect }, "TrueFalseAnimated");
        
        if (isCorrect) {
          // Animation réponse correcte
          selectedBtn.classList.add('correct-reveal');
          selectedBtn.setAttribute('data-correct', 'true');
          selectedBtn.style.cssText = `
            background-color: hsl(142, 76%, 36%) !important;
            border-color: hsl(142, 76%, 36%) !important;
            color: white !important;
            transform: scale(1.1) !important;
            box-shadow: 0 0 25px hsl(142, 76%, 36%, 0.6) !important;
            animation: correctReveal 3s ease-out forwards !important;
            transition: none !important;
            animation-fill-mode: forwards !important;
          `;
          
          logger.info("Animation correcte appliquée", { 
            styles: selectedBtn.style.cssText,
            classes: selectedBtn.className 
          }, "TrueFalseAnimated");
          
        } else {
          // Animation réponse incorrecte
          selectedBtn.classList.add('incorrect-shake');
          selectedBtn.setAttribute('data-incorrect', 'true');
          selectedBtn.style.cssText = `
            background-color: hsl(0, 84%, 60%) !important;
            border-color: hsl(0, 84%, 60%) !important;
            color: white !important;
            animation: incorrectShake 2s ease-in-out forwards !important;
            transition: none !important;
            animation-fill-mode: forwards !important;
          `;
          
          // Révéler la bonne réponse
          const correctBtn = questionCorrectAnswer ? trueBtnRef.current : falseBtnRef.current;
          if (correctBtn && correctBtn !== selectedBtn) {
            correctBtn.setAttribute('data-correct-reveal', 'true');
            correctBtn.style.cssText = `
              background-color: hsl(142, 76%, 36%) !important;
              border-color: hsl(142, 76%, 36%) !important;
              color: white !important;
              box-shadow: 0 0 15px hsl(142, 76%, 36%, 0.4) !important;
              animation: correctReveal 3s ease-out forwards !important;
              transition: none !important;
              animation-fill-mode: forwards !important;
            `;
          }
          
          logger.info("Animation incorrecte appliquée", { 
            incorrectStyles: selectedBtn.style.cssText,
            correctRevealStyles: correctBtn?.style.cssText 
          }, "TrueFalseAnimated");
        }
        
        // Log des styles toutes les 500ms pendant 3 secondes
        const styleChecker = setInterval(() => {
          logger.debug("Vérification persistance styles", {
            selectedBtnStyles: selectedBtn.style.cssText,
            selectedBtnClasses: selectedBtn.className,
            otherBtnStyles: otherBtn?.style.cssText,
            timestamp: Date.now()
          }, "TrueFalseAnimated");
        }, 500);
        
        setTimeout(() => {
          clearInterval(styleChecker);
          logger.info("Fin vérification styles", {}, "TrueFalseAnimated");
        }, 3000);
        
      }, 300);
    }
    
    // PHASE 3: Flip de la carte après 3 secondes (laisser voir l'animation)
    setTimeout(() => {
      logger.info("🔄 Début flip carte", { 
        currentFlipState: isFlipped,
        willFlipTo: true,
        cardElement: cardRef.current ? "présent" : "absent"
      }, "TrueFalseAnimated");
      
      // Vérifier l'état des classes CSS avant le flip
      const cardElement = cardRef.current;
      if (cardElement) {
        const computedStyle = window.getComputedStyle(cardElement);
        logger.info("🎨 État CSS carte avant flip", {
          transform: computedStyle.transform,
          transformStyle: computedStyle.transformStyle,
          backfaceVisibility: computedStyle.backfaceVisibility,
          perspective: computedStyle.perspective
        }, "TrueFalseAnimated");
      }
      
      setIsFlipped(true);
      
      setTimeout(() => {
        setShowResult(true);
        const newAnswers = [...userAnswers, answer];
        setUserAnswers(newAnswers);
        
        if (answer === questionCorrectAnswer) {
          setScore(prev => prev + 1);
        }

        // PHASE 4: Transition vers la question suivante après 2 secondes supplémentaires
        setTimeout(() => {
          logger.info("Transition vers question suivante", { 
            isLast: currentQuestionIndex >= questions.length - 1 
          }, "TrueFalseAnimated");
          
          if (currentQuestionIndex < questions.length - 1) {
            nextQuestion();
          } else {
            const finalScore = score + (answer === questionCorrectAnswer ? 1 : 0);
            logger.info("Quiz terminé", { finalScore, totalQuestions: questions.length }, "TrueFalseAnimated");
            onComplete(finalScore, newAnswers);
          }
        }, 2000);
      }, 600);
    }, 3000); // Délai pour voir l'animation complète
  };

  const nextQuestion = () => {
    logger.info("Nettoyage avant question suivante", { 
      currentIndex: currentQuestionIndex 
    }, "TrueFalseAnimated");
    
    // Nettoyer les styles et attributs des boutons
    [trueBtnRef.current, falseBtnRef.current].forEach((btn, index) => {
      if (btn) {
        const buttonType = index === 0 ? "VRAI" : "FAUX";
        logger.debug("Nettoyage bouton", { 
          buttonType,
          previousClasses: btn.className,
          previousStyles: btn.style.cssText 
        }, "TrueFalseAnimated");
        
        // Nettoyage complet
        btn.classList.remove('answer-select', 'correct-reveal', 'incorrect-shake');
        btn.removeAttribute('data-animation-lock');
        btn.removeAttribute('data-correct');
        btn.removeAttribute('data-incorrect');
        btn.removeAttribute('data-correct-reveal');
        btn.style.cssText = '';
        btn.style.animation = '';
        btn.style.transition = '';
      }
    });
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsFlipped(false);
    setAnimationInProgress(false);
    
    logger.info("Question suivante préparée", { 
      newIndex: currentQuestionIndex + 1 
    }, "TrueFalseAnimated");
  };

  const questionCorrectAnswer = currentQuestion?.isCorrect ?? false;
  const isCorrect = selectedAnswer === questionCorrectAnswer;

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
            ref={cardRef}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative preserve-3d"
            onAnimationStart={() => {
              logger.info("🔄 Animation flip START", { 
                isFlipped, 
                rotateY: isFlipped ? 180 : 0,
                cardTransform: cardRef.current?.style.transform || "N/A"
              }, "TrueFalseAnimated");
            }}
            onAnimationComplete={() => {
              logger.info("✅ Animation flip COMPLETE", { 
                isFlipped,
                finalTransform: cardRef.current?.style.transform || "N/A"
              }, "TrueFalseAnimated");
            }}
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
                        La bonne réponse est : <strong>{questionCorrectAnswer ? 'VRAI' : 'FAUX'}</strong>
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