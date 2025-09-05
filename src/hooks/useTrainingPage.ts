import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import type { TrainingConfig } from '@/types/training';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { realDataService } from '@/services/training/realDataService';

/**
 * Hook simplifié pour la page Training - Accès direct aux données
 * Remplace useOptimizedTrainingManager avec architecture simplifiée
 */
export const useTrainingPage = (initialConfig: TrainingConfig) => {
  // États de base
  const [configuration, setConfiguration] = useState<TrainingConfig>(initialConfig);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  // Hooks existants
  const { user, signOut } = useAuth();
  const {
    sessionData,
    isLoading: sessionLoading,
    isEmpty,
    currentSessionId,
    createSession,
    completeSession,
    refreshSessionData
  } = useTrainingSession();

  // === DEBUGGING VISUEL ===
  const logDebugInfo = useCallback(() => {
    console.group('🔍 TRAINING PAGE DEBUG');
    console.log('📊 Session Data:', sessionData);
    console.log('🔢 Total Sessions:', sessionData?.totalSessions || 0);
    console.log('📈 isEmpty:', isEmpty);
    console.log('👤 User:', user ? `Connecté (${user.email})` : 'Non connecté');
    console.log('⚙️ Configuration:', configuration);
    console.log('🎮 Training Active:', isTrainingActive);
    console.log('⚡ Show Config:', showConfiguration);
    console.log('🔄 Loading:', sessionLoading || isStarting);
    console.groupEnd();
  }, [sessionData, isEmpty, user, configuration, isTrainingActive, showConfiguration, sessionLoading, isStarting]);

  // Debug automatique à chaque changement
  useEffect(() => {
    logDebugInfo();
  }, [logDebugInfo]);

  // Génération automatique optimisée des données si nécessaire
  useEffect(() => {
    const ensureData = async () => {
      if (!sessionLoading && user && sessionData && sessionData.totalSessions === 0) {
        try {
          console.log('🔄 Génération automatique de données d\'exemple...');
          const result = await realDataService.ensureDataCompleteness();
          if (result.sessionsCreated > 0 || result.progressLogsCreated > 0) {
            // Attendre un peu pour que les données soient bien écrites
            setTimeout(async () => {
              await refreshSessionData();
              console.log('✅ Données générées avec succès:', result);
            }, 1000);
          }
        } catch (error) {
          console.warn('⚠️ Génération automatique échouée, continuons sans données:', error);
        }
      }
    };

    ensureData();
  }, [sessionLoading, user, sessionData?.totalSessions, refreshSessionData]);

  // === ACTIONS SIMPLIFIÉES ===
  const handleStartTraining = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour commencer un entraînement');
      return;
    }

    try {
      setIsStarting(true);
      console.log('🚀 Démarrage entraînement avec config:', configuration);
      
      const sessionId = await createSession(
        configuration.trainingType,
        configuration.level,
        configuration.domain
      );

      if (sessionId) {
        setSessionStartTime(Date.now());
        setIsTrainingActive(true);
        setShowConfiguration(false);
        
        toast.success('Entraînement démarré !', {
          description: `${configuration.trainingType} • ${configuration.level} • ${configuration.domain}`
        });
        
        console.log('✅ Session créée:', sessionId);
      }
    } catch (error) {
      console.error('❌ Erreur démarrage:', error);
      toast.error('Erreur lors du démarrage de l\'entraînement');
    } finally {
      setIsStarting(false);
    }
  }, [user, configuration, createSession]);

  const handleTrainingComplete = useCallback(async (score: number, answers: any[]) => {
    if (!currentSessionId) return;

    try {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      console.log('🏁 Finalisation session:', { sessionId: currentSessionId, score, duration });

      const success = await completeSession(currentSessionId, duration, score, answers);
      
      if (success) {
        setIsTrainingActive(false);
        toast.success('Entraînement terminé !', {
          description: `Score: ${score}% • Durée: ${Math.floor(duration / 60)}min`
        });
        
        // Rafraîchir les données
        await refreshSessionData();
      }
    } catch (error) {
      console.error('❌ Erreur finalisation:', error);
      toast.error('Erreur lors de la finalisation');
    }
  }, [currentSessionId, sessionStartTime, completeSession, refreshSessionData]);

  const handleTrainingExit = useCallback(() => {
    setIsTrainingActive(false);
    toast.info('Entraînement interrompu');
    console.log('⏹️ Entraînement interrompu');
  }, []);

  const handleShowConfiguration = useCallback(() => {
    setShowConfiguration(true);
    console.log('⚙️ Affichage configuration');
  }, []);

  const handleConfigurationBack = useCallback(() => {
    setShowConfiguration(false);
    console.log('🔙 Retour depuis configuration');
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      console.log('👋 Déconnexion utilisateur');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      console.error('❌ Erreur déconnexion:', error);
    }
  }, [signOut]);

  // === DONNÉES CALCULÉES ===
  const hasSessionData = !!sessionData && sessionData.totalSessions > 0;
  const shouldShowDashboard = hasSessionData && !showConfiguration && !isTrainingActive;
  const shouldShowHero = !showConfiguration && !isTrainingActive;

  console.log('🎯 Display Logic:', {
    hasSessionData,
    shouldShowDashboard,
    shouldShowHero,
    showConfiguration
  });

  return {
    // États
    configuration,
    showConfiguration,
    isTrainingActive,
    user,
    currentSessionId,
    sessionData,
    isEmpty,
    hasSessionData,
    shouldShowDashboard,
    shouldShowHero,
    isLoading: sessionLoading || isStarting,

    // Actions
    setConfiguration,
    handleStartTraining,
    handleTrainingComplete,
    handleTrainingExit,
    handleShowConfiguration,
    handleConfigurationBack,
    handleSignOut,
    refreshSessionData,

    // Debugging
    logDebugInfo
  };
};