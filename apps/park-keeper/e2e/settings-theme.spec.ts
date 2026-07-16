import { test, expect } from '@playwright/test';
import { TEXT } from './helpers';

test.describe('設定 tab 主題切換', () => {
  test('切換主題後 --color-primary CSS 變數改變', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: TEXT.tabSettings }).click();

    const getPrimaryColor = () =>
      page.evaluate(() => document.documentElement.style.getPropertyValue('--color-primary'));

    const initialColor = await getPrimaryColor();

    // 主題名稱（Nitro/Kawaii/Zen/Classic）為 constants.ts 硬編字串，不隨語系翻譯。
    await page.getByRole('button', { name: 'Nitro' }).click();

    await expect.poll(getPrimaryColor).not.toBe(initialColor);
  });
});

test.describe('設定 tab 語言切換', () => {
  test('切換 English 後首頁文案即時英文化', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: TEXT.tabSettings }).click();
    await page.getByRole('button', { name: 'English' }).click();

    // 分頁標籤即時翻譯，回列表驗證首屏 CTA 文案。
    await page.getByRole('button', { name: 'LIST' }).click();
    await expect(page.getByTestId('quick-record-cta')).toContainText('Quick Record');
  });
});
