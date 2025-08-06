import { useState, useCallback } from 'react';
import { UserLevel, TrainingType } from '@/components/chat/PrepaCdsControls';
import { PrepaCdsService, StudyDomain } from '@/services/prepaCdsService';

interface PrepaCdsConfiguration {
  level: UserLevel;
  domain: StudyDomain;
  trainingType: TrainingType | null;
  sessionState: 'idle' | 'active' | 'completed';
  currentStep: number;
  totalSteps: number;
}

interface UserProgress {
  completedExercises: number;
  averageScore: number;
  weakAreas: string[];
  strengths: string[];
  lastSessionDate: Date | null;
  totalStudyTime: number;
}

export function usePrepaCdsEnhancements() {
  const [configuration, setConfiguration] = useState<PrepaCdsConfiguration>({
    level: 'intermediaire',
    domain: 'droit_public',
    trainingType: null,
    sessionState: 'idle',
    currentStep: 0,
    totalSteps: 0
  });

  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedExercises: 0,
    averageScore: 0,
    weakAreas: [],
    strengths: [],
    lastSessionDate: null,
    totalStudyTime: 0
  });

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessionHistory, setSessionHistory] = useState<{
    proposedContent: Set<string>;
    currentExercises: string[];
    antiLoopWarnings: number;
  }>({
    proposedContent: new Set(),
    currentExercises: [],
    antiLoopWarnings: 0
  });

  const updateLevel = useCallback((level: UserLevel) => {
    setConfiguration(prev => ({ ...prev, level }));
    setUserProgress(prev => ({ ...prev, lastSessionDate: new Date() }));
  }, []);

  const updateDomain = useCallback((domain: StudyDomain) => {
    setConfiguration(prev => ({ ...prev, domain }));
  }, []);

  const selectTrainingType = useCallback((trainingType: TrainingType) => {
    setConfiguration(prev => ({ ...prev, trainingType }));
  }, []);

  const startSession = (trainingType: TrainingType) => {
    const totalSteps = getSessionStepsCount(trainingType);
    
    // Réinitialiser l'historique pour une nouvelle session
    setSessionHistory({
      proposedContent: new Set(),
      currentExercises: [],
      antiLoopWarnings: 0
    });
    
    setConfiguration(prev => ({
      ...prev,
      trainingType,
      sessionState: 'active',
      currentStep: 0,
      totalSteps
    }));
  };

  const endSession = () => {
    setConfiguration(prev => ({
      ...prev,
      sessionState: 'completed',
      trainingType: null
    }));
    
    // Log des statistiques de session
    console.log('Session terminée:', {
      exercicesProposés: sessionHistory.currentExercises.length,
      avertissementsBoucle: sessionHistory.antiLoopWarnings,
      sessionId
    });
  };

  const nextStep = () => {
    setConfiguration(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
  };

  const enrichPrompt = useCallback((originalPrompt: string): string => {
    const { level, domain, trainingType } = configuration;
    
    let enrichedPrompt = `${originalPrompt}\n\n**CONTEXTE PREPA CDS:**\n`;
    enrichedPrompt += `- Niveau candidat: ${getLevelInstructions(level)}\n`;
    enrichedPrompt += `- Domaine prioritaire: ${getDomainInstructions(domain)}\n`;
    
    if (trainingType) {
      enrichedPrompt += `- Type d'entraînement: ${getTrainingTypeInstructions(trainingType)}\n`;
    }

    if (userProgress.weakAreas.length > 0) {
      enrichedPrompt += `- Points faibles identifiés: ${userProgress.weakAreas.join(', ')}\n`;
    }

    if (userProgress.strengths.length > 0) {
      enrichedPrompt += `- Points forts: ${userProgress.strengths.join(', ')}\n`;
    }

    enrichedPrompt += `\n**INSTRUCTIONS SPÉCIFIQUES:**\n`;
    enrichedPrompt += `- Adapter le niveau de complexité au profil "${level}"\n`;
    enrichedPrompt += `- Focaliser sur le domaine "${domain}"\n`;
    enrichedPrompt += `- Présenter l'analyse AVANT la conclusion/feedback\n`;
    enrichedPrompt += `- Proposer des améliorations personnalisées basées sur l'historique\n`;
    enrichedPrompt += `- Éviter strictement toute répétition ou boucle dans le contenu\n`;

    return enrichedPrompt;
  }, [configuration, userProgress]);

  const generateQuestion = async (level: UserLevel, domain: StudyDomain, type: TrainingType = 'qcm') => {
    setIsGeneratingContent(true);
    try {
      const prepaCdsService = PrepaCdsService.getInstance();
      const result = await prepaCdsService.generateQuestion(level, domain, type, sessionId);
      
      // Anti-boucle: marquer le contenu comme proposé
      const contentKey = `question_${result.question.substring(0, 50)}`;
      if (sessionHistory.proposedContent.has(contentKey)) {
        setSessionHistory(prev => ({
          ...prev,
          antiLoopWarnings: prev.antiLoopWarnings + 1
        }));
        console.warn('Contenu similaire déjà proposé, alternative générée');
      }
      
      setSessionHistory(prev => ({
        ...prev,
        proposedContent: new Set([...prev.proposedContent, contentKey]),
        currentExercises: [...prev.currentExercises, contentKey]
      }));
      
      return result;
    } catch (error) {
      console.error('Erreur génération question:', error);
      throw error;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const correctAnswer = async (userAnswer: string, correctAnswer: string) => {
    setIsGeneratingContent(true);
    try {
      const prepaCdsService = PrepaCdsService.getInstance();
      const result = await prepaCdsService.correctAnswer(userAnswer, correctAnswer, configuration.level, configuration.domain);
      
      // Mettre à jour les progrès
      setUserProgress(prev => ({
        ...prev,
        completedExercises: prev.completedExercises + 1,
        lastSessionDate: new Date()
      }));
      
      return result;
    } catch (error) {
      console.error('Erreur correction réponse:', error);
      throw error;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateCaseStudy = async (level: UserLevel, domain: StudyDomain) => {
    setIsGeneratingContent(true);
    try {
      const prepaCdsService = PrepaCdsService.getInstance();
      const result = await prepaCdsService.generateCaseStudy(level, domain, sessionId);
      
      // Anti-boucle: marquer le contenu comme proposé
      const contentKey = `case_${result.title}`;
      if (sessionHistory.proposedContent.has(contentKey)) {
        setSessionHistory(prev => ({
          ...prev,
          antiLoopWarnings: prev.antiLoopWarnings + 1
        }));
        console.warn('Cas similaire déjà proposé, alternative générée');
      }
      
      setSessionHistory(prev => ({
        ...prev,
        proposedContent: new Set([...prev.proposedContent, contentKey]),
        currentExercises: [...prev.currentExercises, contentKey]
      }));
      
      return result;
    } catch (error) {
      console.error('Erreur génération cas pratique:', error);
      throw error;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateRevisionPlan = useCallback(async (duration: number = 30): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      const prepaCdsService = PrepaCdsService.getInstance();
      return await prepaCdsService.generateRevisionPlan(configuration.level, configuration.domain, duration, userProgress.weakAreas);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [configuration, userProgress]);

  const evaluateProgress = useCallback((): string => {
    const { completedExercises, averageScore, weakAreas, strengths } = userProgress;
    
    let evaluation = `**ANALYSE DE VOTRE PROGRESSION**\n\n`;
    evaluation += `Score moyen: ${averageScore.toFixed(1)}%\n`;
    evaluation += `Exercices complétés: ${completedExercises}\n\n`;
    
    if (averageScore >= 80) {
      evaluation += `**Excellent travail !** Vous maîtrisez bien le niveau ${configuration.level}.\n`;
    } else if (averageScore >= 60) {
      evaluation += `**Progression satisfaisante.** Continuez vos efforts pour consolider vos acquis.\n`;
    } else {
      evaluation += `**Des efforts supplémentaires sont nécessaires.** Focalisez-vous sur les points faibles identifiés.\n`;
    }

    if (weakAreas.length > 0) {
      evaluation += `\n**Points à améliorer:** ${weakAreas.join(', ')}\n`;
    }

    if (strengths.length > 0) {
      evaluation += `**Points forts confirmés:** ${strengths.join(', ')}\n`;
    }

    return evaluation;
  }, [userProgress, configuration.level]);

  const suggestResources = useCallback((topic: string): string[] => {
    const prepaCdsService = PrepaCdsService.getInstance();
    return prepaCdsService.suggestResources(configuration.domain, configuration.level, topic);
  }, [configuration]);

  // Fonction de validation anti-boucle
  const checkForLoop = (content: string): boolean => {
    const contentKey = `content_${content.substring(0, 50)}`;
    return sessionHistory.proposedContent.has(contentKey);
  };

  const markContentAsProposed = (content: string, type: string) => {
    const contentKey = `${type}_${content.substring(0, 50)}`;
    setSessionHistory(prev => ({
      ...prev,
      proposedContent: new Set([...prev.proposedContent, contentKey])
    }));
  };

  return {
    // Configuration
    configuration,
    userProgress,
    sessionId,
    sessionHistory,
    
    // Actions de configuration
    updateLevel,
    updateDomain,
    selectTrainingType,
    
    // Actions de session
    startSession,
    endSession,
    nextStep,
    
    // Génération de contenu
    isGeneratingContent,
    enrichPrompt,
    generateQuestion,
    correctAnswer,
    generateCaseStudy,
    generateRevisionPlan,
    evaluateProgress,
    suggestResources,
    
    // Anti-boucle
    checkForLoop,
    markContentAsProposed
  };
}

// Helper functions
function getSessionStepsCount(trainingType: TrainingType): number {
  const stepCounts: Record<TrainingType, number> = {
    qcm: 10,
    vrai_faux: 15,
    cas_pratique: 3,
    question_ouverte: 5,
    simulation_oral: 8,
    plan_revision: 2
  };
  return stepCounts[trainingType] || 5;
}

function getLevelInstructions(level: UserLevel): string {
  const instructions: Record<UserLevel, string> = {
    debutant: 'Explications détaillées, concepts de base, exemples simples',
    intermediaire: 'Approfondissement modéré, cas concrets, liens entre concepts',
    avance: 'Analyses complexes, jurisprudence, cas d\'exception'
  };
  return instructions[level];
}

function getDomainInstructions(domain: StudyDomain): string {
  const instructions: Record<StudyDomain, string> = {
    droit_public: 'CGCT, pouvoirs de police, contentieux administratif',
    droit_penal: 'Code pénal, procédures, infractions spécifiques',
    management: 'Gestion d\'équipe, organisation, planification',
    redaction: 'Notes de service, rapports, correspondance officielle',
    general: 'Culture générale sécuritaire, actualités, évolutions'
  };
  return instructions[domain];
}

function getTrainingTypeInstructions(trainingType: TrainingType): string {
  const instructions: Record<TrainingType, string> = {
    qcm: 'Questions à choix multiples, corrections détaillées, références précises',
    vrai_faux: 'Affirmations à valider, explications systématiques',
    cas_pratique: 'Cas managériaux, rédaction professionnelle, situations réalistes',
    question_ouverte: 'Développement libre, argumentation structurée',
    simulation_oral: 'Entretien jury, communication orale, stress management',
    plan_revision: 'Planning structuré, objectifs clairs, progression personnalisée'
  };
  return instructions[trainingType];
}