import { test, expect } from '@playwright/test';

const BASE_PATH =
  `${process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise'}/`.replace(
    /\/+$/,
    '/',
  );
test.use({ serviceWorkers: 'allow' });

for (const [language, sourceLabel] of [
  ['zh-TW', '選擇來源貨幣'],
  ['en', 'Select source currency'],
  ['ja', '変換元通貨を選択'],
  ['ko', '출발 통화 선택'],
]) {
  test(`品牌字型與 ${language} 語系重新開啟無 hydration 錯誤`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript((lang) => localStorage.setItem('ratewise-language', lang), language);
    await page.goto(BASE_PATH);
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute('data-ratewise-app-ready'),
    );
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await expect(page.getByRole('combobox', { name: sourceLabel, exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(document.fonts).some(
            (font) => font.family === 'Nunito Wordmark' && font.status === 'loaded',
          ),
        ),
      )
      .toBe(true);
    expect(await page.locator('link[rel="preload"][as="font"]').count()).toBe(1);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem('ratewise-language'))).toBe(language);
  });
}

test.describe('Service Worker shell 背景預熱失敗', () => {
  test('快取被清除且離線時回傳 503，頁面導覽仍有離線回退', async ({ page, context }) => {
    await page.goto(BASE_PATH);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.evaluate(async () => {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    });
    await context.setOffline(true);
    try {
      const status = await page.evaluate(async (path) => (await fetch(path)).status, BASE_PATH);
      expect(status).toBe(503);
      const response = await page.reload();
      expect(response?.status()).toBe(200);
    } finally {
      await context.setOffline(false);
    }
  });
});
