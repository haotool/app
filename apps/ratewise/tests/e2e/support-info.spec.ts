import { test, expect } from '@playwright/test';

const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const SUPPORT_INFO_ROUTES = [
  { path: '/settings/', h1: '設定' },
  { path: '/faq/', h1: '常見問題' },
  { path: '/guide/', h1: /如何使用 .* 進行匯率換算/ },
  { path: '/about/', h1: /關於 .* 匯率好工具/ },
  { path: '/privacy/', h1: '隱私政策' },
  { path: '/open-data/', h1: '開放資料 API' },
  { path: '/seo-tech/', h1: /SEO 架構/ },
] as const;

function withBasePath(path: string): string {
  if (BASE_PATH === '/') return path;
  return `${BASE_PATH.replace(/\/$/, '')}${path}`;
}

test.describe('支援與資訊頁 mobile/desktop guardrail', () => {
  for (const route of SUPPORT_INFO_ROUTES) {
    test(`${route.path} 應穩定呈現且不造成頁面水平溢位`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(withBasePath(route.path), { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('heading', { level: 1, name: route.h1 })).toBeVisible();

      const layout = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        return {
          viewportWidth: doc.clientWidth,
          scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
        };
      });

      expect(layout.scrollWidth, `${route.path} 不應造成 body 級水平溢位`).toBeLessThanOrEqual(
        layout.viewportWidth + 2,
      );
      expect(pageErrors, `${route.path} 不應有 pageerror`).toHaveLength(0);
      expect(consoleErrors, `${route.path} 不應有 console error`).toHaveLength(0);
    });
  }

  test('開放資料頁程式碼範例應提供 tab 語意', async ({ page }) => {
    await page.goto(withBasePath('/open-data/'), { waitUntil: 'domcontentloaded' });

    const tablist = page.getByRole('tablist', { name: '程式碼範例' });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab')).toHaveCount(4);
    await expect(tablist.getByRole('tab', { selected: true })).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});
