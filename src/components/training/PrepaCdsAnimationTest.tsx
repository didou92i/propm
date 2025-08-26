import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';

interface PrepaCdsAnimationTestProps {
  onClose: () => void;
}

export function PrepaCdsAnimationTest({ onClose }: PrepaCdsAnimationTestProps) {
  const { injectPrepaCdsStyles, bounceScale, glowEffect } = useAnimationEngine();

  useEffect(() => {
    injectPrepaCdsStyles();
  }, [injectPrepaCdsStyles]);

  const testAnimations = () => {
    // Test des classes CSS
    const testElements = document.querySelectorAll('.animation-test');
    testElements.forEach((element, index) => {
      setTimeout(() => {
        const htmlElement = element as HTMLElement;
        switch (index) {
          case 0:
            htmlElement.classList.add('quiz-entrance');
            break;
          case 1:
            htmlElement.classList.add('correct-reveal');
            break;
          case 2:
            htmlElement.classList.add('incorrect-shake');
            break;
          case 3:
            htmlElement.classList.add('step-progression');
            break;
        }
        
        // Nettoyer les classes après l'animation
        setTimeout(() => {
          htmlElement.classList.remove('quiz-entrance', 'correct-reveal', 'incorrect-shake', 'step-progression');
        }, 1000);
      }, index * 500);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-prepacds-primary/5 to-prepacds-secondary/10 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-prepacds-primary/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-prepacds-primary mb-4">
              Test des Animations PrepaCDS
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="animation-test interactive-hover p-4 bg-card border">
                <div className="text-center">
                  <div className="w-8 h-8 bg-prepacds-primary rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Question Entrance</p>
                </div>
              </Card>
              
              <Card className="animation-test interactive-hover p-4 bg-card border">
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Correct Reveal</p>
                </div>
              </Card>
              
              <Card className="animation-test interactive-hover p-4 bg-card border">
                <div className="text-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Incorrect Shake</p>
                </div>
              </Card>
              
              <Card className="animation-test interactive-hover p-4 bg-card border">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Step Progression</p>
                </div>
              </Card>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={testAnimations}
                className="gap-2"
              >
                Tester les Animations
              </Button>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}