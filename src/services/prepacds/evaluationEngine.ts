import { supabase } from '@/integrations/supabase/client';
import type { UserLevel, StudyDomain, TrainingEvaluation, LegalReference } from './types';

export class EvaluationEngine {
  async correctAnswer(
    userAnswer: string,
    expectedAnswer: string,
    level: UserLevel,
    domain: StudyDomain
  ): Promise<TrainingEvaluation> {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-user-answer', {
        body: {
          userAnswer,
          expectedAnswer,
          level,
          domain
        }
      });

      if (error) throw error;

      return {
        score: data.score || 0,
        feedback: data.feedback || 'Évaluation non disponible',
        corrections: data.corrections || [],
        recommendations: data.recommendations || [],
        legalReferences: data.legalReferences || []
      };
    } catch (error) {
      console.error('Erreur lors de l\'évaluation:', error);
      return this.getFallbackEvaluation(userAnswer, expectedAnswer);
    }
  }

  evaluateProgress(results: Array<{ correct: boolean; domain: StudyDomain; timestamp: Date }>): {
    globalScore: number;
    progression: number;
    strongAreas: StudyDomain[];
    weakAreas: StudyDomain[];
    recommendations: string[];
  } {
    if (results.length === 0) {
      return {
        globalScore: 0,
        progression: 0,
        strongAreas: [],
        weakAreas: [],
        recommendations: ['Commencez par répondre à quelques questions pour évaluer votre niveau']
      };
    }

    const totalCorrect = results.filter(r => r.correct).length;
    const globalScore = (totalCorrect / results.length) * 100;

    // Calculer la progression (comparaison première moitié vs seconde moitié)
    const midPoint = Math.floor(results.length / 2);
    const firstHalf = results.slice(0, midPoint);
    const secondHalf = results.slice(midPoint);

    const firstHalfScore = firstHalf.length > 0 ? 
      (firstHalf.filter(r => r.correct).length / firstHalf.length) * 100 : 0;
    const secondHalfScore = secondHalf.length > 0 ? 
      (secondHalf.filter(r => r.correct).length / secondHalf.length) * 100 : 0;

    const progression = secondHalfScore - firstHalfScore;

    // Analyser les domaines
    const domainStats = this.analyzeDomainPerformance(results);
    const strongAreas = domainStats
      .filter(d => d.score >= 70)
      .map(d => d.domain);
    const weakAreas = domainStats
      .filter(d => d.score < 50)
      .map(d => d.domain);

    const recommendations = this.generateRecommendations(globalScore, progression, weakAreas);

    return {
      globalScore,
      progression,
      strongAreas,
      weakAreas,
      recommendations
    };
  }

  simulateOralExam(level: UserLevel, domain: StudyDomain): {
    questions: string[];
    evaluationGrid: any;
    tips: string[];
  } {
    const questions = this.generateOralQuestions(level, domain);
    const evaluationGrid = this.createEvaluationGrid(level);
    const tips = this.getOralExamTips(level);

    return {
      questions,
      evaluationGrid,
      tips
    };
  }

  private getFallbackEvaluation(userAnswer: string, expectedAnswer: string): TrainingEvaluation {
    const similarity = this.calculateSimilarity(userAnswer, expectedAnswer);
    const score = Math.round(similarity * 100);

    return {
      score,
      feedback: score >= 70 ? 'Bonne réponse !' : 'Réponse à améliorer',
      corrections: score < 70 ? [`Réponse attendue : ${expectedAnswer}`] : [],
      recommendations: score < 70 ? ['Réviser ce point'] : ['Continuer ainsi !'],
      legalReferences: []
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private analyzeDomainPerformance(results: Array<{ correct: boolean; domain: StudyDomain; timestamp: Date }>) {
    const domainGroups = results.reduce((acc, result) => {
      if (!acc[result.domain]) {
        acc[result.domain] = [];
      }
      acc[result.domain].push(result);
      return acc;
    }, {} as Record<StudyDomain, typeof results>);

    return Object.entries(domainGroups).map(([domain, domainResults]) => {
      const correct = domainResults.filter(r => r.correct).length;
      const total = domainResults.length;
      const score = (correct / total) * 100;

      return {
        domain: domain as StudyDomain,
        score,
        total,
        correct
      };
    });
  }

  private generateRecommendations(globalScore: number, progression: number, weakAreas: StudyDomain[]): string[] {
    const recommendations: string[] = [];

    if (globalScore < 50) {
      recommendations.push('Concentrez-vous sur les bases avant d\'approfondir');
    } else if (globalScore < 70) {
      recommendations.push('Bon niveau général, travaillez la précision');
    } else {
      recommendations.push('Excellent niveau ! Maintenez le rythme');
    }

    if (progression > 10) {
      recommendations.push('Très belle progression, continuez !');
    } else if (progression < -10) {
      recommendations.push('Attention à la baisse de performance, prenez une pause');
    }

    if (weakAreas.length > 0) {
      recommendations.push(`Domaines à renforcer : ${weakAreas.join(', ')}`);
    }

    return recommendations;
  }

  private generateOralQuestions(level: UserLevel, domain: StudyDomain): string[] {
    const baseQuestions = [
      'Présentez-vous et expliquez votre motivation',
      'Quelles sont vos principales qualités pour ce poste ?',
      'Comment gérez-vous le stress ?'
    ];

    const domainQuestions: Record<StudyDomain, string[]> = {
      police_municipale: [
        'Quels sont les pouvoirs de police du maire ?',
        'Différence entre police administrative et judiciaire ?'
      ],
      securite_publique: [
        'Comment assurer la sécurité lors d\'un événement public ?',
        'Gestion d\'un conflit de voisinage ?'
      ],
      reglementation: [
        'Principales réglementations en matière de voirie ?',
        'Procédure de verbalisation ?'
      ],
      procedure_penale: [
        'Rédaction d\'un procès-verbal ?',
        'Droits de la défense ?'
      ],
      droit_administratif: [
        'Principe de légalité ?',
        'Recours administratifs ?'
      ],
      management: [
        'Comment motivez-vous votre équipe ?',
        'Gestion d\'un conflit interne ?'
      ],
      ethique_deontologie: [
        'Dilemme éthique dans l\'exercice de vos fonctions ?',
        'Secret professionnel ?'
      ]
    };

    return [...baseQuestions, ...(domainQuestions[domain] || [])];
  }

  private createEvaluationGrid(level: UserLevel) {
    return {
      presentation: { coefficient: 2, description: 'Présentation et motivation' },
      connaissances: { coefficient: 4, description: 'Connaissances techniques' },
      communication: { coefficient: 3, description: 'Capacité de communication' },
      adaptabilite: { coefficient: 2, description: 'Adaptabilité et réactivité' },
      ethique: { coefficient: 3, description: 'Sens de l\'éthique' }
    };
  }

  private getOralExamTips(level: UserLevel): string[] {
    return [
      'Préparez des exemples concrets',
      'Restez calme et posé',
      'Écoutez bien les questions',
      'N\'hésitez pas à demander des précisions',
      'Structurez vos réponses',
      'Montrez votre motivation',
      'Soyez authentique'
    ];
  }
}