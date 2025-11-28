/**
 * CSP Reporter 單元測試
 *
 * 測試 CSP 違規監控功能
 *
 * @module csp-reporter.test
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { initCSPReporter, reportCSPViolation, type CSPViolation } from './csp-reporter';
import { logger } from './logger';

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('csp-reporter', () => {
  let eventHandler: ((event: SecurityPolicyViolationEvent) => void) | null = null;
  let addEventListenerMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandler = null;

    // Create a mock for addEventListener that captures the handler
    addEventListenerMock = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'securitypolicyviolation' && typeof listener === 'function') {
        eventHandler = listener as (event: SecurityPolicyViolationEvent) => void;
      }
    });

    // Mock document.addEventListener
    vi.spyOn(document, 'addEventListener').mockImplementation(
      addEventListenerMock as unknown as typeof document.addEventListener,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    eventHandler = null;
  });

  describe('initCSPReporter', () => {
    it('should register securitypolicyviolation event listener', () => {
      initCSPReporter();

      expect(addEventListenerMock).toHaveBeenCalledWith(
        'securitypolicyviolation',
        expect.any(Function),
      );
      expect(logger.debug).toHaveBeenCalledWith('CSP Reporter initialized');
    });

    it('should not register listener in non-browser environment', () => {
      // Temporarily make window undefined
      const windowSpy = vi.spyOn(globalThis, 'window', 'get');
      windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);

      initCSPReporter();

      expect(addEventListenerMock).not.toHaveBeenCalled();

      windowSpy.mockRestore();
    });

    it('should log warn for enforce disposition violations', () => {
      initCSPReporter();

      // Create a mock CSP violation event
      const mockEvent = {
        blockedURI: 'https://evil.com/script.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        originalPolicy: "script-src 'self'",
        disposition: 'enforce',
        sourceFile: 'https://example.com/page.html',
        lineNumber: 10,
        columnNumber: 5,
        statusCode: 200,
      } as SecurityPolicyViolationEvent;

      // Trigger the callback
      eventHandler?.(mockEvent);

      expect(logger.warn).toHaveBeenCalledWith('CSP Violation (Blocked)', {
        blockedURI: 'https://evil.com/script.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        sourceFile: 'https://example.com/page.html',
        lineNumber: 10,
      });
    });

    it('should log info for report-only disposition violations', () => {
      initCSPReporter();

      const mockEvent = {
        blockedURI: 'https://cdn.example.com/lib.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        originalPolicy: "script-src 'self'",
        disposition: 'report',
        sourceFile: 'https://example.com/app.js',
        lineNumber: 25,
        columnNumber: 1,
        statusCode: 200,
      } as SecurityPolicyViolationEvent;

      eventHandler?.(mockEvent);

      expect(logger.info).toHaveBeenCalledWith('CSP Violation (Report-Only)', {
        blockedURI: 'https://cdn.example.com/lib.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        sourceFile: 'https://example.com/app.js',
        lineNumber: 25,
      });
    });

    it('should log debug for Trusted Types violations', () => {
      initCSPReporter();

      const mockEvent = {
        blockedURI: '',
        violatedDirective: 'require-trusted-types-for',
        effectiveDirective: 'trusted-types',
        originalPolicy: "require-trusted-types-for 'script'",
        disposition: 'report',
        sourceFile: 'https://example.com/main.js',
        lineNumber: 100,
        columnNumber: 15,
        statusCode: 200,
      } as SecurityPolicyViolationEvent;

      eventHandler?.(mockEvent);

      expect(logger.debug).toHaveBeenCalledWith('Trusted Types Violation', {
        blockedURI: '',
        sourceFile: 'https://example.com/main.js',
        disposition: 'report',
      });
    });

    it('should log error for Rocket Loader violations', () => {
      initCSPReporter();

      const mockEvent = {
        blockedURI: 'https://ajax.cloudflare.com/cdn-cgi/scripts/rocket-loader.min.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        originalPolicy: "script-src 'self'",
        disposition: 'enforce',
        sourceFile: 'https://example.com/page.html',
        lineNumber: 1,
        columnNumber: 1,
        statusCode: 200,
      } as SecurityPolicyViolationEvent;

      eventHandler?.(mockEvent);

      expect(logger.error).toHaveBeenCalledWith(
        'Rocket Loader CSP Violation (Should Not Happen)',
        undefined,
        {
          blockedURI: 'https://ajax.cloudflare.com/cdn-cgi/scripts/rocket-loader.min.js',
          sourceFile: 'https://example.com/page.html',
          violatedDirective: 'script-src',
        },
      );
    });

    it('should log error for violations from Rocket Loader source file', () => {
      initCSPReporter();

      const mockEvent = {
        blockedURI: 'inline',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        originalPolicy: "script-src 'self'",
        disposition: 'enforce',
        sourceFile: 'https://ajax.cloudflare.com/cdn-cgi/scripts/rocket-loader.min.js',
        lineNumber: 50,
        columnNumber: 10,
        statusCode: 200,
      } as SecurityPolicyViolationEvent;

      eventHandler?.(mockEvent);

      expect(logger.error).toHaveBeenCalledWith(
        'Rocket Loader CSP Violation (Should Not Happen)',
        undefined,
        expect.objectContaining({
          sourceFile: 'https://ajax.cloudflare.com/cdn-cgi/scripts/rocket-loader.min.js',
        }),
      );
    });
  });

  describe('reportCSPViolation', () => {
    it('should log manual CSP violation report', () => {
      const violation: Partial<CSPViolation> = {
        blockedURI: 'https://test.com/malicious.js',
        violatedDirective: 'script-src',
        disposition: 'enforce',
      };

      reportCSPViolation(violation);

      expect(logger.warn).toHaveBeenCalledWith('Manual CSP Violation Report', {
        blockedURI: 'https://test.com/malicious.js',
        violatedDirective: 'script-src',
        disposition: 'enforce',
      });
    });

    it('should handle partial violation data', () => {
      reportCSPViolation({});

      expect(logger.warn).toHaveBeenCalledWith('Manual CSP Violation Report', {
        blockedURI: undefined,
        violatedDirective: undefined,
        disposition: undefined,
      });
    });
  });
});
