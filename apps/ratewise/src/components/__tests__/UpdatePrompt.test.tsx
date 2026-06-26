/**
 * UpdatePrompt.tsx BDD Tests
 *
 * 驗證 PWA 更新提示元件的：
 * - 記憶體洩漏防護（setInterval 清理）
 * - SSOT tokens 引用
 * - i18n 多語系支援
 * - useReducedMotion 支援
 * - 更新狀態追蹤（offlineReady / needRefresh / isUpdating / updateFailed）
 * - SW 註冊失敗靜默降級，避免背景更新錯誤阻塞可用頁面
 * - offlineReady 首次安裝成功狀態保持靜默，避免 Lighthouse CLS
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

async function readDesignTokensSource() {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const tokensPath = path.resolve(__dirname, '../../config/design-tokens.ts');
  return fs.readFile(tokensPath, 'utf-8');
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
    expect(sourceCode).toContain('notificationTokens.mobileTopOffset');
    expect(sourceCode).toContain('notificationTokens.padding');
    expect(sourceCode).toContain('notificationTokens.borderRadius');
  });

  it('should use mobile top offset CSS variable to avoid blocking primary actions', async () => {
    const [sourceCode, designTokensSource] = await Promise.all([
      readSource(),
      readDesignTokensSource(),
    ]);
    expect(sourceCode).toContain('--notification-mobile-top-offset');
    expect(designTokensSource).toContain('top-[var(--notification-mobile-top-offset)]');
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

  it('should use support.* i18n keys for issue reporting', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain("t('support.reportIssueLead')");
    expect(sourceCode).toContain("t('support.reportIssueHint')");
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

describe('UpdatePrompt - 更新狀態與 SW 降級', () => {
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

  it('should log service worker registration errors without rendering a blocking prompt', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('onRegisterError');
    expect(sourceCode).toContain("logger.error('Service Worker registration error'");
    expect(sourceCode).not.toContain('setRegistrationFailed(true)');
    expect(sourceCode).not.toContain('const [registrationFailed');
    expect(sourceCode).not.toContain("t('pwa.registrationFailedTitle')");
  });

  it('should render support links only when an actual update action fails', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('SupportContactLinks');
    expect(sourceCode).toContain('{updateFailed ? (');
    expect(sourceCode).not.toContain('registrationFailed || updateFailed');
  });

  it('should handle update with try/catch for error recovery', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('await updateServiceWorker(true)');
    expect(sourceCode).toContain('setUpdateFailed(true)');
    expect(sourceCode).toContain('setIsUpdating(false)');
  });

  it('should auto-apply ready updates when online to keep users on the latest version', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('needRefresh');
    expect(sourceCode).toContain('navigator.onLine');
    expect(sourceCode).toContain('autoUpdateTriggeredRef');
  });
});

describe('UpdatePrompt - ARIA 語義', () => {
  it('should keep offlineReady silent to avoid first-load CLS', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('const shouldRender = needRefresh || isUpdating || updateFailed;');
    expect(sourceCode).not.toContain(
      'const shouldRender = offlineReady || needRefresh || isUpdating || updateFailed || registrationFailed;',
    );
    expect(sourceCode).not.toContain(
      'const shouldRender = needRefresh || isUpdating || updateFailed || registrationFailed;',
    );
  });

  it('should keep role="status" fallback for non-urgent rendered states', async () => {
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

describe('UpdatePrompt - Design token 通知語法', () => {
  it('should use notification background tokens', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.background.brand');
    expect(sourceCode).toContain('notificationTokens.background.brandBorder');
  });

  it('should use notification icon tokens', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.icon.brandGradient');
  });

  it('should use notification text tokens', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.text.brandTitle');
    expect(sourceCode).toContain('notificationTokens.text.brandDescription');
  });

  it('should use shared notification action tokens', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.actions.primary');
    expect(sourceCode).toContain('notificationTokens.actions.icon');
  });

  it('should NOT contain old hardcoded brand gradient classes', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).not.toContain('from-brand-from via-brand-via to-brand-to');
    expect(sourceCode).not.toContain('from-brand-icon-from to-brand-icon-to');
    expect(sourceCode).not.toContain('from-brand-button-from to-brand-button-to');
  });
});

describe('UpdatePrompt - offlineReady 靜默自動消失', () => {
  it('should have autoDismiss timer for silent offlineReady state', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('autoDismissRef');
    expect(sourceCode).toContain('notificationTokens.timing.autoDismiss');
  });
});

describe('UpdatePrompt - mobile interaction safety', () => {
  it('should make outer prompt container transparent to pointer events', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('pointer-events-none');
  });

  it('should keep the card itself interactive for buttons and links', async () => {
    const sourceCode = await readSource();
    expect(sourceCode).toContain('notificationTokens.actions.primary');
    expect(sourceCode).toContain('notificationTokens.actions.icon');
  });
});
