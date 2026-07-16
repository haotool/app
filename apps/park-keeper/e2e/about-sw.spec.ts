import { test, expect } from '@playwright/test';

/**
 * /about 於 Service Worker 控制下的導覽回歸（issue #725 P0 補洞）：
 * SW NavigationRoute 若把 /about 回落 index.html（首頁殼），client 會以 /about 樹
 * hydrate 首頁 HTML 觸發 React 418。全域 config block SW，此檔明確啟用以覆蓋真實 PWA 路徑。
 */
test.use({ serviceWorkers: 'allow' });

test.describe('/about Service Worker 導覽', () => {
  test('SW 接管後導覽 /about 仍回精確 SSG HTML 且 0 console error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/');
    // 等待 SW 安裝並接管（activate 內 clients.claim）。
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (navigator.serviceWorker.controller) return;
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(null), {
          once: true,
        });
      });
    });

    await page.goto('about');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('停車好工具');
    await expect(page.getByText('智慧停車記錄與導航 PWA')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
