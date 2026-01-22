/**
 * Custom Playwright fixtures for RateWise E2E tests
 *
 * Provides automatic API mocking for all tests to ensure stability
 * and independence from external services.
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @see https://playwright.dev/docs/best-practices#mock-external-dependencies
 * @see https://playwright.dev/docs/best-practices (web-first assertions)
 */

import { test as base, expect } from '@playwright/test';
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
    // Clear browser state for test isolation
    await context.clearCookies();
    await context.clearPermissions();

    // Build full URL from base path
    const baseURL = process.env['PLAYWRIGHT_BASE_URL'] || '';
    const makeUrl = (path: string) =>
      baseURL ? new URL(path, baseURL).toString() : path.replace(/\/+$/, '') || '/';

    // Mock latest exchange rates
    await page.route(
      (url) => url.toString().includes('/rates/latest.json'),
      async (route) => {
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

    // Navigate to app using web-first assertions (Playwright best practice)
    // @see https://playwright.dev/docs/best-practices#use-web-first-assertions
    const basePathCandidates = [
      process.env['E2E_BASE_PATH'],
      process.env['VITE_RATEWISE_BASE_PATH'],
      '/',
    ]
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) as string[];

    let navigated = false;
    let lastError = '';

    for (const path of basePathCandidates) {
      try {
        await page.goto(makeUrl(path), { waitUntil: 'domcontentloaded' });

        // Web-first assertion: wait for functional UI element instead of data attribute
        // This is more reliable than waiting for data-app-ready attribute
        // because it verifies actual React hydration completed
        await expect(page.getByRole('button', { name: /多幣別/i })).toBeVisible({
          timeout: 25_000,
        });

        navigated = true;
        break;
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

    await use(page);
  },
});

export { expect };
