import { useMemo } from 'react';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { statisticsService } from '@/services/training/statisticsService';
import { chartDataTransformer } from '@/services/training/chartDataTransformer';
import { achievementCalculator } from '@/services/training/achievementCalculator';

/**
 * Hook pour gérer les calculs et transformations de données de formation
 * Responsabilité : Agrégation et transformation des métriques
 */
export const useTrainingStats = () => {
  const { 
    sessionData, 
    isLoading: sessionLoading, 
    isEmpty,
    refreshSessionData 
  } = useTrainingSession();

  // Métriques calculées avec memoization
  const metrics = useMemo(() => {
    if (!sessionData) return null;
    return statisticsService.calculateMetrics(sessionData);
  }, [sessionData]);

  // Données pour graphiques avec memoization
  const chartData = useMemo(() => {
    if (!sessionData) return { performance: [], domains: [] };
    return {
      performance: chartDataTransformer.transformPerformanceData(sessionData),
      domains: chartDataTransformer.transformDomainData(sessionData)
    };
  }, [sessionData]);

  // Achievements calculés avec memoization
  const achievements = useMemo(() => {
    if (!sessionData) return [];
    return achievementCalculator.calculateAchievements(sessionData);
  }, [sessionData]);

  // Métriques de progression
  const progressMetrics = useMemo(() => {
    if (!sessionData) return null;
    return statisticsService.calculateProgressMetrics(sessionData);
  }, [sessionData]);

  return {
    // Données brutes
    sessionData,
    isEmpty,
    
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