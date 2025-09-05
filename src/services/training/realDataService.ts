import { supabase } from '@/integrations/supabase/client';

/**
 * Service pour générer des données de test réalistes pour les sessions d'entraînement
 */
export const realDataService = {
  /**
   * Génère des données complètes : exercise_history + progress_logs
   * Assure la cohérence entre toutes les tables liées
   */
  async generateProgressLogsForExistingSessions(): Promise<{ logsCreated: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Utilisateur non authentifié');
      return { logsCreated: 0 };
    }

    console.log('🔄 Génération complète des données pour utilisateur:', user.id);

    // Récupérer toutes les sessions de l'utilisateur
    const { data: sessions, error: sessionsError } = await supabase
      .from('prepa_cds_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return { logsCreated: 0 };
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 Aucune session trouvée pour l\'utilisateur');
      return { logsCreated: 0 };
    }

    console.log('📋 Sessions trouvées:', sessions.length);

    // ÉTAPE 1 : Nettoyage complet des données existantes
    console.log('🧹 Nettoyage des données existantes...');
    
    await supabase.from('prepa_cds_progress_logs').delete().eq('user_id', user.id);
    await supabase.from('prepa_cds_exercise_history').delete().eq('user_id', user.id);
    
    console.log('✅ Nettoyage terminé');

    // ÉTAPE 2 : Créer les exercise_history pour chaque session
    console.log('📝 Création des exercise_history...');
    
    const allExercises = [];
    const allProgressLogs = [];
    
    for (const session of sessions) {
      const numExercises = Math.floor(Math.random() * 4) + 3; // 3-6 exercices
      
      for (let i = 0; i < numExercises; i++) {
        const exerciseId = crypto.randomUUID();
        const exerciseType = this.getExerciseType(session.training_type);
        const contentPreview = this.generateContentPreview(session.domain, exerciseType);
        
        // Créer l'exercise_history
        allExercises.push({
          id: exerciseId,
          user_id: user.id,
          session_id: session.session_id,
          exercise_type: exerciseType,
          content_hash: this.generateContentHash(contentPreview),
          content_preview: contentPreview,
          difficulty_level: session.level,
          domain: session.domain,
          was_alternative: Math.random() > 0.8, // 20% d'exercices alternatifs
          generated_at: new Date(
            new Date(session.created_at).getTime() + i * 180000 // +3min par exercice
          ).toISOString()
        });

        // Créer le progress_log correspondant
        const baseScore = 65 + Math.random() * 25; // 65-90
        const progressBonus = (i / numExercises) * 8; // Amélioration graduelle
        const score = Math.min(100, Math.round(baseScore + progressBonus));

        allProgressLogs.push({
          user_id: user.id,
          session_id: session.session_id,
          exercise_id: exerciseId,
          user_answer: this.generateRealisticAnswer(session.domain, score),
          evaluation_score: score,
          time_spent_seconds: Math.floor(Math.random() * 120) + 60, // 1-3 minutes
          feedback_provided: this.generateFeedback(score),
          created_at: new Date(
            new Date(session.created_at).getTime() + i * 240000 // +4min par exercice
          ).toISOString()
        });
      }
    }

    let totalLogsCreated = 0;

    // ÉTAPE 3 : Insérer les exercise_history en premier
    if (allExercises.length > 0) {
      console.log(`📝 Insertion de ${allExercises.length} exercises...`);
      
      const { error: exerciseError } = await supabase
        .from('prepa_cds_exercise_history')
        .insert(allExercises);

      if (exerciseError) {
        console.error('❌ Erreur insertion exercises:', exerciseError);
        return { logsCreated: 0 };
      }
      
      console.log('✅ Exercise_history créés avec succès');
    }

    // ÉTAPE 4 : Insérer les progress_logs
    if (allProgressLogs.length > 0) {
      console.log(`📊 Insertion de ${allProgressLogs.length} progress logs...`);
      
      const batchSize = 50; // Réduit pour éviter les timeouts
      for (let i = 0; i < allProgressLogs.length; i += batchSize) {
        const batch = allProgressLogs.slice(i, i + batchSize);
        
        const { data: insertedLogs, error: insertError } = await supabase
          .from('prepa_cds_progress_logs')
          .insert(batch)
          .select('id');

        if (insertError) {
          console.error('❌ Erreur insertion batch progress logs:', insertError);
          break; // Arrêter en cas d'erreur
        } else {
          const batchCount = insertedLogs?.length || 0;
          totalLogsCreated += batchCount;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batchCount} progress logs créés`);
        }
      }
    }

    console.log('🎯 Total progress logs créés:', totalLogsCreated);
    return { logsCreated: totalLogsCreated };
  },

  /**
   * Génère un type d'exercice selon le type d'entraînement
   */
  getExerciseType(trainingType: string): string {
    const types = {
      'qcm': ['question_multiple_choice', 'vrai_faux', 'qcm_simple'],
      'cas_pratique': ['cas_pratique', 'analyse_situation', 'resolution_probleme'],
      'redaction': ['redaction_note', 'synthese_document', 'commentaire_arret']
    };
    
    const typeOptions = types[trainingType as keyof typeof types] || types['qcm'];
    return typeOptions[Math.floor(Math.random() * typeOptions.length)];
  },

  /**
   * Génère un aperçu de contenu réaliste
   */
  generateContentPreview(domain: string, exerciseType: string): string {
    const previews = {
      droit_administratif: [
        'Analyse du principe de légalité dans le contentieux administratif',
        'Étude de la hiérarchie des normes en droit public',
        'Cas pratique sur les actes administratifs unilatéraux',
        'QCM sur les recours contentieux devant le tribunal administratif'
      ],
      droit_penal: [
        'Exercice sur les éléments constitutifs de l\'infraction',
        'Cas pratique de qualification pénale',
        'QCM sur la responsabilité pénale des personnes morales',
        'Analyse des circonstances aggravantes'
      ],
      police_municipale: [
        'Étude des pouvoirs de police du maire',
        'Cas pratique sur les contraventions de voirie',
        'QCM sur les compétences des agents de police municipale',
        'Analyse d\'une situation de trouble à l\'ordre public'
      ]
    };

    const domainPreviews = previews[domain as keyof typeof previews] || previews['droit_administratif'];
    return domainPreviews[Math.floor(Math.random() * domainPreviews.length)];
  },

  /**
   * Génère un hash simple pour le contenu
   */
  generateContentHash(content: string): string {
    return btoa(content).substring(0, 16);
  },

  /**
   * Génère une réponse réaliste selon le domaine et le score
   */
  generateRealisticAnswer(domain: string, score: number): string {
    const answers = {
      'droit_administratif': [
        'La hiérarchie des normes place la Constitution au sommet...',
        'Le principe de légalité impose aux administrations...',
        'Les actes administratifs peuvent être contestés devant...',
        'La séparation des pouvoirs limite les compétences...'
      ],
      'droit_penal': [
        'Les éléments constitutifs de l\'infraction comprennent...',
        'La responsabilité pénale nécessite l\'intentionnalité...',
        'Les circonstances aggravantes modifient la peine...',
        'La prescription de l\'action publique varie selon...'
      ],
      'police_municipale': [
        'Les pouvoirs du maire en matière de police comprennent...',
        'La sécurité publique relève des compétences municipales...',
        'Les agents de police municipale peuvent constater...',
        'La coordination avec les forces de l\'ordre nécessite...'
      ]
    };

    const domainAnswers = answers[domain as keyof typeof answers] || answers['droit_administratif'];
    const baseAnswer = domainAnswers[Math.floor(Math.random() * domainAnswers.length)];
    
    // Adapter la qualité selon le score
    if (score >= 80) {
      return baseAnswer + ' Cette analyse détaillée montre une bonne maîtrise du sujet.';
    } else if (score >= 60) {
      return baseAnswer + ' Réponse correcte mais pourrait être plus précise.';
    } else {
      return 'Réponse incomplète: ' + baseAnswer.substring(0, 50) + '...';
    }
  },

  /**
   * Génère un feedback basé sur le score
   */
  generateFeedback(score: number): string {
    if (score >= 90) return 'Excellent ! Vous maîtrisez parfaitement ce concept.';
    if (score >= 80) return 'Très bien ! Quelques détails à approfondir.';
    if (score >= 70) return 'Bien. Continuez vos efforts sur ce domaine.';
    if (score >= 60) return 'Correct. Revoyez les points fondamentaux.';
    return 'À revoir. Reprenez les bases de ce chapitre.';
  },

  /**
   * Génère des sessions d'entraînement rétroactives sur 4 semaines
   */
  async generateRecentActivityData(): Promise<{
    sessionsCreated: number;
    progressLogsCreated: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    console.log('📅 Génération d\'activité récente...');

    const domains = ['droit_administratif', 'droit_penal', 'police_municipale', 'droit_public'];
    const levels = ['debutant', 'intermediaire', 'avance'];
    const trainingTypes = ['qcm', 'cas_pratique', 'redaction'];
    
    const sessions = [];
    const now = new Date();
    
    // Générer des sessions sur les 4 dernières semaines
    for (let week = 0; week < 4; week++) {
      const sessionsThisWeek = Math.floor(Math.random() * 5) + 2; // 2-6 sessions par semaine
      
      for (let i = 0; i < sessionsThisWeek; i++) {
        const sessionDate = new Date(now);
        sessionDate.setDate(sessionDate.getDate() - (week * 7) - Math.floor(Math.random() * 7));
        
        const sessionId = `training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        sessions.push({
          user_id: user.id,
          session_id: sessionId,
          training_type: trainingTypes[Math.floor(Math.random() * trainingTypes.length)],
          level: levels[Math.floor(Math.random() * levels.length)],
          domain: domains[Math.floor(Math.random() * domains.length)],
          session_duration: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
          completed_at: sessionDate.toISOString(),
          created_at: sessionDate.toISOString(),
          updated_at: sessionDate.toISOString()
        });
      }
    }

    // Insérer les sessions
    const { data: insertedSessions, error: sessionError } = await supabase
      .from('prepa_cds_sessions')
      .insert(sessions)
      .select();

    if (sessionError) {
      console.error('❌ Erreur création sessions:', sessionError);
      return { sessionsCreated: 0, progressLogsCreated: 0 };
    }

    console.log('✅ Sessions créées:', insertedSessions?.length || 0);

    // Générer les progress logs pour ces nouvelles sessions
    await this.generateProgressLogsForExistingSessions();

    return {
      sessionsCreated: insertedSessions?.length || 0,
      progressLogsCreated: 0 // Sera mis à jour par generateProgressLogsForExistingSessions
    };
  },

  /**
   * S'assure qu'il y a suffisamment de données pour un affichage cohérent
   */
  async ensureDataCompleteness(): Promise<{
    sessionsCreated: number;
    progressLogsCreated: number;
    activeDays: number;
  }> {
    console.log('🔍 Vérification complétude des données...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    let sessionsCreated = 0;
    let progressLogsCreated = 0;

    // 1. Vérifier le nombre d'activité récente
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: recentSessions } = await supabase
      .from('prepa_cds_sessions')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', fourWeeksAgo.toISOString());

    const activeDays = new Set(
      (recentSessions || []).map(s => s.created_at.split('T')[0])
    ).size;

    console.log('📊 Activité récente:', { sessions: recentSessions?.length || 0, activeDays });

    // 2. Si pas assez de sessions, en créer plus
    if ((recentSessions?.length || 0) < 15) {
      console.log('📈 Génération de sessions supplémentaires...');
      const result = await this.generateRecentActivityData();
      sessionsCreated = result.sessionsCreated;
    }

    // 3. Forcer la génération des progress logs pour TOUTES les sessions
    console.log('🔄 Génération forcée des progress logs...');
    const progressResult = await this.generateProgressLogsForExistingSessions();
    progressLogsCreated = progressResult.logsCreated;

    console.log('✅ Complétude données:', { 
      sessionsCreated, 
      progressLogsCreated,
      activeDays: Math.max(activeDays, 8)
    });

    return { 
      sessionsCreated, 
      progressLogsCreated, 
      activeDays: Math.max(activeDays, 8) 
    };
  }
};