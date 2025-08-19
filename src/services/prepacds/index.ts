import { ContentGenerator } from './contentGenerator';
import { SessionManager } from './sessionManager';
import { EvaluationEngine } from './evaluationEngine';
import { ResourceManager } from './resourceManager';
import type { 
  UserLevel, 
  StudyDomain, 
  TrainingType, 
  PrepaCdsRequest, 
  PrepaCdsResponse 
} from './types';

export class PrepaCdsService {
  private static instance: PrepaCdsService;
  private contentGenerator: ContentGenerator;
  private sessionManager: SessionManager;
  private evaluationEngine: EvaluationEngine;
  private resourceManager: ResourceManager;

  private constructor() {
    this.contentGenerator = new ContentGenerator();
    this.sessionManager = new SessionManager();
    this.evaluationEngine = new EvaluationEngine();
    this.resourceManager = new ResourceManager();
  }

  static getInstance(): PrepaCdsService {
    if (!PrepaCdsService.instance) {
      PrepaCdsService.instance = new PrepaCdsService();
    }
    return PrepaCdsService.instance;
  }

  // Content Generation Methods
  async generateQuestion(level: UserLevel, domain: StudyDomain, type: TrainingType, sessionId?: string) {
    return this.contentGenerator.generateQuestion(level, domain, type, sessionId);
  }

  async generateCaseStudy(level: UserLevel, domain: StudyDomain, sessionId?: string) {
    return this.contentGenerator.generateCaseStudy(level, domain, sessionId);
  }

  async generateRevisionPlan(level: UserLevel, domain: StudyDomain, duration: number, weakAreas: string[]) {
    return this.contentGenerator.generateRevisionPlan(level, domain, duration, weakAreas);
  }

  // Session Management Methods
  recordExercise(sessionId: string, content: string, type: string) {
    this.sessionManager.recordExercise(sessionId, content, type);
  }

  getSessionHistory(sessionId: string) {
    return this.sessionManager.getSessionHistory(sessionId);
  }

  updateSessionHistory(sessionId: string, type: 'exercise' | 'question' | 'case' | 'document', id: string) {
    this.sessionManager.updateSessionHistory(sessionId, type, id);
  }

  getSessionStats(sessionId: string) {
    return this.sessionManager.getSessionStats(sessionId);
  }

  clearSession(sessionId: string) {
    this.sessionManager.clearSession(sessionId);
  }

  // Evaluation Methods
  async correctAnswer(userAnswer: string, expectedAnswer: string, level: UserLevel, domain: StudyDomain) {
    return this.evaluationEngine.correctAnswer(userAnswer, expectedAnswer, level, domain);
  }

  evaluateProgress(results: Array<{ correct: boolean; domain: StudyDomain; timestamp: Date }>) {
    return this.evaluationEngine.evaluateProgress(results);
  }

  simulateOralExam(level: UserLevel, domain: StudyDomain) {
    return this.evaluationEngine.simulateOralExam(level, domain);
  }

  // Resource Management Methods
  suggestResources(domain: StudyDomain, level: UserLevel, specificTopic?: string) {
    return this.resourceManager.suggestResources(domain, level, specificTopic);
  }

  generateSummarySheet(domain: StudyDomain, topic: string, level: UserLevel) {
    return this.resourceManager.generateSummarySheet(domain, topic, level);
  }

  // Utility Methods
  enrichQuery(request: PrepaCdsRequest): string {
    const context = {
      level: this.getLevelDescription(request.level),
      domain: this.getDomainDescription(request.domain),
      type: this.getTypeDescription(request.type)
    };

    return `Contexte pédagogique :
- Niveau : ${context.level}
- Domaine : ${context.domain}  
- Type d'exercice : ${context.type}

Demande de l'utilisateur : ${request.prompt}`;
  }

  private getLevelDescription(level: UserLevel): string {
    const descriptions: Record<UserLevel, string> = {
      debutant: "Débutant - Découverte des concepts de base",
      intermediaire: "Intermédiaire - Approfondissement des connaissances",
      avance: "Avancé - Maîtrise et application complexe",
      expert: "Expert - Expertise approfondie et cas complexes"
    };
    return descriptions[level] || level;
  }

  private getDomainDescription(domain: StudyDomain): string {
    const descriptions: Record<StudyDomain, string> = {
      police_municipale: "Police Municipale - Pouvoirs et missions du maire",
      securite_publique: "Sécurité Publique - Ordre public et prévention",
      reglementation: "Réglementation - Codes et textes applicables",
      procedure_penale: "Procédure Pénale - Investigation et poursuites",
      droit_administratif: "Droit Administratif - Fonctionnement de l'administration",
      management: "Management - Leadership et gestion d'équipe",
      ethique_deontologie: "Éthique et Déontologie - Principes professionnels"
    };
    return descriptions[domain] || domain;
  }

  private getTypeDescription(type: TrainingType): string {
    const descriptions: Record<TrainingType, string> = {
      qcm: "Questions à Choix Multiples",
      vrai_faux: "Questions Vrai/Faux",
      cas_pratique: "Cas Pratiques",
      question_ouverte: "Questions Ouvertes",
      simulation_orale: "Simulation d'Oral",
      plan_revision: "Plan de Révision"
    };
    return descriptions[type] || type;
  }
}

// Export singleton instance
export const prepaCdsService = PrepaCdsService.getInstance();

// Re-export types
export type * from './types';