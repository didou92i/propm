import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * Créer des données de test pour le système d'entraînement
 */
export const createTestTrainingData = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Vous devez être connecté pour créer des données de test');
      return false;
    }

    console.log('🧪 Création de données de test...');

    // Supprimer les anciennes données de test
    await supabase
      .from('prepa_cds_sessions')
      .delete()
      .eq('user_id', user.id)
      .like('session_id', 'test-%');

    // Créer 5 sessions de test
    const testSessions = [
      {
        user_id: user.id,
        session_id: `test-session-1-${Date.now()}`,
        training_type: 'quiz_interactif',
        level: 'debutant',
        domain: 'droit_public',
        session_duration: 1800, // 30 minutes
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
        exercises_proposed: ['exercise-1', 'exercise-2'],
        questions_asked: ['question-1', 'question-2'],
        cases_studied: [],
        documents_analyzed: [],
        anti_loop_warnings: 0
      },
      {
        user_id: user.id,
        session_id: `test-session-2-${Date.now()}`,
        training_type: 'etude_cas',
        level: 'intermediaire',
        domain: 'droit_prive',
        session_duration: 2400, // 40 minutes
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
        exercises_proposed: ['exercise-3', 'exercise-4'],
        questions_asked: ['question-3'],
        cases_studied: ['case-1'],
        documents_analyzed: [],
        anti_loop_warnings: 0
      },
      {
        user_id: user.id,
        session_id: `test-session-3-${Date.now()}`,
        training_type: 'simulation_examen',
        level: 'avance',
        domain: 'droit_constitutionnel',
        session_duration: 3600, // 60 minutes
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
        exercises_proposed: ['exercise-5', 'exercise-6', 'exercise-7'],
        questions_asked: ['question-4', 'question-5'],
        cases_studied: ['case-2'],
        documents_analyzed: ['doc-1'],
        anti_loop_warnings: 1
      },
      {
        user_id: user.id,
        session_id: `test-session-4-${Date.now()}`,
        training_type: 'quiz_interactif',
        level: 'intermediaire',
        domain: 'droit_public',
        session_duration: 1200, // 20 minutes
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 5 jours
        exercises_proposed: ['exercise-8'],
        questions_asked: ['question-6', 'question-7'],
        cases_studied: [],
        documents_analyzed: [],
        anti_loop_warnings: 0
      },
      {
        user_id: user.id,
        session_id: `test-session-5-${Date.now()}`,
        training_type: 'etude_cas',
        level: 'avance',
        domain: 'droit_prive',
        session_duration: 2700, // 45 minutes
        completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
        exercises_proposed: ['exercise-9', 'exercise-10'],
        questions_asked: ['question-8'],
        cases_studied: ['case-3', 'case-4'],
        documents_analyzed: ['doc-2'],
        anti_loop_warnings: 0
      }
    ];

    // Insérer les sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('prepa_cds_sessions')
      .insert(testSessions)
      .select();

    if (sessionsError) {
      console.error('❌ Erreur création sessions test:', sessionsError);
      throw sessionsError;
    }

    console.log('✅ Sessions de test créées:', sessionsData?.length);

    // Créer des logs de progression pour chaque session
    const progressLogs = [];
    const exerciseHistory = [];

    for (const session of sessionsData || []) {
      // Créer un historique d'exercices
      const exercisesProposed = Array.isArray(session.exercises_proposed) ? session.exercises_proposed : [];
      for (let i = 0; i < exercisesProposed.length; i++) {
        const exerciseId = `test-exercise-${session.id}-${i}`;
        
        exerciseHistory.push({
          user_id: user.id,
          session_id: session.session_id,
          exercise_type: session.training_type,
          content_hash: `hash-${exerciseId}`,
          content_preview: `Exercice de test ${i + 1} pour ${session.domain}`,
          difficulty_level: session.level,
          domain: session.domain,
          was_alternative: false
        });

        // Créer des logs de progression
        progressLogs.push({
          user_id: user.id,
          session_id: session.session_id,
          exercise_id: exerciseId,
          user_answer: `Réponse test ${i + 1}`,
          evaluation_score: Math.floor(Math.random() * 40) + 60, // Score entre 60 et 100
          time_spent_seconds: Math.floor(Math.random() * 300) + 120, // Entre 2 et 7 minutes
          feedback_provided: `Feedback pour exercice ${i + 1}`
        });
      }
    }

    // Insérer l'historique des exercices
    if (exerciseHistory.length > 0) {
      const { error: exerciseError } = await supabase
        .from('prepa_cds_exercise_history')
        .insert(exerciseHistory);

      if (exerciseError) {
        console.error('❌ Erreur création historique exercices:', exerciseError);
      } else {
        console.log('✅ Historique exercices créé:', exerciseHistory.length);
      }
    }

    // Insérer les logs de progression
    if (progressLogs.length > 0) {
      const { error: progressError } = await supabase
        .from('prepa_cds_progress_logs')
        .insert(progressLogs);

      if (progressError) {
        console.error('❌ Erreur création logs progression:', progressError);
      } else {
        console.log('✅ Logs de progression créés:', progressLogs.length);
      }
    }

    toast.success('Données de test créées !', {
      description: `${testSessions.length} sessions avec exercices et progressions`
    });

    logger.info('Données de test créées avec succès', { 
      sessions: testSessions.length,
      exercises: exerciseHistory.length,
      progressLogs: progressLogs.length
    }, 'createTestTrainingData');

    return true;

  } catch (error) {
    console.error('❌ Erreur création données test:', error);
    toast.error('Erreur lors de la création des données de test');
    logger.error('Échec création données test', error, 'createTestTrainingData');
    return false;
  }
};