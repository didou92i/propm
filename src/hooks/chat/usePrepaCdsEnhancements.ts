import { useState, useCallback } from 'react';
import { UserLevel, TrainingType, StudyDomain } from '@/components/chat/PrepaCdsControls';

interface PrepaCdsConfiguration {
  level: UserLevel;
  domain: StudyDomain;
  trainingType: TrainingType | null;
  sessionActive: boolean;
  currentStep: number;
  totalSteps: number;
}

interface UserProgress {
  domain: StudyDomain;
  level: UserLevel;
  correctAnswers: number;
  totalQuestions: number;
  lastSessionDate: string;
  weakAreas: string[];
  strengths: string[];
}

interface TrainingSession {
  type: TrainingType;
  startTime: Date;
  documents?: string[];
  currentDocumentIndex: number;
  userResponses: string[];
  evaluations: string[];
}

export function usePrepaCdsEnhancements() {
  const [configuration, setConfiguration] = useState<PrepaCdsConfiguration>({
    level: 'intermediaire',
    domain: 'droit_public',
    trainingType: null,
    sessionActive: false,
    currentStep: 0,
    totalSteps: 0
  });

  const [userProgress, setUserProgress] = useState<UserProgress>({
    domain: 'droit_public',
    level: 'intermediaire',
    correctAnswers: 0,
    totalQuestions: 0,
    lastSessionDate: new Date().toISOString(),
    weakAreas: [],
    strengths: []
  });

  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const updateLevel = useCallback((level: UserLevel) => {
    setConfiguration(prev => ({ ...prev, level }));
    setUserProgress(prev => ({ ...prev, level }));
  }, []);

  const updateDomain = useCallback((domain: StudyDomain) => {
    setConfiguration(prev => ({ ...prev, domain }));
    setUserProgress(prev => ({ ...prev, domain }));
  }, []);

  const selectTrainingType = useCallback((trainingType: TrainingType) => {
    setConfiguration(prev => ({ ...prev, trainingType }));
  }, []);

  const startSession = useCallback(() => {
    if (!configuration.trainingType) return;

    const session: TrainingSession = {
      type: configuration.trainingType,
      startTime: new Date(),
      currentDocumentIndex: 0,
      userResponses: [],
      evaluations: []
    };

    setCurrentSession(session);
    setConfiguration(prev => ({ 
      ...prev, 
      sessionActive: true, 
      currentStep: 1,
      totalSteps: getSessionStepsCount(configuration.trainingType)
    }));
  }, [configuration.trainingType]);

  const endSession = useCallback(() => {
    setConfiguration(prev => ({ ...prev, sessionActive: false, currentStep: 0 }));
    setCurrentSession(null);
  }, []);

  const nextStep = useCallback(() => {
    setConfiguration(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps)
    }));
  }, []);

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

    return enrichedPrompt;
  }, [configuration, userProgress]);

  const generateQuestion = useCallback(async (questionType: 'qcm' | 'vrai_faux' | 'ouverte' = 'qcm'): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      const questionConfig = {
        type: questionType,
        level: configuration.level,
        domain: configuration.domain,
        avoidTopics: userProgress.strengths.slice(0, 3) // Éviter les sujets maîtrisés
      };

      // Simulation de génération de question
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generateQuestionContent(questionConfig);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [configuration, userProgress]);

  const correctAnswer = useCallback(async (userAnswer: string, correctAnswer: string): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      // Simulation d'analyse et correction
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const isCorrect = userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
      
      // Mettre à jour les statistiques
      setUserProgress(prev => ({
        ...prev,
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        lastSessionDate: new Date().toISOString()
      }));

      return generateFeedback(userAnswer, correctAnswer, isCorrect, configuration.level);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [configuration.level]);

  const generateCaseStudy = useCallback(async (): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return generateCaseStudyContent(configuration.domain, configuration.level);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [configuration]);

  const generateRevisionPlan = useCallback(async (duration: number = 30): Promise<string> => {
    setIsGeneratingContent(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return generatePersonalizedPlan(configuration.level, configuration.domain, userProgress, duration);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [configuration, userProgress]);

  const evaluateProgress = useCallback((): string => {
    const { correctAnswers, totalQuestions, weakAreas, strengths } = userProgress;
    const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    let evaluation = `**ANALYSE DE VOTRE PROGRESSION**\n\n`;
    evaluation += `Taux de réussite global: ${successRate.toFixed(1)}%\n`;
    evaluation += `Questions traitées: ${totalQuestions}\n`;
    evaluation += `Réponses correctes: ${correctAnswers}\n\n`;
    
    if (successRate >= 80) {
      evaluation += `**Excellent travail !** Vous maîtrisez bien le niveau ${configuration.level}.\n`;
    } else if (successRate >= 60) {
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
    const resources = getResourcesByDomainAndTopic(configuration.domain, topic, configuration.level);
    return resources;
  }, [configuration]);

  return {
    // Configuration
    configuration,
    updateLevel,
    updateDomain,
    selectTrainingType,
    
    // Session management
    currentSession,
    startSession,
    endSession,
    nextStep,
    
    // Progress tracking
    userProgress,
    evaluateProgress,
    
    // Content generation
    enrichPrompt,
    generateQuestion,
    correctAnswer,
    generateCaseStudy,
    generateRevisionPlan,
    suggestResources,
    
    // State
    isGeneratingContent
  };
}

// Helper functions
function getSessionStepsCount(trainingType: TrainingType): number {
  const stepCounts: Record<TrainingType, number> = {
    analyse_documents: 5,
    questionnaire_droit: 10,
    management_redaction: 3,
    entrainement_mixte: 8,
    evaluation_connaissances: 10,
    vrai_faux: 15,
    evaluation_note_service: 2
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
    procedures: 'Protocoles opérationnels, chaîne de commandement',
    redaction: 'Notes de service, rapports, correspondance officielle',
    culture_generale: 'Actualités sécuritaires, évolutions réglementaires'
  };
  return instructions[domain];
}

function getTrainingTypeInstructions(trainingType: TrainingType): string {
  const instructions: Record<TrainingType, string> = {
    analyse_documents: 'Documents séquentiels, synthèse obligatoire, méthodologie pas à pas',
    questionnaire_droit: 'Questions ciblées droit, références précises',
    management_redaction: 'Cas managériaux, rédaction professionnelle',
    entrainement_mixte: 'Alternance documents/questions, progression logique',
    evaluation_connaissances: '10 questions variées, feedback détaillé',
    vrai_faux: '15 affirmations, explications systématiques',
    evaluation_note_service: 'Document administratif, analyse critique'
  };
  return instructions[trainingType];
}

function generateQuestionContent(config: any): string {
  // Simulation de génération de contenu de question
  return `Question générée pour le niveau ${config.level} en ${config.domain}...`;
}

function generateFeedback(userAnswer: string, correctAnswer: string, isCorrect: boolean, level: UserLevel): string {
  let feedback = `**ANALYSE DE VOTRE RÉPONSE**\n\n`;
  
  if (isCorrect) {
    feedback += `✅ **Réponse correcte !**\n`;
    feedback += `Votre analyse démontre une bonne compréhension du sujet.\n\n`;
  } else {
    feedback += `❌ **Réponse à améliorer**\n`;
    feedback += `Votre raisonnement contient quelques lacunes.\n\n`;
  }
  
  feedback += `**Points observés dans votre réponse:**\n`;
  feedback += `- Structure de la réponse: ${userAnswer.length > 50 ? 'Développée' : 'Concise'}\n`;
  feedback += `- Vocabulaire juridique: ${userAnswer.includes('article') || userAnswer.includes('code') ? 'Approprié' : 'À améliorer'}\n\n`;
  
  feedback += `**CONCLUSION**\n`;
  feedback += `${isCorrect ? 'Continuez sur cette voie !' : 'Révisez les concepts de base avant de poursuivre.'}\n`;
  
  return feedback;
}

function generateCaseStudyContent(domain: StudyDomain, level: UserLevel): string {
  return `Cas pratique généré pour ${domain} niveau ${level}...`;
}

function generatePersonalizedPlan(level: UserLevel, domain: StudyDomain, progress: UserProgress, duration: number): string {
  return `Plan de révision personnalisé sur ${duration} jours pour ${domain} niveau ${level}...`;
}

function getResourcesByDomainAndTopic(domain: StudyDomain, topic: string, level: UserLevel): string[] {
  // Simulation de recommandations de ressources
  return [
    `Article spécialisé: ${topic} en ${domain}`,
    `Fiche de révision niveau ${level}`,
    `Cas pratiques ${domain}`,
    `Jurisprudence récente ${topic}`
  ];
}