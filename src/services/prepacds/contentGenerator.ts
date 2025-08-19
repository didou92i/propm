import { supabase } from '@/integrations/supabase/client';
import type { UserLevel, StudyDomain, TrainingType, GeneratedQuestion, GeneratedCaseStudy, LegalReference } from './types';

export class ContentGenerator {
  async generateQuestion(
    level: UserLevel, 
    domain: StudyDomain, 
    type: TrainingType, 
    sessionId?: string
  ): Promise<GeneratedQuestion> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-training-question', {
        body: { level, domain, type, sessionId }
      });

      if (error) throw error;

      return {
        id: crypto.randomUUID(),
        question: data.question || '',
        options: data.options,
        correctAnswer: data.correctAnswer || '',
        explanation: data.explanation || '',
        difficulty: level,
        domain,
        legalReferences: data.legalReferences || []
      };
    } catch (error) {
      console.error('Erreur lors de la génération de question:', error);
      return this.getFallbackQuestion(level, domain, type);
    }
  }

  async generateCaseStudy(
    level: UserLevel, 
    domain: StudyDomain, 
    sessionId?: string
  ): Promise<GeneratedCaseStudy> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-case-study', {
        body: { level, domain, sessionId }
      });

      if (error) throw error;

      return {
        id: crypto.randomUUID(),
        title: data.title || '',
        context: data.context || '',
        scenario: data.scenario || '',
        questions: data.questions || [],
        expectedAnswers: data.expectedAnswers || [],
        evaluationCriteria: data.evaluationCriteria || [],
        legalFramework: data.legalFramework || []
      };
    } catch (error) {
      console.error('Erreur lors de la génération de cas pratique:', error);
      return this.getFallbackCaseStudy(level, domain);
    }
  }

  async generateRevisionPlan(
    level: UserLevel,
    domain: StudyDomain,
    duration: number,
    weakAreas: string[]
  ): Promise<any> {
    const topics = this.getTopicsForDomain(domain);
    const prioritizedTopics = this.prioritizeTopics(topics, weakAreas);
    
    return {
      duration,
      level,
      domain,
      topics: prioritizedTopics,
      schedule: this.createStudySchedule(prioritizedTopics, duration),
      resources: this.getResourcesForTopics(prioritizedTopics, level),
      evaluations: this.createEvaluationSchedule(duration)
    };
  }

  private getFallbackQuestion(level: UserLevel, domain: StudyDomain, type: TrainingType): GeneratedQuestion {
    return {
      id: crypto.randomUUID(),
      question: `Question de ${this.getDomainDescription(domain)} - niveau ${this.getLevelDescription(level)}`,
      correctAnswer: "Réponse exemple",
      explanation: "Explication détaillée de la réponse",
      difficulty: level,
      domain,
      legalReferences: []
    };
  }

  private getFallbackCaseStudy(level: UserLevel, domain: StudyDomain): GeneratedCaseStudy {
    return {
      id: crypto.randomUUID(),
      title: `Cas pratique - ${this.getDomainDescription(domain)}`,
      context: "Contexte du cas pratique",
      scenario: "Scénario détaillé",
      questions: ["Question 1", "Question 2"],
      expectedAnswers: ["Réponse attendue 1", "Réponse attendue 2"],
      evaluationCriteria: ["Critère 1", "Critère 2"],
      legalFramework: []
    };
  }

  private getTopicsForDomain(domain: StudyDomain): string[] {
    const domainTopics: Record<StudyDomain, string[]> = {
      police_municipale: [
        "Pouvoirs de police du maire",
        "Police administrative",
        "Police judiciaire",
        "Contraventions de voirie"
      ],
      securite_publique: [
        "Ordre public",
        "Sécurité des personnes",
        "Sécurité des biens",
        "Prévention situationnelle"
      ],
      reglementation: [
        "Code général des collectivités territoriales",
        "Code de la route",
        "Code de la santé publique",
        "Réglementation environnementale"
      ],
      procedure_penale: [
        "Enquête préliminaire",
        "Flagrant délit",
        "Procès-verbal",
        "Médiation pénale"
      ],
      droit_administratif: [
        "Actes administratifs",
        "Contentieux administratif",
        "Service public",
        "Responsabilité administrative"
      ],
      management: [
        "Leadership",
        "Gestion d'équipe",
        "Communication",
        "Gestion de projet"
      ],
      ethique_deontologie: [
        "Code de déontologie",
        "Éthique professionnelle",
        "Conflits d'intérêts",
        "Secret professionnel"
      ]
    };

    return domainTopics[domain] || [];
  }

  private prioritizeTopics(topics: string[], weakAreas: string[]): string[] {
    return topics.sort((a, b) => {
      const aIsWeak = weakAreas.some(weak => a.toLowerCase().includes(weak.toLowerCase()));
      const bIsWeak = weakAreas.some(weak => b.toLowerCase().includes(weak.toLowerCase()));
      
      if (aIsWeak && !bIsWeak) return -1;
      if (!aIsWeak && bIsWeak) return 1;
      return 0;
    });
  }

  private createStudySchedule(topics: string[], duration: number): any[] {
    const daysPerTopic = Math.max(1, Math.floor(duration / topics.length));
    
    return topics.map((topic, index) => ({
      topic,
      startDay: index * daysPerTopic + 1,
      duration: daysPerTopic,
      activities: ['Lecture théorique', 'Exercices pratiques', 'Révision']
    }));
  }

  private getResourcesForTopics(topics: string[], level: UserLevel): any[] {
    return topics.map(topic => ({
      topic,
      resources: [
        { type: 'manuel', title: `Manuel de ${topic}` },
        { type: 'exercices', title: `Exercices pratiques - ${topic}` },
        { type: 'jurisprudence', title: `Jurisprudence récente - ${topic}` }
      ]
    }));
  }

  private createEvaluationSchedule(duration: number): any[] {
    const evaluations = [];
    const weekInterval = 7;
    
    for (let day = weekInterval; day <= duration; day += weekInterval) {
      evaluations.push({
        day,
        type: 'evaluation_hebdomadaire',
        description: 'Évaluation des connaissances acquises'
      });
    }
    
    return evaluations;
  }

  private getDomainDescription(domain: StudyDomain): string {
    const descriptions: Record<StudyDomain, string> = {
      police_municipale: "Police Municipale",
      securite_publique: "Sécurité Publique",
      reglementation: "Réglementation",
      procedure_penale: "Procédure Pénale",
      droit_administratif: "Droit Administratif",
      management: "Management",
      ethique_deontologie: "Éthique et Déontologie"
    };
    return descriptions[domain] || domain;
  }

  private getLevelDescription(level: UserLevel): string {
    const descriptions: Record<UserLevel, string> = {
      debutant: "Débutant",
      intermediaire: "Intermédiaire",
      avance: "Avancé",
      expert: "Expert"
    };
    return descriptions[level] || level;
  }
}