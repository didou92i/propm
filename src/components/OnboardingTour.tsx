import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans votre assistant IA !',
    description: 'Je vais vous guider à travers les fonctionnalités principales en quelques étapes simples.',
    position: 'center'
  },
  {
    id: 'chat',
    title: 'Zone de conversation',
    description: 'Ici, vous pouvez discuter avec votre assistant, poser des questions et recevoir de l\'aide.',
    target: '[data-tour="chat-area"]',
    position: 'left'
  },
  {
    id: 'agents',
    title: 'Assistants spécialisés',
    description: 'Chaque assistant a sa spécialité : développement, marketing, analyse... Choisissez celui qui correspond à vos besoins.',
    target: '[data-tour="agents"]',
    position: 'right'
  },
  {
    id: 'documents',
    title: 'Vos documents',
    description: 'Uploadez des fichiers pour que l\'assistant puisse les analyser et répondre à vos questions dessus.',
    target: '[data-tour="upload"]',
    position: 'bottom'
  },
  {
    id: 'tools',
    title: 'Outils avancés',
    description: 'Retrouvez vos documents, exportez vos conversations et accédez aux modèles prêts à l\'emploi.',
    target: '[data-tour="tools"]',
    position: 'left'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu le tour
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (hasSeenTour) {
      setIsVisible(false);
      return;
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboardingTour', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      {/* Overlay avec highlight sur l'élément ciblé */}
      {step.target && (
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, transparent 100px, rgba(0,0,0,0.8) 200px)`
          }}
        />
      )}
      
      {/* Card du tour */}
      <div className={`absolute ${getPositionClasses(step.position)} animate-in fade-in-50 slide-in-from-bottom-4`}>
        <Card className="w-80 glass neomorphism border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Étape {currentStep + 1} / {ONBOARDING_STEPS.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-6 w-6 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              {step.description}
            </CardDescription>
            
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Précédent
              </Button>
              
              <div className="flex gap-1">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                onClick={handleNext}
                size="sm"
                className="flex items-center gap-1"
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function getPositionClasses(position: OnboardingStep['position']): string {
  switch (position) {
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    case 'top':
      return 'top-4 left-1/2 -translate-x-1/2';
    case 'bottom':
      return 'bottom-4 left-1/2 -translate-x-1/2';
    case 'left':
      return 'top-1/2 left-4 -translate-y-1/2';
    case 'right':
      return 'top-1/2 right-4 -translate-y-1/2';
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}