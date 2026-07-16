import { test, expect, type Page } from '@playwright/test';

/**
 * 預渲染頁於 Service Worker 控制下的導覽回歸（issue #725 /about 前例、#733 擴充全 SSG 頁）：
 * SW NavigationRoute 若把預渲染頁回落 index.html（首頁殼），client 會以該頁路由樹
 * hydrate 首頁 HTML 觸發 React 418。全域 config block SW，此檔明確啟用以覆蓋真實 PWA 路徑。
 * SW 精確路由清單由 app.config.mjs SEO_PATHS 派生（sw.ts SSOT），此處鎖 round-2 缺陷頁。
 */
test.use({ serviceWorkers: 'allow' });

// 等待 SW 安裝並接管（activate 內 clients.claim）。
async function waitForServiceWorkerControl(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(null), {
        once: true,
      });
    });
  });
}

const SSG_SW_ROUTES = [
  { path: 'about', name: '/about', heading: '停車好工具' },
  { path: 'add', name: '/add', heading: '快速記錄' },
  { path: 'add?from=shortcut', name: '/add?from=shortcut（manifest 捷徑）', heading: '快速記錄' },
  { path: 'guide', name: '/guide', heading: '捷徑設定教學' },
] as const;

test.describe('SSG 頁面 Service Worker 導覽', () => {
  for (const route of SSG_SW_ROUTES) {
    test(`SW 接管後導覽 ${route.name} 回精確 SSG HTML 且 0 console error`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      await waitForServiceWorkerControl(page);

      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.heading);

      expect(consoleErrors).toEqual([]);
    });
  }

  test('SW 接管後 /add?from=shortcut 隱藏返回鍵（query 白名單於精確路由下仍生效）', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await waitForServiceWorkerControl(page);

    await page.goto('add?from=shortcut');
    await expect(page.getByTestId('quick-entry-photo-input')).toBeAttached();
    await expect(page.getByRole('link', { name: '返回首頁' })).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test('SW 接管後導覽 /about 內容完整（既有守門不回退）', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await waitForServiceWorkerControl(page);

    await page.goto('about');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('停車好工具');
    await expect(page.getByText('智慧停車記錄與導航 PWA')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
