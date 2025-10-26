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
  rateWisePage: async ({ page }, use) => {
    // Mock latest exchange rates
    await page.route('**/rates/latest.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExchangeRates),
      });
    });

    // Mock historical rates with dynamic date handling
    await page.route('**/rates/history/*.json', async (route) => {
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
    });

    // Navigate to app and wait for it to be ready
    await page.goto('/');

    // Wait for app to be fully loaded using multiple strategies
    // Strategy 1: Wait for loading indicator to disappear
    // [CSP-fix:2025-10-26] 更新載入文字以匹配 loading.css
    await page
      .waitForSelector('text=RateWise 載入中...', {
        state: 'hidden',
        timeout: 15000,
      })
      .catch(() => {
        // It's okay if the loading indicator is not found
      });

    // Strategy 2: Wait for app-ready marker
    await page
      .waitForFunction(() => document.body.dataset['appReady'] === 'true', { timeout: 15000 })
      .catch(() => {
        // Continue even if marker is not set - app might be ready anyway
      });

    // Strategy 3: Wait for key UI element (multi-currency button)
    await page.waitForSelector('button:has-text("多幣別")', {
      state: 'visible',
      timeout: 10000,
    });

    // Strategy 4: Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture 'use' parameter, not a React Hook
    await use(page);
  },
});

export { expect } from '@playwright/test';
