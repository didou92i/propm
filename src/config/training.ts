import { Target, BookOpen, Brain, Trophy } from 'lucide-react';
import type { TrainingType, UserLevel, StudyDomain } from '@/types/prepacds';

export const TRAINING_TYPES = [
  { value: 'qcm' as TrainingType, label: 'QCM - Questions à Choix Multiple', icon: Target },
  { value: 'vrai_faux' as TrainingType, label: 'Vrai/Faux - Affirmations', icon: BookOpen },
  { value: 'cas_pratique' as TrainingType, label: 'Cas Pratiques - Simulations', icon: Brain },
  { value: 'question_ouverte' as TrainingType, label: 'Questions Ouvertes - Rédaction', icon: Trophy }
];

export const USER_LEVELS = [
  { value: 'debutant' as UserLevel, label: 'Débutant', description: 'Bases et fondamentaux' },
  { value: 'intermediaire' as UserLevel, label: 'Intermédiaire', description: 'Approfondissement' },
  { value: 'avance' as UserLevel, label: 'Avancé', description: 'Expertise et cas complexes' }
];

export const STUDY_DOMAINS = [
  { value: 'droit_administratif' as StudyDomain, label: 'Droit Administratif' },
  { value: 'police_municipale' as StudyDomain, label: 'Police Municipale' },
  { value: 'securite_publique' as StudyDomain, label: 'Sécurité Publique' },
  { value: 'reglementation' as StudyDomain, label: 'Réglementation' },
  { value: 'procedure_penale' as StudyDomain, label: 'Procédure Pénale' },
  { value: 'management' as StudyDomain, label: 'Management' },
  { value: 'ethique_deontologie' as StudyDomain, label: 'Éthique & Déontologie' }
];

export const DEFAULT_TRAINING_CONFIG = {
  trainingType: 'qcm' as TrainingType,
  level: 'intermediaire' as UserLevel,
  domain: 'droit_administratif' as StudyDomain
};