/**
 * Centralized logging utility for production-ready logging
 * Replaces console.log statements throughout the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
}

class Logger {
  private isProduction = import.meta.env.PROD;
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component
    };
  }

  debug(message: string, data?: any, component?: string) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('debug', message, data, component);
      console.debug(`[${entry.timestamp}] DEBUG ${component ? `[${component}]` : ''}: ${message}`, data || '');
    }
  }

  info(message: string, data?: any, component?: string) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('info', message, data, component);
      console.info(`[${entry.timestamp}] INFO ${component ? `[${component}]` : ''}: ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('warn', message, data, component);
    if (this.isDevelopment) {
      console.warn(`[${entry.timestamp}] WARN ${component ? `[${component}]` : ''}: ${message}`, data || '');
    }
    // In production, could send to monitoring service
  }

  error(message: string, error?: any, component?: string) {
    const entry = this.formatMessage('error', message, error, component);
    console.error(`[${entry.timestamp}] ERROR ${component ? `[${component}]` : ''}: ${message}`, error || '');
    // In production, should always log errors and send to monitoring service
  }

  // Silent logging for audit purposes (no console output)
  audit(action: string, data?: any, component?: string) {
    const entry = this.formatMessage('info', `AUDIT: ${action}`, data, component);
    // In production, send to audit logging service
    if (this.isDevelopment) {
      console.info(`[${entry.timestamp}] AUDIT ${component ? `[${component}]` : ''}: ${action}`, data || '');
    }
  }
}

export const logger = new Logger();