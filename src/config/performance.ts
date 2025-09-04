export const PERFORMANCE_CONFIG = {
  PRODUCTION: {
    maxMessages: 100,
    cleanupThreshold: 0.8,
    debounceDelay: 200, // Optimized for responsiveness
    localStorageMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    enableDebugLogs: false,
    enableMetrics: true,
    cacheSize: 50,
    // Ultra-optimized animation performance settings
    typewriterSpeed: 1.5, // Ultra-fast for production
    chunkSize: 4, // Larger chunks for faster display
    disableAnimations: false,
    adaptiveSpeed: true, // Auto-adjust speed based on message length
    // New performance optimization settings
    pollingOptimization: {
      initialInterval: 15, // Ultra-fast initial polling
      maxInterval: 250, // Conservative maximum
      backoffMultiplier: 1.2, // Gentle backoff
      maxAttempts: 70
    },
    cacheOptimization: {
      threadCacheDuration: 90 * 60 * 1000, // 90 minutes for production
      aggressiveCaching: true,
      preloadThreads: true
    },
    streamingOptimization: {
      immediateStart: true,
      adaptiveChunking: true,
      performanceAwareDelays: true
    }
  },
  DEVELOPMENT: {
    maxMessages: 50,
    cleanupThreshold: 0.6,
    debounceDelay: 50, // Ultra-responsive for development
    localStorageMaxAge: 1 * 24 * 60 * 60 * 1000, // 1 jour
    enableDebugLogs: true,
    enableMetrics: true,
    cacheSize: 20,
    // Fast animation performance settings
    typewriterSpeed: 1, // Ultra-fast for development
    chunkSize: 5, // Larger chunks for faster feedback
    disableAnimations: false,
    adaptiveSpeed: true,
    // Development performance optimization settings
    pollingOptimization: {
      initialInterval: 10, // Instant feedback in dev
      maxInterval: 200, // Fast maximum
      backoffMultiplier: 1.15, // Faster backoff
      maxAttempts: 60
    },
    cacheOptimization: {
      threadCacheDuration: 60 * 60 * 1000, // 60 minutes for development
      aggressiveCaching: false, // Less aggressive for debugging
      preloadThreads: false
    },
    streamingOptimization: {
      immediateStart: true,
      adaptiveChunking: true,
      performanceAwareDelays: true
    }
  }
};

export const getPerformanceConfig = () => {
  return process.env.NODE_ENV === 'production' 
    ? PERFORMANCE_CONFIG.PRODUCTION 
    : PERFORMANCE_CONFIG.DEVELOPMENT;
};

// Adaptive performance configuration based on runtime metrics
export const getAdaptivePerformanceConfig = (metrics?: {
  averageResponseTime: number;
  errorRate: number;
  requestCount: number;
}) => {
  const baseConfig = getPerformanceConfig();
  
  if (!metrics || metrics.requestCount < 5) {
    return baseConfig; // Return base config if no metrics yet
  }
  
  // Create adaptive configuration based on performance metrics
  const adaptiveConfig = { ...baseConfig };
  
  // Adjust based on response time performance
  if (metrics.averageResponseTime > 4000) {
    // Poor performance - maximize optimization
    adaptiveConfig.typewriterSpeed = Math.max(0.5, baseConfig.typewriterSpeed * 0.5);
    adaptiveConfig.chunkSize = Math.min(8, baseConfig.chunkSize + 2);
    adaptiveConfig.debounceDelay = Math.max(50, baseConfig.debounceDelay * 0.5);
    if ('pollingOptimization' in adaptiveConfig) {
      adaptiveConfig.pollingOptimization.initialInterval = Math.max(10, adaptiveConfig.pollingOptimization.initialInterval * 0.7);
    }
  } else if (metrics.averageResponseTime > 2000) {
    // Moderate performance - light optimization
    adaptiveConfig.typewriterSpeed = Math.max(1, baseConfig.typewriterSpeed * 0.8);
    adaptiveConfig.chunkSize = Math.min(6, baseConfig.chunkSize + 1);
    if ('pollingOptimization' in adaptiveConfig) {
      adaptiveConfig.pollingOptimization.initialInterval = Math.max(15, adaptiveConfig.pollingOptimization.initialInterval * 0.9);
    }
  }
  
  // Adjust based on error rate
  if (metrics.errorRate > 0.1) {
    // High error rate - increase reliability
    if ('pollingOptimization' in adaptiveConfig) {
      adaptiveConfig.pollingOptimization.maxAttempts = Math.min(100, adaptiveConfig.pollingOptimization.maxAttempts + 20);
      adaptiveConfig.pollingOptimization.backoffMultiplier = Math.min(2, adaptiveConfig.pollingOptimization.backoffMultiplier + 0.1);
    }
  }
  
  return adaptiveConfig;
};