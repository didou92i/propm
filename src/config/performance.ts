export const PERFORMANCE_CONFIG = {
  PRODUCTION: {
    maxMessages: 100,
    cleanupThreshold: 0.8,
    debounceDelay: 300,
    localStorageMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    enableDebugLogs: false,
    enableMetrics: true,
    cacheSize: 50
  },
  DEVELOPMENT: {
    maxMessages: 50,
    cleanupThreshold: 0.6,
    debounceDelay: 100,
    localStorageMaxAge: 1 * 24 * 60 * 60 * 1000, // 1 jour
    enableDebugLogs: true,
    enableMetrics: true,
    cacheSize: 20
  }
};

export const getPerformanceConfig = () => {
  return process.env.NODE_ENV === 'production' 
    ? PERFORMANCE_CONFIG.PRODUCTION 
    : PERFORMANCE_CONFIG.DEVELOPMENT;
};