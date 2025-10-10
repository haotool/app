import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Clear logs before each test
    logger.clearLogs();
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
  });

  describe('debug()', () => {
    it('logs debug messages', () => {
      logger.debug('Test debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Test debug message');
    });

    it('includes context in debug logs', () => {
      const context = { userId: '123', action: 'click' };
      logger.debug('User action', context);

      const logs = logger.getRecentLogs();
      expect(logs[0].context).toEqual(context);
    });
  });

  describe('info()', () => {
    it('logs info messages', () => {
      logger.info('Test info message');

      expect(consoleSpy.info).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test info message');
    });
  });

  describe('warn()', () => {
    it('logs warning messages', () => {
      logger.warn('Test warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Test warning message');
    });
  });

  describe('error()', () => {
    it('logs error messages', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);

      expect(consoleSpy.error).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Test error message');
      expect(logs[0].error).toBe(error);
    });

    it('includes context with error logs', () => {
      const error = new Error('Test error');
      const context = { component: 'App', action: 'mount' };
      logger.error('Component error', error, context);

      const logs = logger.getRecentLogs();
      expect(logs[0].context).toEqual(context);
    });
  });

  describe('getRecentLogs()', () => {
    it('returns all logged entries', () => {
      logger.debug('Debug 1');
      logger.info('Info 1');
      logger.warn('Warn 1');
      logger.error('Error 1');

      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(4);
    });

    it('maintains log order', () => {
      logger.info('First');
      logger.info('Second');
      logger.info('Third');

      const logs = logger.getRecentLogs();
      expect(logs[0].message).toBe('First');
      expect(logs[1].message).toBe('Second');
      expect(logs[2].message).toBe('Third');
    });
  });

  describe('clearLogs()', () => {
    it('removes all stored logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      expect(logger.getRecentLogs()).toHaveLength(2);

      logger.clearLogs();
      expect(logger.getRecentLogs()).toHaveLength(0);
    });
  });

  describe('timestamp', () => {
    it('includes ISO 8601 timestamp in log entries', () => {
      logger.info('Test message');

      const logs = logger.getRecentLogs();
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
