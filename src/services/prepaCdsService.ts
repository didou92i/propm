import { supabase } from '@/integrations/supabase/client';

export type UserLevel = 'debutant' | 'intermediaire' | 'avance';
export type StudyDomain = 'droit_public' | 'droit_penal' | 'management' | 'redaction' | 'general';
export type TrainingType = 'analyse_documents' | 'questionnaire_droit' | 'management_redaction' | 'entrainement_mixte' | 'evaluation_connaissances' | 'vrai_faux' | 'evaluation_note_service';

export interface SessionHistory {
  sessionId: string;
  exercisesProposed: string[];
  questionsAsked: string[];
  casesStudied: string[];
  documentsAnalyzed: string[];
  lastActivity: Date;
}

export interface ExerciseMemory {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  hash: string;
}

interface PrepaCdsRequest {
  type: 'question' | 'case_study' | 'evaluation' | 'revision_plan';
  level: UserLevel;
  domain: StudyDomain;
  trainingType?: TrainingType;
  context?: string;
}

interface PrepaCdsResponse {
  content: string;
  references?: LegalReference[];
  recommendations?: string[];
  nextSteps?: string[];
  evaluation?: TrainingEvaluation;
}

interface LegalReference {
  article: string;
  code: string;
  content: string;
  url?: string;
}

interface TrainingEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  nextLevelRecommendation?: UserLevel;
}

export interface GeneratedQuestion {
  type: 'qcm' | 'vrai_faux' | 'ouverte';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  references: LegalReference[];
}

export interface GeneratedCaseStudy {
  title: string;
  situation: string;
  context: string;
  questions: string[];
  expectedElements: string[];
  difficulty: UserLevel;
  estimatedTime: number;
}

export class PrepaCdsService {
  private static instance: PrepaCdsService;
  private sessionHistory: Map<string, SessionHistory> = new Map();
  private exerciseMemory: Map<string, ExerciseMemory[]> = new Map();

  public static getInstance(): PrepaCdsService {
    if (!PrepaCdsService.instance) {
      PrepaCdsService.instance = new PrepaCdsService();
    }
    return PrepaCdsService.instance;
  }

  // Système anti-boucle
  private generateContentHash(content: string): string {
    return btoa(content).substring(0, 10);
  }

  private isContentAlreadyProposed(sessionId: string, content: string, type: string): boolean {
    const exercises = this.exerciseMemory.get(sessionId) || [];
    const hash = this.generateContentHash(content);
    
    return exercises.some(ex => 
      ex.hash === hash && 
      ex.type === type && 
      Date.now() - ex.timestamp.getTime() < 24 * 60 * 60 * 1000 // 24h window
    );
  }

  private recordExercise(sessionId: string, content: string, type: string): void {
    const exercises = this.exerciseMemory.get(sessionId) || [];
    const newExercise: ExerciseMemory = {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: new Date(),
      hash: this.generateContentHash(content)
    };
    
    exercises.push(newExercise);
    
    // Garder seulement les 50 derniers exercices
    if (exercises.length > 50) {
      exercises.splice(0, exercises.length - 50);
    }
    
    this.exerciseMemory.set(sessionId, exercises);
  }

  private getSessionHistory(sessionId: string): SessionHistory {
    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, {
        sessionId,
        exercisesProposed: [],
        questionsAsked: [],
        casesStudied: [],
        documentsAnalyzed: [],
        lastActivity: new Date()
      });
    }
    return this.sessionHistory.get(sessionId)!;
  }

  private updateSessionHistory(sessionId: string, type: 'exercise' | 'question' | 'case' | 'document', id: string): void {
    const history = this.getSessionHistory(sessionId);
    
    switch(type) {
      case 'exercise':
        if (!history.exercisesProposed.includes(id)) {
          history.exercisesProposed.push(id);
        }
        break;
      case 'question':
        if (!history.questionsAsked.includes(id)) {
          history.questionsAsked.push(id);
        }
        break;
      case 'case':
        if (!history.casesStudied.includes(id)) {
          history.casesStudied.push(id);
        }
        break;
      case 'document':
        if (!history.documentsAnalyzed.includes(id)) {
          history.documentsAnalyzed.push(id);
        }
        break;
    }
    
    history.lastActivity = new Date();
  }

  /**
   * Enrichit une requête utilisateur avec le contexte pédagogique approprié
   */
  enrichQuery(request: PrepaCdsRequest): string {
    let enrichedQuery = `PREPA CDS - ${request.type.toUpperCase()}\n\n`;
    
    enrichedQuery += `**PROFIL CANDIDAT:**\n`;
    enrichedQuery += `- Niveau: ${this.getLevelDescription(request.level)}\n`;
    enrichedQuery += `- Domaine prioritaire: ${this.getDomainDescription(request.domain)}\n`;
    
    if (request.trainingType) {
      enrichedQuery += `- Type d'entraînement: ${this.getTrainingTypeDescription(request.trainingType)}\n`;
    }
    
    enrichedQuery += `\n**INSTRUCTIONS PÉDAGOGIQUES:**\n`;
    enrichedQuery += this.getPedagogicalInstructions(request.level, request.domain, request.type);
    
    if (request.context) {
      enrichedQuery += `\n**CONTEXTE SPÉCIFIQUE:**\n${request.context}\n`;
    }
    
    return enrichedQuery;
  }

  /**
   * Génère une question d'entraînement adaptée au profil avec système anti-boucle
   */
  async generateQuestion(level: UserLevel, domain: StudyDomain, type: 'qcm' | 'vrai_faux' | 'ouverte' = 'qcm', sessionId?: string): Promise<GeneratedQuestion> {
    try {
      const history = sessionId ? this.getSessionHistory(sessionId) : null;
      const avoidRecentTopics = history?.questionsAsked || [];

      const { data, error } = await supabase.functions.invoke('generate-training-question', {
        body: { 
          level, 
          domain, 
          questionType: type,
          avoidRecentTopics,
          sessionId
        }
      });

      if (error) throw error;
      
      const question = this.formatGeneratedQuestion(data);
      
      // Vérifier les doublons
      if (sessionId && this.isContentAlreadyProposed(sessionId, question.question, 'question')) {
        // Générer une alternative
        const { data: altData, error: altError } = await supabase.functions.invoke('generate-training-question', {
          body: { 
            level, 
            domain, 
            questionType: type,
            avoidRecentTopics: [...avoidRecentTopics, question.question],
            forceAlternative: true,
            sessionId
          }
        });
        
        if (!altError) {
          const altQuestion = this.formatGeneratedQuestion(altData);
          this.recordExercise(sessionId, altQuestion.question, 'question');
          this.updateSessionHistory(sessionId, 'question', altQuestion.question);
          return altQuestion;
        }
      }
      
      if (sessionId) {
        this.recordExercise(sessionId, question.question, 'question');
        this.updateSessionHistory(sessionId, 'question', question.question);
      }
      
      return question;
    } catch (error) {
      console.error('Erreur génération question:', error);
      return this.getFallbackQuestion(level, domain, type);
    }
  }

  /**
   * Corrige et évalue une réponse utilisateur avec feedback structuré
   */
  async correctAnswer(userAnswer: string, expectedAnswer: string, level: UserLevel, domain: StudyDomain): Promise<TrainingEvaluation> {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-user-answer', {
        body: {
          userAnswer,
          expectedAnswer,
          level,
          domain,
          evaluationCriteria: this.getEvaluationCriteria(level, domain)
        }
      });

      if (error) throw error;
      
      return this.formatEvaluation(data);
    } catch (error) {
      console.error('Erreur correction réponse:', error);
      return this.getFallbackEvaluation(userAnswer, expectedAnswer);
    }
  }

  /**
   * Génère un cas pratique avec système anti-boucle
   */
  async generateCaseStudy(level: UserLevel, domain: StudyDomain, sessionId?: string): Promise<GeneratedCaseStudy> {
    try {
      const history = sessionId ? this.getSessionHistory(sessionId) : null;
      const avoidRecentCases = history?.casesStudied || [];

      const { data, error } = await supabase.functions.invoke('generate-case-study', {
        body: { 
          level, 
          domain,
          avoidRecentCases,
          sessionId
        }
      });

      if (error) throw error;
      
      const caseStudy = {
        title: data.title || 'Cas pratique',
        situation: data.situation || 'Situation à analyser',
        context: data.context || 'Contexte professionnel',
        questions: data.questions || ['Analysez la situation'],
        expectedElements: data.expectedElements || ['Éléments d\'analyse'],
        difficulty: level,
        estimatedTime: data.estimatedTime || 30
      };

      // Vérifier les doublons
      const caseContent = `${caseStudy.title} ${caseStudy.situation}`;
      if (sessionId && this.isContentAlreadyProposed(sessionId, caseContent, 'case')) {
        // Générer une alternative
        const { data: altData, error: altError } = await supabase.functions.invoke('generate-case-study', {
          body: { 
            level, 
            domain,
            avoidRecentCases: [...avoidRecentCases, caseStudy.title],
            forceAlternative: true,
            sessionId
          }
        });
        
        if (!altError) {
          const altCase = {
            title: altData.title || 'Cas pratique alternatif',
            situation: altData.situation || 'Situation alternative à analyser',
            context: altData.context || 'Contexte professionnel alternatif',
            questions: altData.questions || ['Analysez cette nouvelle situation'],
            expectedElements: altData.expectedElements || ['Nouveaux éléments d\'analyse'],
            difficulty: level,
            estimatedTime: altData.estimatedTime || 30
          };
          
          const altCaseContent = `${altCase.title} ${altCase.situation}`;
          this.recordExercise(sessionId, altCaseContent, 'case');
          this.updateSessionHistory(sessionId, 'case', altCase.title);
          return altCase;
        }
      }
      
      if (sessionId) {
        this.recordExercise(sessionId, caseContent, 'case');
        this.updateSessionHistory(sessionId, 'case', caseStudy.title);
      }
      
      return caseStudy;
    } catch (error) {
      console.error('Erreur génération cas pratique:', error);
      return this.getFallbackCaseStudy(level, domain);
    }
  }

  /**
   * Établit un plan de révision personnalisé
   */
  async generateRevisionPlan(level: UserLevel, domain: StudyDomain, duration: number = 30, weakAreas: string[] = []): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-revision-plan', {
        body: {
          level,
          domain,
          duration,
          weakAreas,
          studyTime: this.getRecommendedStudyTime(level),
          priorities: this.getDomainPriorities(domain)
        }
      });

      if (error) throw error;
      
      return this.formatRevisionPlan(data, duration);
    } catch (error) {
      console.error('Erreur génération plan révision:', error);
      return this.getFallbackRevisionPlan(level, domain, duration);
    }
  }

  /**
   * Évalue la progression d'un utilisateur
   */
  evaluateProgress(results: Array<{ correct: boolean; domain: StudyDomain; timestamp: Date }>): TrainingEvaluation {
    const totalQuestions = results.length;
    const correctAnswers = results.filter(r => r.correct).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    // Analyse par domaine
    const domainStats = this.analyzeDomainPerformance(results);
    
    // Identification des forces et faiblesses
    const strengths = domainStats.filter(d => d.score >= 75).map(d => d.domain);
    const weaknesses = domainStats.filter(d => d.score < 60).map(d => d.domain);
    
    // Suggestions d'amélioration
    const improvementSuggestions = this.generateImprovementSuggestions(weaknesses, score);
    
    // Recommandation de niveau
    const nextLevelRecommendation = this.getNextLevelRecommendation(score, strengths.length);
    
    return {
      score: Math.round(score),
      strengths,
      weaknesses,
      improvementSuggestions,
      nextLevelRecommendation
    };
  }

  /**
   * Recommande des ressources complémentaires
   */
  suggestResources(domain: StudyDomain, level: UserLevel, specificTopic?: string): string[] {
    const baseResources = this.getBaseResources(domain, level);
    const specificResources = specificTopic ? this.getTopicSpecificResources(domain, specificTopic) : [];
    
    return [...baseResources, ...specificResources];
  }

  /**
   * Génère une fiche de synthèse structurée
   */
  async generateSummarySheet(domain: StudyDomain, topic: string, level: UserLevel): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary-sheet', {
        body: {
          domain,
          topic,
          level,
          includeExamples: true,
          includeReferences: true
        }
      });

      if (error) throw error;
      
      return this.formatSummarySheet(data);
    } catch (error) {
      console.error('Erreur génération fiche synthèse:', error);
      return this.getFallbackSummarySheet(domain, topic);
    }
  }

  /**
   * Organise une simulation d'oral
   */
  async simulateOralExam(level: UserLevel, domain: StudyDomain): Promise<{ questions: string[]; evaluationGrid: string[] }> {
    const questions = await this.generateOralQuestions(level, domain);
    const evaluationGrid = this.getOralEvaluationGrid(level);
    
    return { questions, evaluationGrid };
  }

  // Méthodes d'assistance privées
  private getLevelDescription(level: UserLevel): string {
    const descriptions: Record<UserLevel, string> = {
      debutant: 'Candidat débutant - Bases à consolider, explications détaillées nécessaires',
      intermediaire: 'Candidat intermédiaire - Connaissances partielles, approfondissement requis',
      avance: 'Candidat avancé - Maîtrise confirmée, complexification et perfectionnement'
    };
    return descriptions[level];
  }

  private getDomainDescription(domain: StudyDomain): string {
    const descriptions: Record<StudyDomain, string> = {
      droit_public: 'Droit public territorial - CGCT, pouvoirs de police, contentieux',
      droit_penal: 'Droit pénal - Code pénal, procédures, infractions',
      management: 'Management et GRH - Gestion d\'équipe, organisation, planification',
      redaction: 'Rédaction administrative - Notes, rapports, correspondance',
      general: 'Culture générale sécuritaire - Actualités, évolutions'
    };
    return descriptions[domain];
  }

  private getTrainingTypeDescription(trainingType: TrainingType): string {
    const descriptions: Record<TrainingType, string> = {
      analyse_documents: 'Analyse documentaire - Synthèse méthodologique',
      questionnaire_droit: 'Questions juridiques - Vérification des connaissances',
      management_redaction: 'Management et rédaction - Cas pratiques de gestion',
      entrainement_mixte: 'Entraînement mixte - Documents et questions alternés',
      evaluation_connaissances: 'Évaluation globale - Test de connaissances',
      vrai_faux: 'Vrai/Faux - Vérification rapide des acquis',
      evaluation_note_service: 'Évaluation rédactionnelle - Analyse de documents administratifs'
    };
    return descriptions[trainingType];
  }

  private getPedagogicalInstructions(level: UserLevel, domain: StudyDomain, type: string): string {
    let instructions = '';
    
    // Instructions selon le niveau
    switch (level) {
      case 'debutant':
        instructions += '- Explications détaillées et progressives\n';
        instructions += '- Définitions des termes techniques\n';
        instructions += '- Exemples concrets et simplifiés\n';
        break;
      case 'intermediaire':
        instructions += '- Approfondissement des concepts\n';
        instructions += '- Liens entre les différentes notions\n';
        instructions += '- Cas pratiques représentatifs\n';
        break;
      case 'avance':
        instructions += '- Analyses complexes et nuancées\n';
        instructions += '- Jurisprudence et cas d\'exception\n';
        instructions += '- Réflexion critique et prospective\n';
        break;
    }
    
    return instructions;
  }

  // Formatteurs, fallbacks, etc.
  
  private formatGeneratedQuestion(data: any): GeneratedQuestion {
    return {
      type: data.type || 'qcm',
      question: data.question || 'Question de test',
      options: data.options || [],
      correctAnswer: data.correctAnswer || '',
      explanation: data.explanation || 'Explication à venir',
      references: data.references || []
    };
  }

  private getFallbackQuestion(level: UserLevel, domain: StudyDomain, type: string): GeneratedQuestion {
    return {
      type: type as any,
      question: `Question ${type} pour ${domain} niveau ${level}`,
      options: type === 'qcm' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: 'Réponse correcte',
      explanation: 'Explication de la réponse correcte',
      references: []
    };
  }

  private formatEvaluation(data: any): TrainingEvaluation {
    return {
      score: data.score || 0,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      improvementSuggestions: data.suggestions || [],
      nextLevelRecommendation: data.nextLevel
    };
  }

  private getFallbackEvaluation(userAnswer: string, expectedAnswer: string): TrainingEvaluation {
    const isCorrect = userAnswer.toLowerCase().includes(expectedAnswer.toLowerCase());
    return {
      score: isCorrect ? 80 : 40,
      strengths: isCorrect ? ['Bonne compréhension'] : [],
      weaknesses: isCorrect ? [] : ['Révision nécessaire'],
      improvementSuggestions: ['Approfondir les concepts de base'],
      nextLevelRecommendation: undefined
    };
  }

  private getFallbackCaseStudy(level: UserLevel, domain: StudyDomain): GeneratedCaseStudy {
    return {
      title: `Cas pratique ${domain}`,
      situation: `Situation professionnelle niveau ${level}`,
      context: `Contexte professionnel de police municipale`,
      questions: ['Analysez la situation', 'Proposez des solutions'],
      expectedElements: ['Introduction', 'Analyse juridique', 'Conclusion'],
      difficulty: level,
      estimatedTime: 30
    };
  }

  private formatRevisionPlan(data: any, duration: number): string {
    return `Plan de révision sur ${duration} jours : ${data.plan || 'Plan personnalisé'}`;
  }

  private getFallbackRevisionPlan(level: UserLevel, domain: StudyDomain, duration: number): string {
    return `Plan de révision ${domain} niveau ${level} sur ${duration} jours`;
  }

  private formatSummarySheet(data: any): string {
    return `Fiche de synthèse : ${data.content || 'Contenu de la fiche'}`;
  }

  private getFallbackSummarySheet(domain: StudyDomain, topic: string): string {
    return `Fiche de synthèse ${domain} - ${topic}`;
  }

  private analyzeDomainPerformance(results: Array<{ correct: boolean; domain: StudyDomain; timestamp: Date }>): Array<{ domain: string; score: number }> {
    const domains = Array.from(new Set(results.map(r => r.domain)));
    return domains.map(domain => {
      const domainResults = results.filter(r => r.domain === domain);
      const correct = domainResults.filter(r => r.correct).length;
      const score = domainResults.length > 0 ? (correct / domainResults.length) * 100 : 0;
      return { domain, score };
    });
  }

  private generateImprovementSuggestions(weaknesses: string[], score: number): string[] {
    const suggestions = [];
    
    if (score < 50) {
      suggestions.push('Révision approfondie des concepts de base recommandée');
      suggestions.push('Augmenter le temps de préparation quotidien');
    } else if (score < 75) {
      suggestions.push('Concentration sur les points faibles identifiés');
      suggestions.push('Exercices supplémentaires dans les domaines en difficulté');
    }
    
    weaknesses.forEach(weakness => {
      suggestions.push(`Approfondir les connaissances en ${weakness}`);
    });
    
    return suggestions;
  }

  private getNextLevelRecommendation(score: number, strengthsCount: number): UserLevel | undefined {
    if (score >= 85 && strengthsCount >= 3) {
      return 'avance';
    } else if (score >= 70 && strengthsCount >= 2) {
      return 'intermediaire';
    }
    return undefined;
  }

  private getBaseResources(domain: StudyDomain, level: UserLevel): string[] {
    return [`Ressource ${domain} niveau ${level}`];
  }

  private getTopicSpecificResources(domain: StudyDomain, topic: string): string[] {
    return [`Ressource spécialisée ${topic} en ${domain}`];
  }

  private async generateOralQuestions(level: UserLevel, domain: StudyDomain): Promise<string[]> {
    return [`Question orale ${domain} niveau ${level}`];
  }

  private getOralEvaluationGrid(level: UserLevel): string[] {
    return [`Critère d'évaluation niveau ${level}`];
  }

  private getRecommendedStudyTime(level: UserLevel): number {
    const times: Record<UserLevel, number> = {
      debutant: 2,
      intermediaire: 1.5,
      avance: 1
    };
    return times[level];
  }

  private getDomainPriorities(domain: StudyDomain): string[] {
    return [`Priorité 1 pour ${domain}`, `Priorité 2 pour ${domain}`];
  }

  private getEvaluationCriteria(level: UserLevel, domain: StudyDomain): string[] {
    return [`Critère ${level} pour ${domain}`];
  }
}

export const prepaCdsService = new PrepaCdsService();
