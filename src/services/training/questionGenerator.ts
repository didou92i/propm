import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
}

export interface TrueFalseQuestion {
  id: string;
  statement: string;
  isCorrect: boolean;
  explanation: string;
  domain: string;
}

export interface CasePracticeStep {
  id: string;
  title: string;
  scenario: string;
  question: string;
  expectedPoints: string[];
  timeLimit: number;
}

export interface CasePracticeData {
  title: string;
  context: string;
  steps: CasePracticeStep[];
  totalTime: number;
}

export interface ContentData {
  qcm: QuizQuestion[];
  trueFalse: TrueFalseQuestion[];
  casePractice: CasePracticeData;
}

export interface GenerationOptions {
  maxItems?: number;
  excludeIds?: string[];
  preferDifficulty?: 'facile' | 'moyen' | 'difficile';
  sessionId?: string;
}

/**
 * Générateur intelligent de questions avec sélection adaptative
 */
export class QuestionGenerator {
  private recentQuestions: Map<string, Set<string>> = new Map(); // sessionId -> Set<questionIds>
  private difficultyWeights: Record<UserLevel, Record<string, number>> = {
    'debutant': { 'facile': 0.7, 'moyen': 0.3, 'difficile': 0.0 },
    'intermediaire': { 'facile': 0.3, 'moyen': 0.6, 'difficile': 0.1 },
    'avance': { 'facile': 0.1, 'moyen': 0.4, 'difficile': 0.5 }
  };

  /**
   * Sélectionne des questions de manière intelligente
   */
  public selectQuestions<T extends QuizQuestion | TrueFalseQuestion>(
    questions: T[],
    level: UserLevel,
    options: GenerationOptions = {}
  ): T[] {
    const { maxItems = 5, excludeIds = [], preferDifficulty, sessionId } = options;
    
    // Filtrer les questions exclues et récentes
    let availableQuestions = questions.filter(q => {
      const isExcluded = excludeIds.includes(q.id);
      const isRecent = sessionId ? this.isRecentQuestion(sessionId, q.id) : false;
      return !isExcluded && !isRecent;
    });

    // Si pas assez de questions, on réinitialise les récentes
    if (availableQuestions.length < maxItems && sessionId) {
      this.clearRecentQuestions(sessionId);
      availableQuestions = questions.filter(q => !excludeIds.includes(q.id));
    }

    // Sélection par niveau de difficulté
    let selectedQuestions: T[] = [];
    
    if (preferDifficulty) {
      // Priorité à une difficulté spécifique
      const preferredQuestions = availableQuestions.filter(q => 
        'difficulty' in q && q.difficulty === preferDifficulty
      );
      selectedQuestions = this.shuffleArray(preferredQuestions).slice(0, maxItems);
      
      // Compléter si nécessaire
      if (selectedQuestions.length < maxItems) {
        const remaining = availableQuestions.filter(q => !selectedQuestions.includes(q));
        selectedQuestions.push(...this.shuffleArray(remaining).slice(0, maxItems - selectedQuestions.length));
      }
    } else {
      // Sélection pondérée par niveau
      selectedQuestions = this.selectByLevel(availableQuestions, level, maxItems);
    }

    // Enregistrer les questions sélectionnées comme récentes
    if (sessionId) {
      this.markQuestionsAsRecent(sessionId, selectedQuestions.map(q => q.id));
    }

    return selectedQuestions;
  }

  /**
   * Sélectionne un cas pratique avec variation des étapes
   */
  public selectCasePractice(
    casePractice: CasePracticeData,
    level: UserLevel,
    options: GenerationOptions = {}
  ): CasePracticeData {
    const { maxItems } = options;
    
    // Mélanger les étapes pour varier l'expérience
    const shuffledSteps = this.shuffleArray([...casePractice.steps]);
    
    // Adapter le nombre d'étapes selon le niveau
    let stepCount: number;
    switch (level) {
      case 'debutant':
        stepCount = Math.min(1, shuffledSteps.length);
        break;
      case 'intermediaire':
        stepCount = Math.min(2, shuffledSteps.length);
        break;
      case 'avance':
        stepCount = shuffledSteps.length;
        break;
      default:
        stepCount = Math.min(2, shuffledSteps.length);
    }

    if (maxItems) {
      stepCount = Math.min(stepCount, maxItems);
    }

    return {
      ...casePractice,
      steps: shuffledSteps.slice(0, stepCount)
    };
  }

  /**
   * Sélection pondérée par niveau
   */
  private selectByLevel<T extends QuizQuestion | TrueFalseQuestion>(
    questions: T[],
    level: UserLevel,
    maxItems: number
  ): T[] {
    const weights = this.difficultyWeights[level];
    const selectedQuestions: T[] = [];

    // Grouper par difficulté
    const byDifficulty = questions.reduce((acc, q) => {
      const difficulty = 'difficulty' in q ? q.difficulty : 'moyen';
      if (!acc[difficulty]) acc[difficulty] = [];
      acc[difficulty].push(q);
      return acc;
    }, {} as Record<string, T[]>);

    // Calculer le nombre de questions par difficulté
    Object.entries(weights).forEach(([difficulty, weight]) => {
      const questionsInDifficulty = byDifficulty[difficulty] || [];
      const count = Math.round(maxItems * weight);
      
      if (count > 0 && questionsInDifficulty.length > 0) {
        const shuffled = this.shuffleArray(questionsInDifficulty);
        selectedQuestions.push(...shuffled.slice(0, Math.min(count, questionsInDifficulty.length)));
      }
    });

    // Compléter jusqu'au nombre souhaité si nécessaire
    if (selectedQuestions.length < maxItems) {
      const remaining = questions.filter(q => !selectedQuestions.includes(q));
      const shuffled = this.shuffleArray(remaining);
      selectedQuestions.push(...shuffled.slice(0, maxItems - selectedQuestions.length));
    }

    return this.shuffleArray(selectedQuestions).slice(0, maxItems);
  }

  /**
   * Mélange un tableau (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Vérifie si une question a été récemment utilisée
   */
  private isRecentQuestion(sessionId: string, questionId: string): boolean {
    const recentIds = this.recentQuestions.get(sessionId);
    return recentIds ? recentIds.has(questionId) : false;
  }

  /**
   * Marque des questions comme récemment utilisées
   */
  private markQuestionsAsRecent(sessionId: string, questionIds: string[]): void {
    if (!this.recentQuestions.has(sessionId)) {
      this.recentQuestions.set(sessionId, new Set());
    }
    const recentSet = this.recentQuestions.get(sessionId)!;
    questionIds.forEach(id => recentSet.add(id));
    
    // Limiter le nombre de questions récentes (max 20)
    if (recentSet.size > 20) {
      const array = Array.from(recentSet);
      recentSet.clear();
      array.slice(-15).forEach(id => recentSet.add(id)); // Garder les 15 plus récentes
    }
  }

  /**
   * Vide les questions récentes pour une session
   */
  private clearRecentQuestions(sessionId: string): void {
    this.recentQuestions.delete(sessionId);
  }

  /**
   * Nettoie les données de sessions anciennes (appelé périodiquement)
   */
  public cleanup(): void {
    // Dans une vraie implémentation, on pourrait ajouter un timestamp et nettoyer les anciennes sessions
    if (this.recentQuestions.size > 100) {
      this.recentQuestions.clear();
    }
  }
}

// Instance singleton
export const questionGenerator = new QuestionGenerator();