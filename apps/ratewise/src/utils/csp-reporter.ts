/**
 * CSP Violation Reporter
 *
 * 監控 Content Security Policy 違規並上報到 logger
 *
 * 功能：
 * - 監聽 securitypolicyviolation 事件
 * - 記錄違規詳情（blockedURI, violatedDirective 等）
 * - 區分阻止性違規和 report-only 違規
 *
 * 使用方式：
 * ```typescript
 * import { initCSPReporter } from './utils/csp-reporter';
 *
 * if (isClient) {
 *   initCSPReporter();
 * }
 * ```
 *
 * 參考：
 * - [MDN: SecurityPolicyViolationEvent](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent)
 * - [W3C: CSP Level 3](https://www.w3.org/TR/CSP3/)
 *
 * 最後更新：2025-11-26
 */

import { logger } from './logger';

export interface CSPViolation {
  blockedURI: string;
  violatedDirective: string;
  effectiveDirective: string;
  originalPolicy: string;
  disposition: 'enforce' | 'report';
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
  statusCode: number;
}

/**
 * 初始化 CSP 違規監控
 *
 * 在客戶端環境中監聽 CSP 違規事件並記錄到 logger
 */
export function initCSPReporter(): void {
  if (typeof window === 'undefined') return;

  // 監聽 CSP 違規事件
  document.addEventListener('securitypolicyviolation', (event: SecurityPolicyViolationEvent) => {
    const violation: CSPViolation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      disposition: event.disposition as 'enforce' | 'report',
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      statusCode: event.statusCode,
    };

    // 根據 disposition 決定日誌級別
    if (violation.disposition === 'enforce') {
      // 阻止性違規 - 警告級別
      logger.warn('CSP Violation (Blocked)', {
        blockedURI: violation.blockedURI,
        violatedDirective: violation.violatedDirective,
        effectiveDirective: violation.effectiveDirective,
        sourceFile: violation.sourceFile,
        lineNumber: violation.lineNumber,
      });
    } else {
      // Report-only 違規 - 資訊級別
      logger.info('CSP Violation (Report-Only)', {
        blockedURI: violation.blockedURI,
        violatedDirective: violation.violatedDirective,
        effectiveDirective: violation.effectiveDirective,
        sourceFile: violation.sourceFile,
        lineNumber: violation.lineNumber,
      });
    }

    // 特別關注 Trusted Types 違規
    if (violation.violatedDirective.includes('trusted-types')) {
      logger.debug('Trusted Types Violation', {
        blockedURI: violation.blockedURI,
        sourceFile: violation.sourceFile,
        disposition: violation.disposition,
      });
    }

    // 特別關注 Rocket Loader 相關違規（應該不會出現，但監控以防萬一）
    if (
      violation.blockedURI.includes('rocket-loader') ||
      violation.sourceFile.includes('rocket-loader')
    ) {
      logger.error('Rocket Loader CSP Violation (Should Not Happen)', {
        blockedURI: violation.blockedURI,
        sourceFile: violation.sourceFile,
        violatedDirective: violation.violatedDirective,
      });
    }
  });

  logger.debug('CSP Reporter initialized');
}

/**
 * 手動報告 CSP 違規（用於測試）
 *
 * @param violation - 違規詳情
 */
export function reportCSPViolation(violation: Partial<CSPViolation>): void {
  logger.warn('Manual CSP Violation Report', {
    blockedURI: violation.blockedURI,
    violatedDirective: violation.violatedDirective,
    disposition: violation.disposition,
  });
}
