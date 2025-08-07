import { useEffect, useState, useCallback } from 'react';
import {
  DEFAULT_PREPA_CDS_CONFIG,
  PrepaCdsConfig,
  TrainingType,
  UserLevel,
  StudyDomain,
} from '@/types/prepacds';

const STORAGE_KEY = 'prepacds:config';

function readFromStorage(): PrepaCdsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREPA_CDS_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PrepaCdsConfig>;
    return {
      level: parsed.level ?? DEFAULT_PREPA_CDS_CONFIG.level,
      domain: parsed.domain ?? DEFAULT_PREPA_CDS_CONFIG.domain,
      trainingType: parsed.trainingType ?? DEFAULT_PREPA_CDS_CONFIG.trainingType,
    };
  } catch {
    return DEFAULT_PREPA_CDS_CONFIG;
  }
}

export function usePrepaCdsConfig() {
  const [config, setConfig] = useState<PrepaCdsConfig>(() => readFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  const updateConfig = useCallback((partial: Partial<PrepaCdsConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const setLevel = useCallback((level: UserLevel) => updateConfig({ level }), [updateConfig]);
  const setDomain = useCallback((domain: StudyDomain) => updateConfig({ domain }), [updateConfig]);
  const setTrainingType = useCallback((trainingType: TrainingType | null) => updateConfig({ trainingType }), [updateConfig]);

  return {
    config,
    setConfig,
    updateConfig,
    setLevel,
    setDomain,
    setTrainingType,
  };
}
