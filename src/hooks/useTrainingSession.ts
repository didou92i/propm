import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trainingSessionService } from '@/services/training/trainingSessionService';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface TrainingSessionData {
  totalSessions: number;
  averageScore: number;
  totalTimeMinutes: number;
  streakDays: number;
  sessionsByDomain: Record<string, number>;
  recentActivity: Array<{ date: string; sessionsCount: number; averageScore: number }>;
}

export const useTrainingSession = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<TrainingSessionData | null>(null);

  /**
   * Créer une nouvelle session d'entraînement
   */
  const createSession = useCallback(async (
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Vous devez être connecté pour commencer un entraînement');
      return null;
    }

    try {
      setIsLoading(true);
      const sessionId = `training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const session = await trainingSessionService.createSession(
        sessionId,
        trainingType,
        level,
        domain
      );

      if (session) {
        setCurrentSessionId(sessionId);
        toast.success('Session d\'entraînement créée', {
          description: `${trainingType} • ${level} • ${domain}`
        });
        logger.info('Session créée avec succès', { sessionId, trainingType }, 'useTrainingSession');
        return sessionId;
      } else {
        toast.error('Erreur lors de la création de la session');
        return null;
      }

    } catch (error) {
      logger.error('Échec création session', error, 'useTrainingSession');
      toast.error('Erreur lors de la création de la session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Marquer une session comme terminée
   */
  const completeSession = useCallback(async (
    sessionId: string,
    duration: number,
    score: number,
    answers: any[]
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      setIsLoading(true);
      
      const success = await trainingSessionService.completeSession(sessionId, duration);
      
      if (success) {
        toast.success('Session terminée !', {
          description: `Score: ${score}% • Durée: ${Math.floor(duration / 60)}min ${duration % 60}s`
        });
        
        // Rafraîchir les statistiques
        await refreshSessionData();
        
        return true;
      } else {
        toast.error('Erreur lors de la finalisation de la session');
        return false;
      }

    } catch (error) {
      logger.error('Échec finalisation session', error, 'useTrainingSession');
      toast.error('Erreur lors de la finalisation de la session');
      return false;
    } finally {
      setIsLoading(false);
      setCurrentSessionId(null);
    }
  }, [user]);

  /**
   * Enregistrer la progression d'un exercice
   */
  const recordProgress = useCallback(async (
    sessionId: string,
    exerciseId: string,
    userAnswer: string,
    score: number,
    timeSpent: number,
    feedback?: string
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const progress = await trainingSessionService.recordProgress(
        sessionId,
        exerciseId,
        userAnswer,
        score,
        timeSpent,
        feedback
      );

      return progress !== null;

    } catch (error) {
      logger.error('Échec enregistrement progression', error, 'useTrainingSession');
      return false;
    }
  }, [user]);

  /**
   * Enregistrer un exercice
   */
  const recordExercise = useCallback(async (
    sessionId: string,
    exerciseType: string,
    content: string,
    difficultyLevel: string,
    domain: string,
    wasAlternative: boolean = false
  ): Promise<string | null> => {
    if (!user) {
      return null;
    }

    try {
      const exercise = await trainingSessionService.recordExercise(
        sessionId,
        exerciseType,
        content,
        difficultyLevel,
        domain,
        wasAlternative
      );

      return exercise ? `exercise-${sessionId}-${Date.now()}` : null;

    } catch (error) {
      logger.error('Échec enregistrement exercice', error, 'useTrainingSession');
      return null;
    }
  }, [user]);

  /**
   * Vérifier si du contenu a déjà été proposé
   */
  const isContentAlreadyProposed = useCallback(async (
    sessionId: string,
    content: string
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      return await trainingSessionService.isContentAlreadyProposed(sessionId, content);
    } catch (error) {
      logger.error('Échec vérification contenu', error, 'useTrainingSession');
      return false;
    }
  }, [user]);

  /**
   * Rafraîchir les données de session
   */
  const refreshSessionData = useCallback(async (): Promise<void> => {
    if (!user) {
      setSessionData(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await trainingSessionService.getUserStats();
      setSessionData(data);
    } catch (error) {
      logger.error('Échec récupération statistiques', error, 'useTrainingSession');
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Charger les données de session au montage
   */
  useEffect(() => {
    if (user) {
      refreshSessionData();
    } else {
      setSessionData(null);
      setCurrentSessionId(null);
    }
  }, [user, refreshSessionData]);

  return {
    // État
    isLoading,
    currentSessionId,
    sessionData,
    
    // Actions
    createSession,
    completeSession,
    recordProgress,
    recordExercise,
    isContentAlreadyProposed,
    refreshSessionData,
    
    // Utilitaires
    isAuthenticated: !!user,
    hasData: !!sessionData,
    
    // Statistiques calculées  
    isEmpty: !sessionData || sessionData.totalSessions === 0
  };
};