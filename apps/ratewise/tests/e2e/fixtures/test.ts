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
    ].filter(Boolean) as string[];

    let navigated = false;
    for (const path of basePathCandidates) {
      await page.goto(path);

      // Single semantic check - Playwright auto-waits for actionability
      const isVisible = await page
        .getByRole('button', { name: /多幣別/i })
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (isVisible) {
        navigated = true;
        break;
      }
    }

    if (!navigated) {
      throw new Error('Failed to load RateWise app from any base path');
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture 'use' parameter, not a React Hook
    await use(page);
  },
});

export { expect } from '@playwright/test';
