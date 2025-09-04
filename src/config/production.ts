/**
 * Production Environment Configuration
 * This file configures all production settings for optimal performance
 */

// Production environment variables validation
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID'
];

const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Validate on module load in production
if (import.meta.env.PROD) {
  validateEnvironment();
}

export const PRODUCTION_CONFIG = {
  // Environment validation
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  
  // Performance settings
  enableDebugLogs: false,
  enableConsoleOutputs: false,
  enablePerformanceMetrics: true,
  
  // Error handling
  enableErrorTracking: true,
  enableAuditLogs: true,
  
  // Cache settings
  cacheMaxAge: 5 * 60 * 1000, // 5 minutes
  localStorageMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Animation settings
  enableAnimations: true,
  typewriterSpeed: 3, // ms per character
  
  // Security
  enableCSRFProtection: true,
  enableXSSProtection: true,
};

export { validateEnvironment };