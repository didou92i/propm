import type { TrainingSessionData } from '@/hooks/useTrainingSession';

export interface TrainingMetrics {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  averageScore: number;
  totalTimeMinutes: number;
  streakDays: number;
  improvementRate: number;
  efficiency: number;
}

export interface ProgressMetrics {
  weeklyProgress: number;
  monthlyProgress: number;
  consistencyScore: number;
  learningVelocity: number;
}

/**
 * Service pour calculer les statistiques et métriques de formation
 */
export const statisticsService = {
  /**
   * Calcule les métriques principales de formation
   */
  calculateMetrics(sessionData: TrainingSessionData): TrainingMetrics {
    const {
      totalSessions,
      averageScore,
      totalTimeMinutes,
      streakDays,
      recentActivity = []
    } = sessionData;

    // Estimation des sessions complétées vs en cours
    const completedSessions = Math.floor(totalSessions * 0.7); // 70% estimées complétées
    const inProgressSessions = totalSessions - completedSessions;

    // Calcul du taux d'amélioration basé sur l'activité récente
    const improvementRate = this.calculateImprovementRate(recentActivity);

    // Calcul de l'efficacité (score/temps)
    const efficiency = totalTimeMinutes > 0 ? averageScore / (totalTimeMinutes / 60) : 0;

    return {
      totalSessions,
      completedSessions,
      inProgressSessions,
      averageScore,
      totalTimeMinutes,
      streakDays,
      improvementRate,
      efficiency: Math.round(efficiency * 100) / 100
    };
  },

  /**
   * Calcule les métriques de progression
   */
  calculateProgressMetrics(sessionData: TrainingSessionData): ProgressMetrics {
    const { recentActivity = [] } = sessionData;
    
    const weeklyProgress = this.calculateWeeklyProgress(recentActivity);
    const monthlyProgress = this.calculateMonthlyProgress(recentActivity);
    const consistencyScore = this.calculateConsistencyScore(recentActivity);
    const learningVelocity = this.calculateLearningVelocity(recentActivity);

    return {
      weeklyProgress,
      monthlyProgress,
      consistencyScore,
      learningVelocity
    };
  },

  /**
   * Calcule le taux d'amélioration basé sur l'évolution des scores
   */
  calculateImprovementRate(recentActivity: any[]): number {
    if (recentActivity.length < 2) return 0;

    const sortedActivity = recentActivity
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstScore = sortedActivity[0]?.averageScore || 0;
    const lastScore = sortedActivity[sortedActivity.length - 1]?.averageScore || 0;

    return firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;
  },

  /**
   * Calcule la progression hebdomadaire
   */
  calculateWeeklyProgress(recentActivity: any[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyActivity = recentActivity.filter(
      activity => new Date(activity.date) >= oneWeekAgo
    );

    return weeklyActivity.reduce((sum, activity) => sum + activity.sessionsCount, 0);
  },

  /**
   * Calcule la progression mensuelle
   */
  calculateMonthlyProgress(recentActivity: any[]): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyActivity = recentActivity.filter(
      activity => new Date(activity.date) >= oneMonthAgo
    );

    return monthlyActivity.reduce((sum, activity) => sum + activity.sessionsCount, 0);
  },

  /**
   * Calcule le score de consistance (régularité d'entraînement)
   */
  calculateConsistencyScore(recentActivity: any[]): number {
    if (recentActivity.length === 0) return 0;

    const totalDays = 30; // Sur 30 jours
    const activeDays = recentActivity.length;

    return Math.round((activeDays / totalDays) * 100);
  },

  /**
   * Calcule la vélocité d'apprentissage
   */
  calculateLearningVelocity(recentActivity: any[]): number {
    if (recentActivity.length === 0) return 0;

    const totalSessions = recentActivity.reduce(
      (sum, activity) => sum + activity.sessionsCount, 0
    );
    const avgScoreIncrease = this.calculateImprovementRate(recentActivity);

    return Math.round((totalSessions * Math.max(0, avgScoreIncrease)) / 100);
  }
};