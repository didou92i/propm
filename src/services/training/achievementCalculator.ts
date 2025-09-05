import type { TrainingSessionData } from '@/hooks/useTrainingSession';
import { Trophy, Star, Target, Zap, Medal, Crown, Clock, Brain, Flame } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Service pour calculer les achievements/succès de formation
 */
export const achievementCalculator = {
  /**
   * Calcule tous les achievements basés sur les données de session
   */
  calculateAchievements(sessionData: TrainingSessionData): Achievement[] {
    return [
      ...this.getBasicAchievements(sessionData),
      ...this.getProgressAchievements(sessionData),
      ...this.getExpertAchievements(sessionData),
      ...this.getSpecialAchievements(sessionData)
    ];
  },

  /**
   * Achievements de base pour débuter
   */
  getBasicAchievements(sessionData: TrainingSessionData): Achievement[] {
    return [
      {
        id: 'first-session',
        name: 'Premier Pas',
        description: 'Compléter votre première session d\'entraînement',
        icon: Star,
        color: 'text-yellow-500',
        unlocked: sessionData.totalSessions > 0,
        rarity: 'common' as const
      },
      {
        id: 'early-bird',
        name: 'Lève-tôt',
        description: 'Complétez 5 sessions d\'entraînement',
        icon: Target,
        color: 'text-blue-500',
        unlocked: sessionData.totalSessions >= 5,
        progress: Math.min(sessionData.totalSessions, 5),
        maxProgress: 5,
        rarity: 'common' as const
      },
      {
        id: 'consistent-learner',
        name: 'Apprenant Régulier',
        description: 'Maintenir une série de 3 jours consécutifs',
        icon: Flame,
        color: 'text-orange-500',
        unlocked: sessionData.streakDays >= 3,
        progress: Math.min(sessionData.streakDays, 3),
        maxProgress: 3,
        rarity: 'common' as const
      }
    ];
  },

  /**
   * Achievements de progression
   */
  getProgressAchievements(sessionData: TrainingSessionData): Achievement[] {
    return [
      {
        id: 'score-achiever',
        name: 'Bon Élève',
        description: 'Atteindre un score moyen de 70%',
        icon: Trophy,
        color: 'text-green-500',
        unlocked: sessionData.averageScore >= 70,
        progress: Math.min(sessionData.averageScore, 70),
        maxProgress: 70,
        rarity: 'rare' as const
      },
      {
        id: 'session-veteran',
        name: 'Vétéran',
        description: 'Compléter 25 sessions d\'entraînement',
        icon: Medal,
        color: 'text-purple-500',
        unlocked: sessionData.totalSessions >= 25,
        progress: Math.min(sessionData.totalSessions, 25),
        maxProgress: 25,
        rarity: 'rare' as const
      },
      {
        id: 'streak-warrior',
        name: 'Guerrier de la Régularité',
        description: 'Maintenir une série de 7 jours',
        icon: Zap,
        color: 'text-yellow-600',
        unlocked: sessionData.streakDays >= 7,
        progress: Math.min(sessionData.streakDays, 7),
        maxProgress: 7,
        rarity: 'rare' as const
      }
    ];
  },

  /**
   * Achievements d'expert
   */
  getExpertAchievements(sessionData: TrainingSessionData): Achievement[] {
    return [
      {
        id: 'score-master',
        name: 'Maître du Score',
        description: 'Atteindre un score moyen supérieur à 85%',
        icon: Crown,
        color: 'text-yellow-400',
        unlocked: sessionData.averageScore >= 85,
        rarity: 'epic' as const
      },
      {
        id: 'time-dedication',
        name: 'Dédication Temporelle',
        description: 'Passer plus de 10 heures à s\'entraîner',
        icon: Clock,
        color: 'text-blue-600',
        unlocked: sessionData.totalTimeMinutes >= 600,
        progress: Math.min(sessionData.totalTimeMinutes, 600),
        maxProgress: 600,
        rarity: 'epic' as const
      },
      {
        id: 'marathon-runner',
        name: 'Marathonien',
        description: 'Compléter 50 sessions d\'entraînement',
        icon: Brain,
        color: 'text-indigo-500',
        unlocked: sessionData.totalSessions >= 50,
        progress: Math.min(sessionData.totalSessions, 50),
        maxProgress: 50,
        rarity: 'epic' as const
      }
    ];
  },

  /**
   * Achievements spéciaux et rares
   */
  getSpecialAchievements(sessionData: TrainingSessionData): Achievement[] {
    return [
      {
        id: 'perfectionist',
        name: 'Perfectionniste',
        description: 'Atteindre un score parfait de 100%',
        icon: Crown,
        color: 'text-yellow-300',
        unlocked: sessionData.averageScore >= 100,
        rarity: 'legendary' as const
      },
      {
        id: 'super-streak',
        name: 'Super Série',
        description: 'Maintenir une série de 30 jours',
        icon: Flame,
        color: 'text-red-500',
        unlocked: sessionData.streakDays >= 30,
        progress: Math.min(sessionData.streakDays, 30),
        maxProgress: 30,
        rarity: 'legendary' as const
      },
      {
        id: 'centurion',
        name: 'Centurion',
        description: 'Compléter 100 sessions d\'entraînement',
        icon: Medal,
        color: 'text-gold',
        unlocked: sessionData.totalSessions >= 100,
        progress: Math.min(sessionData.totalSessions, 100),
        maxProgress: 100,
        rarity: 'legendary' as const
      }
    ];
  },

  /**
   * Filtre les achievements par rareté
   */
  filterByRarity(achievements: Achievement[], rarity: Achievement['rarity']): Achievement[] {
    return achievements.filter(achievement => achievement.rarity === rarity);
  },

  /**
   * Compte les achievements débloqués
   */
  countUnlocked(achievements: Achievement[]): number {
    return achievements.filter(achievement => achievement.unlocked).length;
  },

  /**
   * Calcule le pourcentage de progression global
   */
  calculateOverallProgress(achievements: Achievement[]): number {
    const totalAchievements = achievements.length;
    const unlockedAchievements = this.countUnlocked(achievements);
    
    return totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;
  }
};