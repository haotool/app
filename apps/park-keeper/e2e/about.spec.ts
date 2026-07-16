import { test, expect } from '@playwright/test';

/**
 * SSG 頁面冷啟動 console gate（issue #725 P0）：
 * /about 為全站唯一真 SSG 頁，曾因 SSG（Node navigator→en）與 client（zh-TW）
 * 語言不一致觸發 React #418 hydration 錯誤；i18n 固定 lng='zh-TW' 後此 gate 鎖住回歸。
 * /guide 一併納入，杜絕同類缺陷無聲滑過。
 */
const COLD_START_ROUTES = [
  { path: 'about', heading: '停車好工具' },
  { path: 'guide', heading: '捷徑設定教學' },
] as const;

test.describe('SSG 頁面冷啟動 console gate', () => {
  for (const route of COLD_START_ROUTES) {
    test(`/${route.path} 冷啟動 0 console error 且 hydration 為 zh-TW`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      // 全新 context 直達（無任何前置操作），重現冷啟動情境。
      await page.goto(route.path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.heading);

      expect(consoleErrors).toEqual([]);
    });
  }

  test('/about 語言偏好於 hydration 後還原（不觸發 hydration 錯誤）', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    // 模擬使用者先前選定英文（LanguageDetector localStorage 快取）。
    await page.addInitScript(() => {
      localStorage.setItem('park-keeper-language', 'en');
    });
    await page.goto('about');

    // 首屏以 zh-TW hydrate，掛載後還原英文偏好。
    await expect(page.getByText('Smart parking recorder & navigation PWA')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
