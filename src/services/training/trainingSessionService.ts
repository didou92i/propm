import { supabase } from '@/integrations/supabase/client';
import { logger as Logger } from '@/utils/logger';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import type { Database } from '@/integrations/supabase/types';

type DbTrainingSession = Database['public']['Tables']['prepa_cds_sessions']['Row'];

interface TrainingSession {
  sessionId: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
}

interface TrainingProgress {
  sessionId: string;
  exerciseId: string;
  userAnswer: string;
  evaluationScore: number;
  timeSpentSeconds: number;
  feedbackProvided?: string;
}

interface ExerciseHistory {
  sessionId: string;
  exerciseType: string;
  contentHash: string;
  contentPreview: string;
  difficultyLevel: string;
  domain: string;
  wasAlternative: boolean;
}

interface TrainingSessionWithProgress extends DbTrainingSession {
  prepa_cds_progress_logs?: Array<{ evaluation_score: number }>;
}

/**
 * Service pour gérer les sessions d'entraînement et le progrès utilisateur
 */
class TrainingSessionService {
  private static instance: TrainingSessionService | null = null;

  static getInstance(): TrainingSessionService {
    if (!TrainingSessionService.instance) {
      TrainingSessionService.instance = new TrainingSessionService();
    }
    return TrainingSessionService.instance;
  }

  /**
   * Crée une nouvelle session d'entraînement
   */
  async createSession(
    sessionId: string,
    trainingType: TrainingType,
    level: UserLevel,
    domain: StudyDomain
  ): Promise<DbTrainingSession | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const sessionData = {
        user_id: user.id,
        session_id: sessionId,
        training_type: trainingType,
        level,
        domain,
        exercises_proposed: [],
        questions_asked: [],
        cases_studied: [],
        documents_analyzed: [],
        anti_loop_warnings: 0,
        session_duration: 0
      };

      const { data, error } = await supabase
        .from('prepa_cds_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      Logger.info('Session créée avec succès', { sessionId, trainingType, level, domain });
      return data;

    } catch (error) {
      Logger.error('Erreur création session', error);
      return null;
    }
  }

  /**
   * Met à jour une session d'entraînement
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<TrainingSession, 'id' | 'user_id' | 'created_at'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prepa_cds_sessions')
        .update(updates)
        .eq('session_id', sessionId);

      if (error) throw error;

      Logger.info('Session mise à jour', { sessionId, updates });
      return true;

    } catch (error) {
      Logger.error('Erreur mise à jour session', error);
      return false;
    }
  }

  /**
   * Termine une session d'entraînement
   */
  async completeSession(sessionId: string, duration: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prepa_cds_sessions')
        .update({
          completed_at: new Date().toISOString(),
          session_duration: duration
        })
        .eq('session_id', sessionId);

      if (error) throw error;

      Logger.info('Session terminée', { sessionId, duration });
      return true;

    } catch (error) {
      Logger.error('Erreur finalisation session', error);
      return false;
    }
  }

  /**
   * Enregistre un exercice dans l'historique
   */
  async recordExercise(
    sessionId: string,
    exerciseType: string,
    content: string,
    difficultyLevel: string,
    domain: string,
    wasAlternative: boolean = false
  ): Promise<ExerciseHistory | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const contentHash = this.generateContentHash(content);
      const contentPreview = content.substring(0, 200);

      const exerciseData = {
        user_id: user.id,
        session_id: sessionId,
        exercise_type: exerciseType,
        content_hash: contentHash,
        content_preview: contentPreview,
        difficulty_level: difficultyLevel,
        domain,
        was_alternative: wasAlternative
      };

      const { data, error } = await supabase
        .from('prepa_cds_exercise_history')
        .insert([exerciseData])
        .select()
        .single();

      if (error) throw error;

      return {
        sessionId,
        exerciseType,
        contentHash,
        contentPreview,
        difficultyLevel,
        domain,
        wasAlternative
      };

    } catch (error) {
      Logger.error('Erreur enregistrement exercice', error);
      return null;
    }
  }

  /**
   * Enregistre la progression d'un exercice
   */
  async recordProgress(
    sessionId: string,
    exerciseId: string,
    userAnswer: string,
    evaluationScore: number,
    timeSpentSeconds: number,
    feedback?: string
  ): Promise<TrainingProgress | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const progressData = {
        user_id: user.id,
        session_id: sessionId,
        exercise_id: exerciseId,
        user_answer: userAnswer,
        evaluation_score: evaluationScore,
        time_spent_seconds: timeSpentSeconds,
        feedback_provided: feedback
      };

      const { data, error } = await supabase
        .from('prepa_cds_progress_logs')
        .insert([progressData])
        .select()
        .single();

      if (error) throw error;

      return {
        sessionId,
        exerciseId,
        userAnswer,
        evaluationScore,
        timeSpentSeconds,
        feedbackProvided: feedback
      };

    } catch (error) {
      Logger.error('Erreur enregistrement progression', error);
      return null;
    }
  }

  /**
   * Récupère les sessions d'entraînement de l'utilisateur
   */
  async getUserSessions(limit: number = 50): Promise<DbTrainingSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('prepa_cds_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];

    } catch (error) {
      Logger.error('Erreur récupération sessions', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques utilisateur
   */
  async getUserStats(): Promise<{
    totalSessions: number;
    averageScore: number;
    totalTimeMinutes: number;
    streakDays: number;
    sessionsByDomain: Record<string, number>;
    recentActivity: Array<{ date: string; sessionsCount: number; averageScore: number }>;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          totalSessions: 0,
          averageScore: 0,
          totalTimeMinutes: 0,
          streakDays: 0,
          sessionsByDomain: {},
          recentActivity: []
        };
      }

      // Récupérer les sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('prepa_cds_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionError) {
        throw sessionError;
      }

      // Récupérer tous les progress logs une seule fois
      const { data: allProgressLogs, error: progressError } = await supabase
        .from('prepa_cds_progress_logs')
        .select('session_id, evaluation_score, time_spent_seconds')
        .eq('user_id', user.id);

      if (progressError) {
        Logger.error('Erreur récupération progress logs', progressError);
        // Continue sans erreur pour éviter de bloquer l'interface
      }

      // Organiser les progress logs par session
      const progressBySession = (allProgressLogs || []).reduce((acc: Record<string, any[]>, progress) => {
        if (!acc[progress.session_id]) {
          acc[progress.session_id] = [];
        }
        acc[progress.session_id].push(progress);
        return acc;
      }, {});

      const allSessions = sessions || [];
      
      // Calculer les statistiques principales
      const totalSessions = allSessions.length;
      let totalScore = 0;
      let scoreCount = 0;
      
      Object.values(progressBySession).forEach((logs: any) => {
        if (logs.length > 0) {
          const sessionAvgScore = logs.reduce((sum: number, log: any) => 
            sum + (log.evaluation_score || 0), 0) / logs.length;
          totalScore += sessionAvgScore;
          scoreCount++;
        }
      });
      
      const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      // Calculer le temps total (minutes)
      const totalTimeMinutes = Math.round(
        allSessions.reduce((sum, session) => sum + (session.session_duration || 0), 0) / 60
      );

      // Calculer les sessions par domaine
      const sessionsByDomain = allSessions.reduce((acc: Record<string, number>, session) => {
        acc[session.domain] = (acc[session.domain] || 0) + 1;
        return acc;
      }, {});

      // Calculer le streak (jours consécutifs)
      const streakDays = this.calculateStreak(allSessions);

      // Calculer l'activité récente avec les scores réels
      const recentActivity = this.calculateRecentActivityWithScores(allSessions, progressBySession);

      Logger.info('Statistiques calculées', {
        totalSessions,
        averageScore,
        totalTimeMinutes,
        streakDays,
        recentActivityCount: recentActivity.length
      });

      return {
        totalSessions,
        averageScore,
        totalTimeMinutes,
        streakDays,
        sessionsByDomain,
        recentActivity
      };

    } catch (error) {
      Logger.error('Erreur calcul statistiques', error);
      return {
        totalSessions: 0,
        averageScore: 0,
        totalTimeMinutes: 0,
        streakDays: 0,
        sessionsByDomain: {},
        recentActivity: []
      };
    }
  }

  /**
   * Vérifie si un contenu a déjà été proposé récemment
   */
  async isContentAlreadyProposed(sessionId: string, content: string): Promise<boolean> {
    try {
      const contentHash = this.generateContentHash(content);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Vérifier dans les 24 dernières heures
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('prepa_cds_exercise_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_hash', contentHash)
        .gte('generated_at', twentyFourHoursAgo.toISOString())
        .limit(1);

      if (error) {
        Logger.error('Erreur vérification contenu', error);
        return false;
      }

      return (data && data.length > 0);

    } catch (error) {
      Logger.error('Erreur vérification contenu proposé', error);
      return false;
    }
  }

  /**
   * Calcule le streak de jours consécutifs
   */
  private calculateStreak(sessions: DbTrainingSession[]): number {
    if (!sessions || sessions.length === 0) return 0;

    const completedSessions = sessions
      .filter(s => s.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

    if (completedSessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Grouper les sessions par jour
    const sessionsByDay = new Set<string>();
    completedSessions.forEach(session => {
      const sessionDate = new Date(session.completed_at!);
      sessionDate.setHours(0, 0, 0, 0);
      sessionsByDay.add(sessionDate.toDateString());
    });

    const sortedDays = Array.from(sessionsByDay)
      .map(day => new Date(day))
      .sort((a, b) => b.getTime() - a.getTime());

    // Calculer le streak
    let currentDate = new Date(today);
    
    for (const sessionDay of sortedDays) {
      if (sessionDay.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDay.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  /**
   * Calcule l'activité récente avec les scores réels
   */
  private calculateRecentActivityWithScores(sessions: any[], progressBySession: any): Array<{
    date: string;
    sessionsCount: number;
    averageScore: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = sessions.filter(session => 
      new Date(session.created_at) >= thirtyDaysAgo
    );

    // Grouper par date
    const sessionsByDate = recentSessions.reduce((acc: any, session) => {
      const date = new Date(session.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          sessions: [],
          totalScore: 0,
          scoreCount: 0
        };
      }
      acc[date].sessions.push(session);
      
      // Calculer le score de la session si disponible
      const logs = progressBySession[session.session_id] || [];
      if (logs.length > 0) {
        const sessionScore = logs.reduce((sum: number, log: any) => 
          sum + (log.evaluation_score || 0), 0) / logs.length;
        acc[date].totalScore += sessionScore;
        acc[date].scoreCount++;
      }
      
      return acc;
    }, {});

    return Object.entries(sessionsByDate).map(([date, data]: [string, any]) => ({
      date,
      sessionsCount: data.sessions.length,
      averageScore: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : 0
    }));
  }

  /**
   * Calcule des statistiques de base quand les progress logs ne sont pas disponibles
   */
  private calculateBasicStats(sessions: DbTrainingSession[]): any {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed_at).length;
    
    // Score moyen estimé basé sur le niveau de difficulté
    const averageScore = sessions.length > 0 ? 
      Math.round(sessions.reduce((sum, session) => {
        switch (session.level) {
          case 'debutant': return sum + 75;
          case 'intermediaire': return sum + 70;
          case 'avance': return sum + 65;
          default: return sum + 70;
        }
      }, 0) / sessions.length) : 0;

    const totalTimeMinutes = Math.round(
      sessions.reduce((sum, session) => sum + (session.session_duration || 0), 0) / 60
    );

    const sessionsByDomain = sessions.reduce((acc: Record<string, number>, session) => {
      acc[session.domain] = (acc[session.domain] || 0) + 1;
      return acc;
    }, {});

    const streakDays = this.calculateStreak(sessions);
    const recentActivity = this.calculateRecentActivityWithScores(sessions, {});

    return {
      totalSessions,
      averageScore,
      totalTimeMinutes,
      streakDays,
      sessionsByDomain,
      recentActivity
    };
  }

  /**
   * Génère un hash simple pour le contenu
   */
  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

// Export du service en singleton
export const trainingSessionService = TrainingSessionService.getInstance();