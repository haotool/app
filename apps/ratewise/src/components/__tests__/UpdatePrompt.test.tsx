/**
 * UpdatePrompt.tsx BDD Tests
 *
 * 驗證 PWA 更新提示元件的：
 * - 記憶體洩漏防護（setInterval 清理）
 * - SSOT tokens 引用
 * - i18n 多語系支援
 * - useReducedMotion 支援
 * - 4 個狀態（offlineReady / needRefresh / isUpdating / updateFailed）
 * - ARIA 語義化
 * - SSR 安全
 * - 單一實例渲染
 */

import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

async function readSource() {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const componentPath = path.resolve(__dirname, '../UpdatePrompt.tsx');
  return fs.readFile(componentPath, 'utf-8');
}

describe('UpdatePrompt - setInterval 洩漏防護', () => {
  it('should store interval ID for cleanup (no memory leak)', async () => {
    const sourceCode = await readSource();
    const hasStoredInterval =
      /(?:const|let|var)\s+\w+\s*=\s*setInterval/.test(sourceCode) ||
      /\.current\s*=\s*setInterval/.test(sourceCode);
    expect(hasStoredInterval).toBe(true);
  });

  it('should clear interval on cleanup', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('clearInterval');
  });
});

describe('UpdatePrompt - SSOT tokens 引用', () => {
  it('should import notificationTokens from design-tokens', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens');
    expect(sourceCode).toContain("from '../config/design-tokens'");
  });

  it('should use notificationTokens.timing for intervals', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.timing.updateInterval');
    expect(sourceCode).toContain('notificationTokens.timing.showDelay');
    expect(sourceCode).toContain('notificationTokens.timing.autoDismiss');
  });

  it('should use notificationTokens for layout', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.position');
    expect(sourceCode).toContain('notificationTokens.container');
    expect(sourceCode).toContain('notificationTokens.padding');
    expect(sourceCode).toContain('notificationTokens.borderRadius');
  });
});

describe('UpdatePrompt - i18n 多語系', () => {
  it('should use useTranslation hook', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('useTranslation');
  });

  it('should use pwa.* i18n keys for all states', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain("t('pwa.offlineReadyTitle')");
    expect(sourceCode).toContain("t('pwa.offlineReadyDescription')");
    expect(sourceCode).toContain("t('pwa.needRefreshTitle')");
    expect(sourceCode).toContain("t('pwa.needRefreshDescription')");
    expect(sourceCode).toContain("t('pwa.updatingTitle')");
    expect(sourceCode).toContain("t('pwa.updatingDescription')");
    expect(sourceCode).toContain("t('pwa.updateFailedTitle')");
    expect(sourceCode).toContain("t('pwa.updateFailedDescription')");
    expect(sourceCode).toContain("t('pwa.actionUpdate')");
    expect(sourceCode).toContain("t('pwa.actionClose')");
    expect(sourceCode).toContain("t('pwa.actionRetry')");
  });

  it('should NOT contain hardcoded Chinese strings for states', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).not.toContain('離線模式已就緒');
    expect(sourceCode).not.toContain('發現新版本');
    expect(sourceCode).not.toContain('隨時隨地都能使用');
    expect(sourceCode).not.toContain('點擊更新獲取最新功能');
    expect(sourceCode).not.toContain('更新應用程式');
    expect(sourceCode).not.toContain('關閉通知');
  });
});

describe('UpdatePrompt - useReducedMotion 支援', () => {
  it('should import and use useReducedMotion', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('useReducedMotion');
    expect(sourceCode).toContain('prefersReducedMotion');
  });

  it('should conditionally hide decorations for reduced motion', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain("prefersReducedMotion ? 'hidden' : ''");
  });
});

describe('UpdatePrompt - 4 個狀態', () => {
  it('should have isUpdating state', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('isUpdating');
    expect(sourceCode).toContain('setIsUpdating');
  });

  it('should have updateFailed state', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('updateFailed');
    expect(sourceCode).toContain('setUpdateFailed');
  });

  it('should handle update with try/catch for error recovery', async () => {
    const sourceCode = await readSource();
    // handleUpdate should catch errors and set updateFailed
    expect(sourceCode).toContain('await updateServiceWorker(true)');
    expect(sourceCode).toContain('setUpdateFailed(true)');
    expect(sourceCode).toContain('setIsUpdating(false)');
  });
});

describe('UpdatePrompt - ARIA 語義', () => {
  it('should use role="status" for offlineReady (low urgency)', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain("role={isUrgent ? 'alert' : 'status'}");
  });

  it('should use role="alert" for needRefresh/updateFailed (high urgency)', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain("aria-live={isUrgent ? 'assertive' : 'polite'}");
  });

  it('should NOT use alertdialog role', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).not.toContain('alertdialog');
  });
});

describe('UpdatePrompt - SSR 安全', () => {
  it('should check for window undefined at component level', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain("typeof window === 'undefined'");
  });
});

describe('UpdatePrompt - Design token 品牌配色', () => {
  it('should use brand gradient', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('from-brand-from via-brand-via to-brand-to');
  });

  it('should use brand border', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('border-brand-border');
  });

  it('should use brand icon gradient', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('from-brand-icon-from to-brand-icon-to');
  });

  it('should use brand text colors', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('text-brand-text-dark');
    expect(sourceCode).toContain('text-brand-text');
  });

  it('should use brand button gradient', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('from-brand-button-from to-brand-button-to');
  });

  it('should NOT use hardcoded blue/indigo/purple colors', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).not.toContain('from-blue-500 to-indigo-600');
    expect(sourceCode).not.toContain('text-blue-900');
    expect(sourceCode).not.toContain('text-indigo-700');
  });
});

describe('UpdatePrompt - offlineReady 自動消失', () => {
  it('should have autoDismiss timer for offlineReady', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('autoDismissRef');
    expect(sourceCode).toContain('notificationTokens.timing.autoDismiss');
  });
});
