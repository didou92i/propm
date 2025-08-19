export type UserLevel = 'debutant' | 'intermediaire' | 'avance' | 'expert';
export type StudyDomain = 'police_municipale' | 'securite_publique' | 'reglementation' | 'procedure_penale' | 'droit_administratif' | 'management' | 'ethique_deontologie';
export type TrainingType = 'qcm' | 'vrai_faux' | 'cas_pratique' | 'question_ouverte' | 'simulation_orale' | 'plan_revision';

export interface SessionHistory {
  exercises: string[];
  questions: string[];
  cases: string[];
  documents: string[];
  timestamp: Date;
}

export interface ExerciseMemory {
  contentHash: string;
  timestamp: Date;
  type: string;
}

export interface PrepaCdsRequest {
  type: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  prompt: string;
  sessionId?: string;
}

export interface PrepaCdsResponse {
  content: string;
  metadata: {
    type: TrainingType;
    level: UserLevel;
    domain: StudyDomain;
    generatedAt: Date;
  };
}

export interface LegalReference {
  code: string;
  article: string;
  title: string;
  url?: string;
}

export interface TrainingEvaluation {
  score: number;
  feedback: string;
  corrections: string[];
  recommendations: string[];
  legalReferences: LegalReference[];
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: UserLevel;
  domain: StudyDomain;
  legalReferences: LegalReference[];
}

export interface GeneratedCaseStudy {
  id: string;
  title: string;
  context: string;
  scenario: string;
  questions: string[];
  expectedAnswers: string[];
  evaluationCriteria: string[];
  legalFramework: LegalReference[];
}