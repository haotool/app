/**
 * /settings persisted 欄位冷載 hydration E2E（issue #666）。
 *
 * /settings 為預渲染頁；persisted 偏好與 SSG snapshot 不一致時，冷載（直接導覽）
 * 期間任何強制 client render 都不得產生 React #418 家族 console error。
 * 挑 3 個高風險欄位組合實測（盤點表破口欄位全覆蓋）：
 * 1. converterStore：singleConverterVariant=v2 ＋ rateMode=sell（issue 核心破口）
 * 2. ratewise-theme：style=nitro ＋ customPrimary（獨立 localStorage key）
 * 3. 全欄位疊加：variant/rateMode/theme/customPrimary/splash off ＋ wave-A legacy
 *    converter key（觸發 __migrateFromLegacy 的 hydration 窗口 set()，#653 情境）
 */

import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const SETTINGS_PATH = `${BASE_PATH}/settings`.replace(/\/{2,}/g, '/');

function collectConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  return consoleErrors;
}

// addInitScript 於下一次導覽生效；寫入 persisted 值後以 goto 冷載 /settings。
async function coldLoadSettings(page: Page, seed: () => void) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ratewise:pwa-install-guide-dismissed:v1', 'true');
  });
  await page.addInitScript(seed);
  await page.goto(SETTINGS_PATH);
  await expect(page.getByTestId('converter-variant-v2')).toBeVisible({ timeout: 30_000 });
}

test.describe('/settings persisted 欄位冷載（#666）', () => {
  test.beforeEach(() => {
    test.setTimeout(90_000);
  });

  test('組合 1：persisted v2＋sell 冷載 console 零錯誤、UI 呈現偏好', async ({
    rateWisePage: page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await coldLoadSettings(page, () => {
      const persisted = JSON.parse(localStorage.getItem('ratewise-converter') ?? '{}') as {
        state?: Record<string, unknown>;
        version?: number;
      };
      persisted.state = { ...persisted.state, singleConverterVariant: 'v2', rateMode: 'sell' };
      persisted.version ??= 0;
      localStorage.setItem('ratewise-converter', JSON.stringify(persisted));
    });

    // two-pass 切換後 UI 必須呈現 persisted 偏好（gate 不得吞掉使用者設定）。
    await expect(page.getByTestId('converter-variant-v2')).toHaveAttribute('aria-pressed', 'true');

    expect(consoleErrors).toEqual([]);
  });

  test('組合 2：persisted nitro＋customPrimary 冷載 console 零錯誤', async ({
    rateWisePage: page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await coldLoadSettings(page, () => {
      localStorage.setItem(
        'ratewise-theme',
        JSON.stringify({ style: 'nitro', customPrimary: '#FF6B6B' }),
      );
    });

    // 主題卡選中態呈現 persisted 偏好。
    await expect(page.getByRole('button', { name: /Nitro/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    expect(consoleErrors).toEqual([]);
  });

  test('組合 3：全欄位疊加＋wave-A legacy key 遷移冷載 console 零錯誤', async ({
    rateWisePage: page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    await coldLoadSettings(page, () => {
      // 移除 store key 讓 __migrateFromLegacy 走 wave-A legacy converter key 遷移，
      // 於 hydration 窗口內觸發 set()（#653 破口情境）。
      localStorage.removeItem('ratewise-converter');
      localStorage.setItem('ratewise:converterV2', 'v2');
      localStorage.setItem(
        'ratewise-theme',
        JSON.stringify({ style: 'custom', customPrimary: '#BE123C' }),
      );
      localStorage.setItem('ratewise-splash-enabled', '0');
    });

    // 遷移後偏好生效：v2 選中、splash 關閉、自訂主題選中。
    await expect(page.getByTestId('converter-variant-v2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    expect(consoleErrors).toEqual([]);
  });
});
