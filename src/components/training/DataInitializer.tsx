import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { realDataService } from '@/services/training/realDataService';
import { useToast } from '@/hooks/use-toast';

interface DataInitializerProps {
  onComplete: () => void;
  isVisible: boolean;
}

export const DataInitializer: React.FC<DataInitializerProps> = ({ onComplete, isVisible }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const initializeData = async () => {
    setIsInitializing(true);
    setProgress(0);

    try {
      setCurrentStep('Vérification des données existantes...');
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('Génération des sessions d\'entraînement...');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('Création des données de progression...');
      setProgress(75);
      const results = await realDataService.ensureDataCompleteness();

      setCurrentStep('Finalisation...');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsComplete(true);
      
      toast({
        title: "Données initialisées avec succès",
        description: `${results.sessionsCreated} sessions créées, ${results.progressLogsCreated} logs de progression générés`,
      });

      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Erreur initialisation:', error);
      toast({
        title: "Erreur d'initialisation",
        description: "Impossible d'initialiser les données. Continuons avec les données existantes.",
        variant: "destructive"
      });
      onComplete();
    } finally {
      setIsInitializing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md glass neomorphism">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Initialisation des Données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            Première utilisation détectée. Nous préparons vos données d'entraînement pour une expérience optimale.
          </div>

          {!isInitializing && !isComplete && (
            <Button onClick={initializeData} className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Initialiser mes données
            </Button>
          )}

          {isInitializing && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {currentStep}
              </div>
            </div>
          )}

          {isComplete && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div className="text-sm text-muted-foreground">
                Données initialisées avec succès !<br />
                Redirection vers votre tableau de bord...
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Cette opération ne sera effectuée qu'une seule fois.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};