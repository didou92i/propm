import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Info, Zap, Brain } from 'lucide-react';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export class TrainingToastManager {
  static sessionStarted(trainingType: TrainingType, level: UserLevel, domain: StudyDomain) {
    toast.success('Session démarrée avec succès !', {
      description: `${trainingType} • ${level} • ${domain}`,
      duration: 4000,
      icon: <Brain className="w-5 h-5 text-green-500" />,
    });
  }

  static sessionCompleted(score: number, duration: number) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    toast.success('Session terminée !', {
      description: `Score: ${score}% • Durée: ${minutes}min ${seconds}s`,
      duration: 5000,
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    });
  }

  static contentGenerated(source: 'ai' | 'cache' | 'fallback') {
    const sourceText = source === 'cache' ? 'depuis le cache' : 
                       source === 'ai' ? 'par l\'IA' : 'en mode hors ligne';
    
    toast.success(`Contenu généré ${sourceText}`, {
      duration: 3000,
      icon: <Zap className="w-5 h-5 text-blue-500" />,
    });
  }

  static generationProgress(step: string) {
    toast.loading(step, {
      description: 'Génération en cours...',
      duration: Infinity,
      id: 'generation-progress'
    });
  }

  static dismissProgress() {
    toast.dismiss('generation-progress');
  }

  static error(title: string, description?: string) {
    toast.error(title, {
      description,
      duration: 6000,
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    });
  }

  static info(title: string, description?: string) {
    toast.info(title, {
      description,
      duration: 4000,
      icon: <Info className="w-5 h-5 text-blue-500" />,
    });
  }

  static sessionInterrupted() {
    toast.info('Session interrompue', {
      description: 'Votre progression a été sauvegardée',
      duration: 3000,
    });
  }
}