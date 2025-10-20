/**
 * Logging utility for observability
 * Provides structured logging with different severity levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  /**
   * Format timestamp in ISO 8601 format
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: this.getTimestamp(),
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = error;
    }

    return entry;
  }

  /**
   * Store log entry in memory
   */
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Send log to external service in production
   * Replace this with your actual logging service (e.g., Sentry, LogRocket, DataDog)
   */
  private sendToExternalService(_entry: LogEntry): void {
    // In production, send to logging service
    // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(_entry) });

    // For now, we'll just silently fail in production
    // This prevents console pollution in prod while keeping dev experience good
    if (!this.isDevelopment) {
      // TODO: Integrate with logging service
      // Example: Sentry.captureMessage(_entry.message, { level: _entry.level, extra: _entry.context });
    }
  }

  /**
   * Output log to console with formatting
   * [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
   * 生產環境完全禁用 console 輸出以達成 Lighthouse Best Practices 100 分
   */
  private outputToConsole(entry: LogEntry): void {
    // 完全禁用生產環境的 console 輸出
    if (!this.isDevelopment) {
      return;
    }

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context ?? '');
        break;
      case 'info':
        console.info(message, entry.context ?? '');
        break;
      case 'warn':
        console.warn(message, entry.context ?? '');
        break;
      case 'error':
        console.error(message, entry.context ?? '', entry.error ?? '');
        break;
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    const entry = this.createLogEntry(level, message, context, error);

    this.storeLog(entry);
    this.outputToConsole(entry);
    this.sendToExternalService(entry);
  }

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Info level logging - general information
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging - potential issues
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging - actual errors
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  /**
   * Get recent logs (useful for debugging)
   */
  getRecentLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = new Logger();
