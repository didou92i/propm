// Centralized types and mappers for Prepa CDS

export type TrainingType =
  | 'qcm'
  | 'vrai_faux'
  | 'cas_pratique'
  | 'question_ouverte'
  | 'simulation_oral'
  | 'plan_revision';

export type UserLevel = 'debutant' | 'intermediaire' | 'avance';

// Canonical domains used by the Edge Function
export type StudyDomain =
  | 'droit_administratif'
  | 'droit_penal'
  | 'management'
  | 'redaction_administrative';

// UI domains used in controls
export type UiStudyDomain =
  | 'droit_public'
  | 'droit_penal'
  | 'management'
  | 'procedures'
  | 'redaction'
  | 'culture_generale';

// Service domains used by PrepaCdsService
export type ServiceStudyDomain =
  | 'droit_public'
  | 'droit_penal'
  | 'management'
  | 'redaction'
  | 'general';

export interface PrepaCdsConfig {
  level: UserLevel;
  domain: StudyDomain; // canonical
  trainingType: TrainingType | null;
}

export const DEFAULT_PREPA_CDS_CONFIG: PrepaCdsConfig = {
  level: 'intermediaire',
  domain: 'droit_administratif',
  trainingType: null,
};

// Mappers
export function mapUiToEdge(domain: UiStudyDomain): StudyDomain {
  const map: Record<UiStudyDomain, StudyDomain> = {
    droit_public: 'droit_administratif',
    procedures: 'droit_administratif',
    redaction: 'redaction_administrative',
    culture_generale: 'droit_administratif',
    droit_penal: 'droit_penal',
    management: 'management',
  };
  return map[domain] ?? 'droit_administratif';
}

export function mapServiceToEdge(domain: ServiceStudyDomain): StudyDomain {
  const map: Record<ServiceStudyDomain, StudyDomain> = {
    droit_public: 'droit_administratif',
    redaction: 'redaction_administrative',
    general: 'droit_administratif',
    droit_penal: 'droit_penal',
    management: 'management',
  };
  return map[domain] ?? 'droit_administratif';
}

export function mapEdgeToUi(domain: StudyDomain): UiStudyDomain {
  const map: Record<StudyDomain, UiStudyDomain> = {
    droit_administratif: 'droit_public',
    redaction_administrative: 'redaction',
    droit_penal: 'droit_penal',
    management: 'management',
  };
  return map[domain] ?? 'droit_public';
}

export interface TrainingSession {
  id: string;
  trainingType: TrainingType;
  level: UserLevel;
  domain: StudyDomain;
  content?: any;
  isActive: boolean;
  progress: number;
  score?: number;
}
