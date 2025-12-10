/**
 * Logging utility for observability
 * Provides structured logging with different severity levels
 * [2025-12-10] 整合 Request ID 追蹤
 */

import { getRequestId } from './requestId';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId: string; // [2025 Best Practice] 分散式追蹤
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
   * [2025-12-10] 自動包含 Request ID
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
      requestId: getRequestId(), // [2025 Best Practice] 自動追蹤
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
   * [2025-12-10] 整合 Sentry 日誌服務
   * 參考: [Sentry React Logging Best Practices 2025](https://docs.sentry.io/platforms/javascript/guides/react/logs/)
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // 只在生產環境且有 Sentry DSN 時發送
    if (this.isDevelopment || !import.meta.env.VITE_SENTRY_DSN) {
      return;
    }

    try {
      // 動態載入 Sentry 避免增加初始 bundle 大小
      const Sentry = await import('@sentry/react');

      // 根據 log level 對應 Sentry severity
      const sentryLevel = this.mapLogLevelToSentryLevel(entry.level);

      // 使用 Sentry.captureMessage 結構化日誌
      Sentry.captureMessage(entry.message, {
        level: sentryLevel,
        extra: {
          ...entry.context,
          timestamp: entry.timestamp,
          requestId: entry.requestId, // [2025 Best Practice] 追蹤 Request ID
        },
        tags: {
          logLevel: entry.level,
          requestId: entry.requestId, // 作為 tag 方便過濾
        },
      });

      // 如果有 error 對象，使用 captureException 獲得更好的堆疊追蹤
      if (entry.error) {
        Sentry.captureException(entry.error, {
          extra: {
            message: entry.message,
            ...entry.context,
          },
        });
      }
    } catch (error) {
      // Sentry 載入失敗不應影響應用程式運作
      // 在開發環境才顯示錯誤
      if (this.isDevelopment) {
        console.error('Failed to send log to Sentry:', error);
      }
    }
  }

  /**
   * Map LogLevel to Sentry SeverityLevel
   * [2025 Best Practice] Sentry 支援: fatal, error, warning, log, info, debug
   */
  private mapLogLevelToSentryLevel(level: LogLevel): 'error' | 'warning' | 'info' | 'debug' {
    const mapping: Record<LogLevel, 'error' | 'warning' | 'info' | 'debug'> = {
      debug: 'debug',
      info: 'info',
      warn: 'warning',
      error: 'error',
    };
    return mapping[level];
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
   * [2025-12-10] Fire-and-forget async logging
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

    // Fire-and-forget: 不 await，避免阻塞主線程
    // 即使 Sentry 失敗也不影響應用程式
    void this.sendToExternalService(entry);
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
