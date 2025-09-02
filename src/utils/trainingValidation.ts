// Utilitaires de validation pour les données d'entraînement

import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QuestionValidation {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number | boolean;
  explanation: string;
  difficulty?: string;
}

export interface CaseValidation {
  title: string;
  context: string;
  steps: {
    id: string;
    title: string;
    scenario: string;
    question: string;
    expectedPoints: string[];
    timeLimit?: number;
  }[];
  totalTime?: number;
}

// Valide la structure générale d'un contenu d'entraînement
export function validateTrainingContent(
  content: any, 
  trainingType: TrainingType
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!content) {
    result.isValid = false;
    result.errors.push('Contenu manquant');
    return result;
  }

  switch (trainingType) {
    case 'qcm':
      return validateQCMContent(content);
    case 'vrai_faux':
      return validateTrueFalseContent(content);
    case 'cas_pratique':
      return validateCasePracticeContent(content);
    default:
      result.warnings.push(`Type d'entraînement non géré: ${trainingType}`);
  }

  return result;
}

// Valide le contenu QCM
export function validateQCMContent(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!content.questions || !Array.isArray(content.questions)) {
    result.isValid = false;
    result.errors.push('Questions manquantes ou format incorrect');
    return result;
  }

  if (content.questions.length === 0) {
    result.isValid = false;
    result.errors.push('Aucune question trouvée');
    return result;
  }

  content.questions.forEach((question: any, index: number) => {
    const questionErrors = validateQuestion(question, 'qcm');
    if (questionErrors.length > 0) {
      result.errors.push(`Question ${index + 1}: ${questionErrors.join(', ')}`);
      result.isValid = false;
    }
  });

  if (content.questions.length < 3) {
    result.warnings.push('Moins de 3 questions détectées');
  }

  return result;
}

// Valide le contenu Vrai/Faux
export function validateTrueFalseContent(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!content.questions || !Array.isArray(content.questions)) {
    result.isValid = false;
    result.errors.push('Questions manquantes ou format incorrect');
    return result;
  }

  if (content.questions.length === 0) {
    result.isValid = false;
    result.errors.push('Aucune question trouvée');
    return result;
  }

  content.questions.forEach((question: any, index: number) => {
    const questionErrors = validateQuestion(question, 'vrai_faux');
    if (questionErrors.length > 0) {
      result.errors.push(`Question ${index + 1}: ${questionErrors.join(', ')}`);
      result.isValid = false;
    }
  });

  return result;
}

// Valide le contenu Cas Pratique
export function validateCasePracticeContent(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Vérification titre
  if (!content.title && !content.caseTitle) {
    result.errors.push('Titre du cas pratique manquant');
    result.isValid = false;
  }

  // Vérification contexte
  if (!content.context && !content.scenario) {
    result.errors.push('Contexte du cas pratique manquant');
    result.isValid = false;
  }

  // Vérification étapes
  if (!content.steps || !Array.isArray(content.steps)) {
    result.errors.push('Étapes du cas pratique manquantes');
    result.isValid = false;
    return result;
  }

  if (content.steps.length === 0) {
    result.errors.push('Aucune étape trouvée');
    result.isValid = false;
    return result;
  }

  content.steps.forEach((step: any, index: number) => {
    const stepErrors = validateCaseStep(step);
    if (stepErrors.length > 0) {
      result.errors.push(`Étape ${index + 1}: ${stepErrors.join(', ')}`);
      result.isValid = false;
    }
  });

  return result;
}

// Valide une question individuelle
function validateQuestion(question: any, type: 'qcm' | 'vrai_faux'): string[] {
  const errors: string[] = [];

  if (!question.id) {
    errors.push('ID manquant');
  }

  if (!question.question && !question.statement) {
    errors.push('Texte de la question manquant');
  }

  if (!question.explanation) {
    errors.push('Explication manquante');
  }

  if (type === 'qcm') {
    if (!question.options || !Array.isArray(question.options)) {
      errors.push('Options manquantes');
    } else if (question.options.length < 2) {
      errors.push('Au moins 2 options requises');
    }

    if (typeof question.correctAnswer !== 'number') {
      errors.push('Index de réponse correcte manquant');
    } else if (question.options && question.correctAnswer >= question.options.length) {
      errors.push('Index de réponse correcte invalide');
    }
  }

  if (type === 'vrai_faux') {
    const hasCorrectAnswer = question.isCorrect !== undefined || question.isTrue !== undefined;
    if (!hasCorrectAnswer) {
      errors.push('Réponse correcte manquante (isCorrect ou isTrue)');
    }
  }

  return errors;
}

// Valide une étape de cas pratique
function validateCaseStep(step: any): string[] {
  const errors: string[] = [];

  if (!step.id) {
    errors.push('ID manquant');
  }

  if (!step.title) {
    errors.push('Titre manquant');
  }

  if (!step.scenario) {
    errors.push('Scénario manquant');
  }

  if (!step.question) {
    errors.push('Question manquante');
  }

  if (!step.expectedPoints || !Array.isArray(step.expectedPoints)) {
    errors.push('Points attendus manquants');
  } else if (step.expectedPoints.length === 0) {
    errors.push('Aucun point attendu');
  }

  return errors;
}

// Normalise le contenu pour assurer la compatibilité
export function normalizeTrainingContent(content: any, trainingType: TrainingType): any {
  if (!content) return null;

  switch (trainingType) {
    case 'qcm':
      return {
        ...content,
        questions: (content.questions || []).map((q: any) => ({
          id: q.id || `q${Date.now()}`,
          question: q.question || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? 0,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'moyen'
        }))
      };

    case 'vrai_faux':
      return {
        ...content,
        questions: (content.questions || []).map((q: any) => ({
          id: q.id || `tf${Date.now()}`,
          statement: q.statement || q.question || '',
          isCorrect: q.isCorrect ?? q.isTrue ?? false,
          isTrue: q.isTrue ?? q.isCorrect ?? false,
          explanation: q.explanation || '',
          domain: q.domain || 'Général'
        }))
      };

    case 'cas_pratique':
      return {
        title: content.title || content.caseTitle || 'Cas Pratique',
        context: content.context || content.scenario || '',
        steps: (content.steps || []).map((s: any) => ({
          id: s.id || `step${Date.now()}`,
          title: s.title || 'Étape',
          scenario: s.scenario || '',
          question: s.question || '',
          expectedPoints: s.expectedPoints || [],
          timeLimit: s.timeLimit || 15
        })),
        totalTime: content.totalTime || 30
      };

    default:
      return content;
  }
}