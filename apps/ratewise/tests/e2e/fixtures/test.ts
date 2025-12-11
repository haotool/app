/**
 * Custom Playwright fixtures for RateWise E2E tests
 *
 * Provides automatic API mocking for all tests to ensure stability
 * and independence from external services.
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @see https://playwright.dev/docs/best-practices#mock-external-dependencies
 */

import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mockExchangeRates, mockHistoricalRates } from './mockRates';

interface RateWiseFixtures {
  /**
   * Page with automatic API mocking for exchange rates
   * This ensures tests don't depend on external CDN/API availability
   */
  rateWisePage: Page;
}

export const test = base.extend<RateWiseFixtures>({
  rateWisePage: async ({ page, context }, use) => {
    // [fix:2025-12-11] 簡化清理邏輯 - SW 已在 playwright.config.ts 中全局阻止
    // 依據: [context7:microsoft/playwright:2025-12-11] serviceWorkers: 'block' 配置
    // 這消除了 SW 攔截導致 "button not visible" 的根本原因
    await context.clearCookies();
    await context.clearPermissions();

    // 輔助函數：構建完整 URL
    const baseURL = process.env['PLAYWRIGHT_BASE_URL'] || '';
    const makeUrl = (path: string) =>
      baseURL ? new URL(path, baseURL).toString() : path.replace(/\/+$/, '') || '/';

    // Mock latest exchange rates
    // [2025-12-07] 使用函數匹配以正確攔截 GitHub raw URL
    // App 實際請求: https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json
    await page.route(
      (url) => {
        const urlString = url.toString();
        const matches = urlString.includes('/rates/latest.json');
        // eslint-disable-next-line no-console
        console.log('[Route Mock] Checking URL:', urlString, '| Matches:', matches);
        return matches;
      },
      async (route) => {
        // eslint-disable-next-line no-console
        console.log('[Route Mock] Intercepted! Returning mock data');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockExchangeRates),
        });
      },
    );

    // Mock historical rates with dynamic date handling
    await page.route(
      (url) => url.toString().match(/\/rates\/history\/.*\.json$/),
      async (route) => {
        const url = route.request().url();
        const dateMatch = /(\d{4}-\d{2}-\d{2})\.json/.exec(url);

        if (dateMatch) {
          const date = dateMatch[1];
          const historicalData = mockHistoricalRates[date as keyof typeof mockHistoricalRates];

          if (historicalData) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(historicalData),
            });
          } else {
            // Return 404 for dates we don't have mock data for
            await route.fulfill({
              status: 404,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Not found' }),
            });
          }
        } else {
          await route.fulfill({ status: 404 });
        }
      },
    );

    // Navigate to app and wait for it to be ready
    // [fix:2025-12-11] 簡化導航邏輯 - SW 已被阻止，頁面應該直接從 server 載入
    // @see [context7:microsoft/playwright:2025-12-11] Web-first assertions
    const basePathCandidates = [
      process.env['E2E_BASE_PATH'],
      process.env['VITE_BASE_PATH'],
      '/',
      '/ratewise/', // 生產環境 fallback
    ]
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) as string[];

    let navigated = false;
    const ciTimeout = process.env['CI'] ? 45_000 : 10_000;
    let lastError = '';

    for (const path of basePathCandidates) {
      try {
        // [fix:2025-12-11] 使用 load 事件等待，確保 HTML 完全載入
        // 依據: SW 被阻止後，頁面應該直接從 server 載入
        await page.goto(makeUrl(path), {
          waitUntil: 'load',
          timeout: ciTimeout,
        });

        // 驗證頁面標題（非 "unknown" 表示 HTML 正確載入）
        const title = await page.title();
        // eslint-disable-next-line no-console
        console.log(`[Fixture] Path ${path} - Page title: ${title}`);

        // [fix:2025-12-11] 等待 React hydration 完成
        // App.tsx 設置 data-app-ready="true" 作為 hydration 完成信號
        await page.waitForSelector('body[data-app-ready="true"]', {
          timeout: ciTimeout,
          state: 'attached',
        });

        // 使用 web-first assertion 等待按鈕可見
        // Playwright 會自動重試直到超時
        await page.getByRole('button', { name: /多幣別/i }).waitFor({
          state: 'visible',
          timeout: ciTimeout,
        });

        navigated = true;
        break;
      } catch (error) {
        lastError = `Path ${path}: ${error instanceof Error ? error.message : String(error)}`;
        // eslint-disable-next-line no-console
        console.log(`[Fixture] ${lastError}`);
      }
    }

    if (!navigated) {
      const currentUrl = page.url();
      const pageTitle = await page.title().catch(() => 'unknown');
      const pageContent = await page.content().catch(() => 'unable to get content');
      // eslint-disable-next-line no-console
      console.log(`[Fixture] Page content (first 500 chars): ${pageContent.slice(0, 500)}`);
      throw new Error(
        `Failed to load RateWise app from any base path.\n` +
          `Last error: ${lastError}\n` +
          `Current URL: ${currentUrl}\n` +
          `Page title: ${pageTitle}`,
      );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture 'use' parameter, not a React Hook
    await use(page);
  },
});

export { expect } from '@playwright/test';
