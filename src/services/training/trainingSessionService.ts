import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';
import type { Database } from '@/integrations/supabase/types';

type DbTrainingSession = Database['public']['Tables']['prepa_cds_sessions']['Row'];
type DbTrainingProgress = Database['public']['Tables']['prepa_cds_progress_logs']['Row'];
type DbExerciseHistory = Database['public']['Tables']['prepa_cds_exercise_history']['Row'];

export interface TrainingSession extends Omit<DbTrainingSession, 'training_type' | 'level' | 'domain'> {
  training_type: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
}

export interface TrainingProgress extends DbTrainingProgress {}

export interface ExerciseHistory extends DbExerciseHistory {}

export interface TrainingSessionWithProgress extends DbTrainingSession {
  prepa_cds_progress_logs: Array<{
    evaluation_score: number | null;
  }>;
}

export class TrainingSessionService {
  private static instance: TrainingSessionService;

  static getInstance(): TrainingSessionService {
    if (!TrainingSessionService.instance) {
      TrainingSessionService.instance = new TrainingSessionService();
    }
    return TrainingSessionService.instance;
  }

  /**
   * Créer une nouvelle session d'entraînement
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
        level: level,
        domain: domain,
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

      if (error) {
        logger.error('Erreur création session', error, 'TrainingSessionService');
        throw error;
      }

      logger.info('Session créée avec succès', { sessionId, trainingType }, 'TrainingSessionService');
      return data;

    } catch (error) {
      logger.error('Échec création session', error, 'TrainingSessionService');
      return null;
    }
  }

  /**
   * Mettre à jour une session existante
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<TrainingSession, 'id' | 'user_id' | 'created_at'>>
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('prepa_cds_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Erreur mise à jour session', error, 'TrainingSessionService');
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Échec mise à jour session', error, 'TrainingSessionService');
      return false;
    }
  }

  /**
   * Marquer une session comme terminée
   */
  async completeSession(sessionId: string, duration: number): Promise<boolean> {
    try {
      return await this.updateSession(sessionId, {
        session_duration: duration,
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Échec finalisation session', error, 'TrainingSessionService');
      return false;
    }
  }

  /**
   * Enregistrer un exercice dans l'historique
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
        domain: domain,
        was_alternative: wasAlternative
      };

      const { data, error } = await supabase
        .from('prepa_cds_exercise_history')
        .insert([exerciseData])
        .select()
        .single();

      if (error) {
        logger.error('Erreur enregistrement exercice', error, 'TrainingSessionService');
        throw error;
      }

      return data;

    } catch (error) {
      logger.error('Échec enregistrement exercice', error, 'TrainingSessionService');
      return null;
    }
  }

  /**
   * Enregistrer la progression de l'utilisateur
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

      if (error) {
        logger.error('Erreur enregistrement progression', error, 'TrainingSessionService');
        throw error;
      }

      return data;

    } catch (error) {
      logger.error('Échec enregistrement progression', error, 'TrainingSessionService');
      return null;
    }
  }

  /**
   * Récupérer les sessions de l'utilisateur
   */
  async getUserSessions(limit: number = 20): Promise<DbTrainingSession[]> {
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

      if (error) {
        logger.error('Erreur récupération sessions', error, 'TrainingSessionService');
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('Échec récupération sessions', error, 'TrainingSessionService');
      return [];
    }
  }

  /**
   * Calculer les statistiques utilisateur
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

      // Récupérer TOUTES les sessions avec leurs progressions (complétées ET en cours)
      const { data: sessions, error: sessionsError } = await supabase
        .from('prepa_cds_sessions')
        .select(`
          *,
          prepa_cds_progress_logs!session_id(evaluation_score)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Debug: Log pour vérifier les données
      logger.info('Sessions récupérées', { 
        count: sessions?.length || 0, 
        error: sessionsError,
        sessions: sessions?.slice(0, 2) // Premier 2 pour debug
      }, 'TrainingSessionService');

      if (sessionsError) {
        logger.error('Erreur requête sessions avec progressions', sessionsError, 'TrainingSessionService');
        // Fallback: récupérer seulement les sessions sans progressions
        const { data: fallbackSessions } = await supabase
          .from('prepa_cds_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (fallbackSessions) {
          logger.info('Fallback: sessions sans progressions', { count: fallbackSessions.length }, 'TrainingSessionService');
          return this.calculateBasicStats(fallbackSessions);
        }
      }

      if (!sessions || sessions.length === 0) {
        logger.info('Aucune session trouvée', { userId: user.id }, 'TrainingSessionService');
        return {
          totalSessions: 0,
          averageScore: 0,
          totalTimeMinutes: 0,
          streakDays: 0,
          sessionsByDomain: {},
          recentActivity: []
        };
      }

      // Calculer les statistiques (séparer sessions complétées et totales)
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.completed_at !== null);
      const totalTimeMinutes = sessions.reduce((sum, session) => sum + (session.session_duration || 0), 0);
      
      // Calculer le score moyen
      let totalScores = 0;
      let scoreCount = 0;
      sessions.forEach((session: any) => {
        if (session.prepa_cds_progress_logs && Array.isArray(session.prepa_cds_progress_logs)) {
          session.prepa_cds_progress_logs.forEach((log: any) => {
            if (log.evaluation_score !== null) {
              totalScores += log.evaluation_score;
              scoreCount++;
            }
          });
        }
      });
      const averageScore = scoreCount > 0 ? Math.round(totalScores / scoreCount) : 0;

      // Calculer la série (streak) de jours consécutifs (uniquement sessions complétées)
      const streakDays = this.calculateStreak(completedSessions as any);

      // Sessions par domaine (toutes les sessions)
      const sessionsByDomain = sessions.reduce((acc, session) => {
        acc[session.domain] = (acc[session.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Activité récente (30 derniers jours) - toutes les sessions
      const recentActivity = this.calculateRecentActivity(sessions as any);

      return {
        totalSessions,
        averageScore,
        totalTimeMinutes,
        streakDays,
        sessionsByDomain,
        recentActivity
      };

    } catch (error) {
      logger.error('Échec calcul statistiques', error, 'TrainingSessionService');
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
   * Vérifier si un contenu a déjà été proposé récemment
   */
  async isContentAlreadyProposed(sessionId: string, content: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const contentHash = this.generateContentHash(content);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('prepa_cds_exercise_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_hash', contentHash)
        .gte('generated_at', oneDayAgo)
        .limit(1);

      if (error) {
        logger.error('Erreur vérification contenu', error, 'TrainingSessionService');
        return false;
      }

      return (data && data.length > 0);

    } catch (error) {
      logger.error('Échec vérification contenu', error, 'TrainingSessionService');
      return false;
    }
  }

  /**
   * Calculer la série de jours consécutifs
   */
  private calculateStreak(sessions: TrainingSessionWithProgress[]): number {
    if (sessions.length === 0) return 0;

    const sessionDates = sessions
      .map(session => new Date(session.completed_at || session.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    let currentDate = new Date();

    for (const sessionDate of sessionDates) {
      const checkDate = currentDate.toDateString();
      
      if (sessionDate === checkDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate === today && streak === 0) {
        // Aujourd'hui compte toujours pour démarrer une série
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculer l'activité récente
   */
  private calculateRecentActivity(sessions: any[]): Array<{ date: string; sessionsCount: number; averageScore: number }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(session => 
      new Date(session.completed_at || session.created_at) >= thirtyDaysAgo
    );

    const activityByDate = recentSessions.reduce((acc, session) => {
      const date = new Date(session.completed_at || session.created_at).toDateString();
      
      if (!acc[date]) {
        acc[date] = { sessionsCount: 0, totalScore: 0, scoreCount: 0 };
      }
      
      acc[date].sessionsCount++;
      
      // Calculer le score moyen pour cette session
      if (session.prepa_cds_progress_logs && Array.isArray(session.prepa_cds_progress_logs)) {
        session.prepa_cds_progress_logs.forEach((log: any) => {
          if (log.evaluation_score !== null) {
            acc[date].totalScore += log.evaluation_score;
            acc[date].scoreCount++;
          }
        });
      }
      
      return acc;
    }, {} as Record<string, { sessionsCount: number; totalScore: number; scoreCount: number }>);

    return Object.entries(activityByDate).map(([date, data]) => {
      const activityData = data as { sessionsCount: number; totalScore: number; scoreCount: number };
      return {
        date,
        sessionsCount: activityData.sessionsCount,
        averageScore: activityData.scoreCount > 0 ? Math.round(activityData.totalScore / activityData.scoreCount) : 0
      };
    });
  }

  /**
   * Calculer les stats de base sans progressions
   */
  private calculateBasicStats(sessions: DbTrainingSession[]) {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed_at !== null);
    const totalTimeMinutes = sessions.reduce((sum, session) => sum + (session.session_duration || 0), 0);
    
    const sessionsByDomain = sessions.reduce((acc, session) => {
      acc[session.domain] = (acc[session.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      averageScore: 0, // Pas de progressions disponibles
      totalTimeMinutes,
      streakDays: this.calculateStreak(completedSessions as any),
      sessionsByDomain,
      recentActivity: []
    };
  }

  /**
   * Générer un hash simple pour le contenu
   */
  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const trainingSessionService = TrainingSessionService.getInstance();