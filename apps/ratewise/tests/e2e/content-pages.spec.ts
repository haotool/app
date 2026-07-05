import { test, expect } from './fixtures/test';

/**
 * E4 內容頁導覽 smoke：七頁可達、統一骨架必備件在場。
 *
 * 驗證項目：
 * 1. 每頁可直接導覽並渲染 h1
 * 2. 返回導覽（PageNavHeader）在場
 * 3. 行動版（<768px）底部導覽在場（修復審計 P1-8）
 *
 * @see .claude/prds/ratewise-e4-internal-pages-design.md
 */

const CONTENT_PAGES = [
  { path: '/faq/', heading: /常見問題/ },
  { path: '/guide/', heading: /如何使用/ },
  { path: '/about/', heading: /關於/ },
  { path: '/privacy/', heading: /隱私政策/ },
  { path: '/open-data/', heading: /開放資料 API/ },
  { path: '/seo-tech/', heading: /SEO 架構/ },
  { path: '/open-source/', heading: /開放原始碼/ },
] as const;

// 與 fixtures/test.ts 相同的 base path 解析：本機 preview 服務於 /ratewise/。
const BASE_PATH = (
  process.env['E2E_BASE_PATH'] ??
  process.env['VITE_RATEWISE_BASE_PATH'] ??
  '/ratewise/'
).replace(/\/$/, '');

test.describe('內容頁統一骨架 smoke', () => {
  for (const { path, heading } of CONTENT_PAGES) {
    test(`${path} 可達且骨架必備件在場`, async ({ page, viewport }) => {
      await page.goto(`${BASE_PATH}${path}`);

      // h1 渲染（頁面可達且內容存在）。
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible({
        timeout: 15_000,
      });

      // 返回導覽在場。
      await expect(page.getByRole('button', { name: /返回|back/i }).first()).toBeVisible();

      // 行動版底部導覽在場（md 以上隱藏屬預期）。
      const bottomNavLink = page.locator('nav a[href*="settings"]').first();
      if (viewport && viewport.width < 768) {
        await expect(bottomNavLink).toBeVisible();
      } else {
        await expect(bottomNavLink).toBeAttached();
      }
    });
  }

  test('設定頁開放原始碼項目導向站內頁面', async ({ page }) => {
    await page.goto(`${BASE_PATH}/settings/`);
    const openSourceLink = page.getByRole('link', { name: /開放原始碼|open source/i }).last();
    await expect(openSourceLink).toBeVisible();
    await openSourceLink.click();
    await expect(page).toHaveURL(/\/open-source\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: /開放原始碼/ })).toBeVisible();
  });
});
