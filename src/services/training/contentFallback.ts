/**
 * Service de fallback pour la génération de contenu d'entraînement
 * Utilisé lorsque l'API de génération échoue
 */

import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

interface FallbackContent {
  [key: string]: any;
}

export class ContentFallbackService {
  /**
   * Génère un contenu de fallback basique selon le type demandé
   */
  public static generateFallbackContent(
    trainingType: TrainingType,
    level: UserLevel, 
    domain: StudyDomain
  ): FallbackContent {
    switch (trainingType) {
      case 'qcm':
        return this.generateFallbackQCM(level, domain);
      
      case 'vrai_faux':
        return this.generateFallbackTrueFalse(level, domain);
      
      case 'cas_pratique':
        return this.generateFallbackCasePractice(level, domain);
      
      case 'question_ouverte':
        return this.generateFallbackOpenQuestion(level, domain);
      
      default:
        return this.generateGenericFallback(level, domain);
    }
  }

  private static generateFallbackQCM(level: UserLevel, domain: StudyDomain): FallbackContent {
    const difficultyLevel = level === 'debutant' ? 'fondamentaux' : 
                          level === 'intermediaire' ? 'approfondis' : 'experts';
                          
    return {
      title: `QCM ${domain.replace('_', ' ')} - Niveau ${level}`,
      description: `Questions à choix multiple sur les aspects ${difficultyLevel} du ${domain}`,
      questions: [
        {
          id: 'fallback-qcm-1',
          question: `Question de base en ${domain} adaptée au niveau ${level}`,
          options: [
            'Option A - Réponse plausible',
            'Option B - Réponse correcte', 
            'Option C - Réponse incorrecte',
            'Option D - Réponse de distraction'
          ],
          correctAnswer: 1,
          explanation: 'Explication détaillée de la réponse correcte',
          difficulty: level,
          points: level === 'debutant' ? 2 : level === 'intermediaire' ? 3 : 4
        }
      ],
      metadata: {
        source: 'fallback',
        generated_at: new Date().toISOString(),
        level: level,
        domain: domain
      }
    };
  }

  private static generateFallbackTrueFalse(level: UserLevel, domain: StudyDomain): FallbackContent {
    return {
      title: `Vrai/Faux ${domain.replace('_', ' ')} - Niveau ${level}`,
      description: `Affirmations vrai/faux sur le ${domain}`,
      questions: [
        {
          id: 'fallback-tf-1',
          statement: `Affirmation de base concernant le ${domain}`,
          isTrue: true,
          explanation: 'Explication détaillée de pourquoi cette affirmation est vraie',
          difficulty: level,
          points: level === 'debutant' ? 1 : level === 'intermediaire' ? 2 : 3
        }
      ],
      metadata: {
        source: 'fallback',
        generated_at: new Date().toISOString(),
        level: level,
        domain: domain
      }
    };
  }

  private static generateFallbackCasePractice(level: UserLevel, domain: StudyDomain): FallbackContent {
    const complexity = level === 'debutant' ? 'simple' : 
                      level === 'intermediaire' ? 'modéré' : 'complexe';
                      
    return {
      title: `Cas pratique ${domain.replace('_', ' ')} - Niveau ${level}`,
      context: `Vous devez traiter une situation ${complexity} dans le domaine du ${domain}`,
      steps: [
        {
          id: 'fallback-step-1',
          title: 'Analyse de la situation',
          scenario: `Situation ${complexity} nécessitant votre intervention professionnelle`,
          question: 'Comment analysez-vous cette situation et quelles sont vos premières actions ?',
          expectedPoints: [
            'Identifier les éléments clés de la situation',
            'Évaluer les risques et enjeux',
            'Déterminer les actions prioritaires'
          ],
          timeLimit: level === 'debutant' ? 10 : level === 'intermediaire' ? 15 : 20
        }
      ],
      totalTime: level === 'debutant' ? 20 : level === 'intermediaire' ? 30 : 45,
      metadata: {
        source: 'fallback',
        generated_at: new Date().toISOString(),
        level: level,
        domain: domain
      }
    };
  }

  private static generateFallbackOpenQuestion(level: UserLevel, domain: StudyDomain): FallbackContent {
    const complexity = level === 'debutant' ? 'élémentaires' : 
                      level === 'intermediaire' ? 'intermédiaires' : 'avancées';
                      
    return {
      title: `Questions ouvertes ${domain.replace('_', ' ')} - Niveau ${level}`,
      description: `Questions de rédaction sur les notions ${complexity} du ${domain}`,
      questions: [
        {
          id: 'fallback-open-1',
          question: `Développez votre compréhension des enjeux ${complexity} du ${domain}`,
          context: `Dans le cadre de votre pratique professionnelle en ${domain}`,
          expectedLength: level === 'debutant' ? 200 : level === 'intermediaire' ? 300 : 500,
          timeLimit: level === 'debutant' ? 15 : level === 'intermediaire' ? 20 : 30,
          guidelines: [
            'Structurez votre réponse avec une introduction, un développement et une conclusion',
            'Utilisez des exemples concrets si possible',
            'Démontrez votre compréhension des enjeux'
          ]
        }
      ],
      metadata: {
        source: 'fallback',
        generated_at: new Date().toISOString(),
        level: level,
        domain: domain
      }
    };
  }

  private static generateGenericFallback(level: UserLevel, domain: StudyDomain): FallbackContent {
    return {
      title: `Contenu d'entraînement - ${domain.replace('_', ' ')}`,
      description: 'Contenu de formation générique temporaire',
      content: {
        message: 'Le contenu spécialisé est temporairement indisponible. Veuillez réessayer.',
        level: level,
        domain: domain
      },
      metadata: {
        source: 'fallback',
        generated_at: new Date().toISOString(),
        level: level,
        domain: domain
      }
    };
  }

  /**
   * Vérifie si un contenu est un fallback
   */
  public static isFallbackContent(content: any): boolean {
    return content?.metadata?.source === 'fallback';
  }

  /**
   * Enrichit un contenu fallback avec des métadonnées supplémentaires
   */
  public static enhanceFallbackContent(content: FallbackContent, sessionId?: string): FallbackContent {
    return {
      ...content,
      metadata: {
        ...content.metadata,
        sessionId: sessionId,
        fallback_reason: 'API génération indisponible',
        retry_recommended: true
      }
    };
  }
}