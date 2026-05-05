import { test, expect } from '@playwright/test';
import { mockExchangeRates, mockHistoricalRates } from './fixtures/mockRates';

declare global {
  interface Window {
    __ratewiseClsDebug?: {
      getSnapshot: () => {
        cls: number;
        entries: Array<{
          value: number;
          startTime: number;
          sources: Array<{
            tag: string;
            id: string | null;
            testId: string | null;
            className: string | null;
            previousRect: DOMRectInit | null;
            currentRect: DOMRectInit | null;
          }>;
        }>;
      };
    };
  }
}

function formatFailureMessage(snapshot: {
  cls: number;
  entries: Array<{
    value: number;
    startTime: number;
    sources: Array<{
      tag: string;
      id: string | null;
      testId: string | null;
      className: string | null;
    }>;
  }>;
}) {
  const details = snapshot.entries
    .map((entry, index) => {
      const sources = entry.sources
        .map((source) =>
          [
            source.tag,
            source.id ? `#${source.id}` : null,
            source.testId ? `[data-testid=${source.testId}]` : null,
            source.className ? `.${source.className}` : null,
          ]
            .filter(Boolean)
            .join(''),
        )
        .join(', ');

      return `entry#${index + 1} value=${entry.value.toFixed(4)} time=${entry.startTime.toFixed(
        1,
      )}ms sources=${sources || 'unknown'}`;
    })
    .join('\n');

  return `首頁 CLS 超標：${snapshot.cls.toFixed(4)}\n${details}`;
}

async function mockRateApis(page: Parameters<typeof test>[0]['page']) {
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

  await page.route(
    (url) => /\/rates\/history\/.*\.json$/.test(url.toString()),
    async (route) => {
      const url = route.request().url();
      const dateMatch = /(\d{4}-\d{2}-\d{2})\.json/.exec(url);
      const date = dateMatch?.[1];
      const historicalData =
        date && date in mockHistoricalRates
          ? mockHistoricalRates[date as keyof typeof mockHistoricalRates]
          : null;

      if (!historicalData) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(historicalData),
      });
    },
  );
}

test.describe('首頁 CLS 可觀測性', () => {
  test('首頁不應以 skeleton 替換主內容造成可見 CLS', async ({ page, context }) => {
    await context.clearCookies();
    await context.clearPermissions();

    await mockRateApis(page);

    await page.addInitScript(() => {
      const entries: Array<{
        value: number;
        startTime: number;
        sources: Array<{
          tag: string;
          id: string | null;
          testId: string | null;
          className: string | null;
          previousRect: DOMRectInit | null;
          currentRect: DOMRectInit | null;
        }>;
      }> = [];

      let cls = 0;

      const toRect = (rect?: DOMRectReadOnly | null): DOMRectInit | null => {
        if (!rect) return null;
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        };
      };

      const describeNode = (node: Node | null) => {
        if (!(node instanceof Element)) {
          return null;
        }

        const className =
          typeof node.className === 'string'
            ? node.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
            : null;

        return {
          tag: node.tagName.toLowerCase(),
          id: node.id || null,
          testId: node.getAttribute('data-testid'),
          className: className || null,
        };
      };

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
            sources?: Array<{
              node?: Node | null;
              previousRect?: DOMRectReadOnly | null;
              currentRect?: DOMRectReadOnly | null;
            }>;
          }
        >) {
          if (entry.hadRecentInput) continue;

          cls += entry.value;
          entries.push({
            value: entry.value,
            startTime: entry.startTime,
            sources:
              entry.sources
                ?.map((source) => {
                  const node = describeNode(source.node ?? null);
                  if (!node) return null;

                  return {
                    ...node,
                    previousRect: toRect(source.previousRect),
                    currentRect: toRect(source.currentRect),
                  };
                })
                .filter((source): source is NonNullable<typeof source> => Boolean(source)) ?? [],
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });

      window.__ratewiseClsDebug = {
        getSnapshot: () => ({ cls, entries }),
      };
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /多幣別/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('amount-input')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);

    const snapshot = await page.evaluate(() => window.__ratewiseClsDebug?.getSnapshot());

    expect(snapshot, 'CLS snapshot should be available').toBeTruthy();
    expect(
      snapshot!.cls,
      snapshot ? formatFailureMessage(snapshot) : '首頁 CLS snapshot 缺失',
    ).toBeLessThan(0.1);
  });
});
