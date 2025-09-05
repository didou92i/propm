/**
 * Enhanced logging utility for Beta version with advanced analytics
 * Provides comprehensive logging, metrics, and user behavior tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'performance' | 'user' | 'beta';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
  userAgent?: string;
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'agent_chat' | 'feature_usage';
  element?: string;
  value?: any;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  context?: Record<string, any>;
}

interface BetaAnalytics {
  featureUsage: Record<string, number>;
  errorFrequency: Record<string, number>;
  performanceMetrics: PerformanceMetric[];
  userJourney: string[];
  sessionDuration: number;
}

class Logger {
  private isProduction = import.meta.env.PROD;
  private isDevelopment = import.meta.env.DEV;
  private isBeta = true; // Activé pour la version beta
  private sessionId = crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  private analytics: BetaAnalytics = {
    featureUsage: {},
    errorFrequency: {},
    performanceMetrics: [],
    userJourney: [],
    sessionDuration: 0
  };

  constructor() {
    this.initializeSession();
    this.setupErrorHandling();
    this.setupPerformanceTracking();
  }

  private initializeSession() {
    if (typeof window !== 'undefined') {
      // Stockage persistant de la session
      this.sessionId = (sessionStorage.getItem('beta-session-id') || crypto.randomUUID()) as `${string}-${string}-${string}-${string}-${string}`;
      sessionStorage.setItem('beta-session-id', this.sessionId);
      
      // Initialiser les métriques de session
      this.analytics.sessionDuration = Date.now();
      
      // Écouter les événements de fermeture pour sauvegarder
      window.addEventListener('beforeunload', () => this.saveLogsToStorage());
      window.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.saveLogsToStorage();
        }
      });
    }
  }

  private setupErrorHandling() {
    if (typeof window !== 'undefined') {
      // Capture des erreurs JavaScript non gérées
      window.addEventListener('error', (event) => {
        this.error('Erreur JavaScript non gérée', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }, 'GlobalErrorHandler');
      });

      // Capture des promesses rejetées non gérées
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Promise rejetée non gérée', {
          reason: event.reason,
          stack: event.reason?.stack
        }, 'GlobalPromiseHandler');
      });
    }
  }

  private setupPerformanceTracking() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Tracking des Core Web Vitals
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.trackPerformance(entry.name, entry.duration, 'ms', {
              entryType: entry.entryType,
              startTime: entry.startTime
            });
          });
        });
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        this.warn('PerformanceObserver non supporté', error, 'Logger');
      }
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    const userId = this.getCurrentUserId();
    const route = typeof window !== 'undefined' ? window.location.pathname : '';
    
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component,
      userId,
      sessionId: this.sessionId,
      route,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      return localStorage.getItem('user-id') || undefined;
    } catch {
      return undefined;
    }
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
    
    // Sauvegarde périodique
    if (this.logBuffer.length % 50 === 0) {
      this.saveLogsToStorage();
    }
  }

  debug(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('debug', message, data, component);
    if (this.isDevelopment || this.isBeta) {
      console.debug(`[${entry.timestamp}] DEBUG ${component ? `[${component}]` : ''}: ${message}`, data || '');
      this.addToBuffer(entry);
    }
  }

  info(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('info', message, data, component);
    if (this.isDevelopment || this.isBeta) {
      console.info(`[${entry.timestamp}] INFO ${component ? `[${component}]` : ''}: ${message}`, data || '');
      this.addToBuffer(entry);
    }
  }

  warn(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('warn', message, data, component);
    console.warn(`[${entry.timestamp}] WARN ${component ? `[${component}]` : ''}: ${message}`, data || '');
    this.addToBuffer(entry);
    
    // Incrémenter le compteur d'erreurs
    this.analytics.errorFrequency[message] = (this.analytics.errorFrequency[message] || 0) + 1;
  }

  error(message: string, error?: any, component?: string) {
    const entry = this.formatMessage('error', message, error, component);
    console.error(`[${entry.timestamp}] ERROR ${component ? `[${component}]` : ''}: ${message}`, error || '');
    this.addToBuffer(entry);
    
    // Incrémenter le compteur d'erreurs critiques
    this.analytics.errorFrequency[`ERROR: ${message}`] = (this.analytics.errorFrequency[`ERROR: ${message}`] || 0) + 1;
  }

  // Audit logging amélioré pour la beta
  audit(action: string, data?: any, component?: string) {
    const entry = this.formatMessage('info', `AUDIT: ${action}`, data, component);
    console.info(`[${entry.timestamp}] AUDIT ${component ? `[${component}]` : ''}: ${action}`, data || '');
    this.addToBuffer(entry);
  }

  // Nouveaux logs spécialisés pour la beta
  beta(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('beta', `BETA: ${message}`, data, component);
    console.log(`[${entry.timestamp}] 🧪 BETA ${component ? `[${component}]` : ''}: ${message}`, data || '');
    this.addToBuffer(entry);
  }

  user(action: string, interaction: UserInteraction, component?: string) {
    const entry = this.formatMessage('user', `USER: ${action}`, interaction, component);
    this.addToBuffer(entry);
    
    // Analytics d'usage
    this.analytics.featureUsage[action] = (this.analytics.featureUsage[action] || 0) + 1;
    this.analytics.userJourney.push(`${Date.now()}: ${action}`);
    
    if (this.isDevelopment) {
      console.log(`[${entry.timestamp}] 👤 USER ${component ? `[${component}]` : ''}: ${action}`, interaction);
    }
  }

  trackPerformance(name: string, value: number, unit: string = 'ms', context?: Record<string, any>) {
    const metric: PerformanceMetric = { name, value, unit, context };
    this.analytics.performanceMetrics.push(metric);
    
    const entry = this.formatMessage('performance', `PERF: ${name}`, metric);
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.log(`[${entry.timestamp}] ⚡ PERF: ${name} = ${value}${unit}`, context || '');
    }
    
    // Alerte si performance dégradée
    if (name.includes('render') && value > 100) {
      this.warn(`Performance dégradée détectée: ${name} = ${value}${unit}`, context, 'PerformanceTracker');
    }
  }

  // Gestion du stockage local des logs
  saveLogsToStorage() {
    try {
      const logsData = {
        logs: this.logBuffer,
        analytics: this.analytics,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('beta-logs', JSON.stringify(logsData));
      localStorage.setItem('beta-logs-backup', JSON.stringify(logsData));
    } catch (error) {
      console.warn('Impossible de sauvegarder les logs:', error);
    }
  }

  loadLogsFromStorage(): LogEntry[] {
    try {
      const stored = localStorage.getItem('beta-logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.logs || [];
      }
    } catch (error) {
      this.warn('Impossible de charger les logs depuis le stockage', error, 'Logger');
    }
    return [];
  }

  getAnalytics(): BetaAnalytics {
    return {
      ...this.analytics,
      sessionDuration: Date.now() - this.analytics.sessionDuration
    };
  }

  getBufferedLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogs() {
    this.logBuffer = [];
    localStorage.removeItem('beta-logs');
    localStorage.removeItem('beta-logs-backup');
  }

  // Export des logs pour analyse
  exportLogs(): string {
    const exportData = {
      logs: this.logBuffer,
      analytics: this.getAnalytics(),
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}

export const logger = new Logger();