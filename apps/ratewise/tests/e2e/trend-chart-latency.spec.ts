import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { mockExchangeRates } from './fixtures/mockRates';

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173';
const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const BASE = `${BASE_URL}${BASE_PATH}/`.replace(/\/+$/, '/');
const TREND_CHART_MAX_MS = Number.parseInt(process.env['TREND_CHART_MAX_MS'] || '3000', 10);

async function mockRatesApi(page: Page): Promise<void> {
  await page.route(
    (url) => url.toString().includes('/rates/latest.json'),
    async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExchangeRates),
      }),
  );

  await page.route(
    (url) => url.toString().match(/\/rates\/history\/.*\.json$/),
    async (route) => {
      const requestUrl = route.request().url();
      const dateMatch = /(\d{4}-\d{2}-\d{2})\.json/.exec(requestUrl);
      const date = dateMatch?.[1];

      if (date) {
        const [, , dayText] = date.split('-');
        const dayOffset = Number.parseInt(dayText || '0', 10) || 0;
        const usdRate = 31.07 + ((dayOffset % 5) - 2) * 0.03;
        const eurRate = 36.31 + ((dayOffset % 7) - 3) * 0.04;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockExchangeRates,
            date,
            updateTime: `${date}T03:18:12+08:00`,
            rates: {
              ...mockExchangeRates.rates,
              USD: Number(usdRate.toFixed(4)),
              EUR: Number(eurRate.toFixed(4)),
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    },
  );
}

test.describe('趨勢圖載入延遲', () => {
  test.use({ serviceWorkers: 'block' });
  test.setTimeout(30_000);

  test('首頁趨勢圖應在延遲預算內出現', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __trendChartStart?: number }).__trendChartStart = performance.now();
    });

    await mockRatesApi(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('trend-chart')).toBeVisible();
    await expect(page.getByTestId('mini-trend-chart')).toBeVisible({
      timeout: Math.max(TREND_CHART_MAX_MS + 5_000, 10_000),
    });

    const elapsedMs = await page.evaluate(() => {
      const win = window as Window & { __trendChartStart?: number };
      return performance.now() - (win.__trendChartStart ?? 0);
    });

    console.log(`[trend-chart-latency] elapsed=${elapsedMs.toFixed(0)}ms base=${BASE}`);

    expect(
      elapsedMs,
      `趨勢圖應在 ${TREND_CHART_MAX_MS}ms 內可見，避免回退到「10 秒後才開始載入」`,
    ).toBeLessThanOrEqual(TREND_CHART_MAX_MS);
  });
});
