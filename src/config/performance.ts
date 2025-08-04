export const PERFORMANCE_CONFIG = {
  PRODUCTION: {
    maxMessages: 100,
    cleanupThreshold: 0.8,
    debounceDelay: 300,
    localStorageMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    enableDebugLogs: false,
    enableMetrics: true,
    cacheSize: 50,
    // Animation performance settings
    typewriterSpeed: 3, // 3ms per character for production
    chunkSize: 3, // Characters revealed per chunk
    disableAnimations: false,
    adaptiveSpeed: true // Auto-adjust speed based on message length
  },
  DEVELOPMENT: {
    maxMessages: 50,
    cleanupThreshold: 0.6,
    debounceDelay: 100,
    localStorageMaxAge: 1 * 24 * 60 * 60 * 1000, // 1 jour
    enableDebugLogs: true,
    enableMetrics: true,
    cacheSize: 20,
    // Animation performance settings
    typewriterSpeed: 5, // 5ms per character for development
    chunkSize: 2, // Characters revealed per chunk
    disableAnimations: false,
    adaptiveSpeed: true
  }
};

export const getPerformanceConfig = () => {
  return process.env.NODE_ENV === 'production' 
    ? PERFORMANCE_CONFIG.PRODUCTION 
    : PERFORMANCE_CONFIG.DEVELOPMENT;
};