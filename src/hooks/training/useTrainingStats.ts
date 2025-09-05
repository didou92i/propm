import { useMemo } from 'react';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { statisticsService } from '@/services/training/statisticsService';
import { chartDataTransformer } from '@/services/training/chartDataTransformer';
import { achievementCalculator } from '@/services/training/achievementCalculator';

/**
 * Hook simplifié pour les statistiques de formation
 * Responsabilité : Agrégation et transformation des métriques
 */
export const useTrainingStats = () => {
  const { 
    sessionData, 
    isLoading: sessionLoading, 
    isEmpty,
    refreshSessionData 
  } = useTrainingSession();

  // Métriques calculées avec memoization optimisée
  const metrics = useMemo(() => {
    if (!sessionData || sessionData.totalSessions === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        totalTimeMinutes: 0,
        streakDays: 0,
        improvementRate: 0,
        efficiency: 0,
        completedSessions: 0,
        inProgressSessions: 0
      };
    }
    return statisticsService.calculateMetrics(sessionData);
  }, [sessionData]);

  // Données pour graphiques simplifiées
  const chartData = useMemo(() => {
    if (!sessionData || sessionData.totalSessions === 0) {
      return { 
        performance: [], 
        domains: Object.entries(sessionData?.sessionsByDomain || {}).map(([name, value]) => ({ name, value }))
      };
    }
    return {
      performance: chartDataTransformer.transformPerformanceData(sessionData),
      domains: Object.entries(sessionData.sessionsByDomain || {}).map(([name, value]) => ({ name, value }))
    };
  }, [sessionData]);

  // Achievements simplifiés
  const achievements = useMemo(() => {
    if (!sessionData || sessionData.totalSessions === 0) return [];
    return achievementCalculator.calculateAchievements(sessionData);
  }, [sessionData]);

  // Métriques de progression
  const progressMetrics = useMemo(() => {
    if (!sessionData || sessionData.totalSessions === 0) {
      return {
        weeklyProgress: 0,
        monthlyProgress: 0,
        learningVelocity: 0,
        consistencyScore: 0
      };
    }
    return statisticsService.calculateProgressMetrics(sessionData);
  }, [sessionData]);

  return {
    // Données brutes
    sessionData,
    isEmpty: isEmpty || sessionData?.totalSessions === 0,
    
    // Données transformées
    metrics,
    chartData,
    achievements,
    progressMetrics,
    
    // États
    isLoading: sessionLoading,
    
    // Actions
    refreshSessionData
  };
};