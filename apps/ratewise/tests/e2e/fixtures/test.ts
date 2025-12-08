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
    // [2025-12-07] Clear browser storage to prevent interference with route mocks
    // Use Playwright's native API instead of evaluating in about:blank
    await context.clearCookies();
    await context.clearPermissions();

    // Clear service workers by navigating to the app and unregistering
    const baseURL = process.env['PLAYWRIGHT_BASE_URL'] || '';
    const makeUrl = (path: string) =>
      baseURL ? new URL(path, baseURL).toString() : path.replace(/\/+$/, '') || '/';

    await page.goto(makeUrl('/'));
    await page.evaluate(async () => {
      // Clear service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      // Clear localStorage
      localStorage.clear();

      // Clear caches
      if ('caches' in globalThis) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    });

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
    // [2025-11-23] Base path detection with Playwright 2025 best practices:
    // - Support multiple base paths (/, /ratewise/) for different build configs
    // - Use semantic locator (getByRole) instead of waitForSelector
    // - Rely on auto-waiting, remove redundant strategies (networkidle, multiple checks)
    // @see https://playwright.dev/docs/best-practices
    const basePathCandidates = [
      process.env['E2E_BASE_PATH'],
      process.env['VITE_BASE_PATH'],
      '/ratewise/',
      '/',
    ]
      .filter(Boolean)
      // 去重，避免重複嘗試相同路徑
      .filter((value, index, self) => self.indexOf(value) === index) as string[];

    let navigated = false;
    // [2025-12-07] 增加 CI timeout 從 15s → 30s 以處理慢 CI workers 的 React hydration
    // @see [context7:microsoft/playwright:2025-12-07] Flaky test fixes
    const ciTimeout = process.env['CI'] ? 30000 : 6000;
    let lastError = '';

    for (const path of basePathCandidates) {
      try {
        // 使用 domcontentloaded 加速初始載入
        await page.goto(makeUrl(path), { waitUntil: 'domcontentloaded' });

        // 等待 load 事件確保資源完全載入
        await page.waitForLoadState('load').catch(() => {});

        // [2025-12-07] 等待 React root 元素確保 hydration 完成
        // 這避免在 React 應用初始化前就檢查按鈕
        await page
          .locator('#root')
          .waitFor({ timeout: 5000 })
          .catch(() => {});

        // Single semantic check - Playwright auto-waits for actionability
        const isVisible = await page
          .getByRole('button', { name: /多幣別/i })
          .isVisible({ timeout: ciTimeout })
          .catch(() => false);

        if (isVisible) {
          navigated = true;
          break;
        }

        lastError = `Path ${path}: button not visible`;
      } catch (error) {
        lastError = `Path ${path}: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    if (!navigated) {
      const currentUrl = page.url();
      const pageTitle = await page.title().catch(() => 'unknown');
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
