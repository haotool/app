import { test, expect } from '@playwright/test';

/**
 * 首屏快速記錄 CTA：iOS 捷徑 webapp:// 只能開 start_url，
 * 此 CTA 是 3-taps 預算的第一步（首屏 → /add 拍照步驟）。
 */
test.describe('首屏快速記錄 CTA', () => {
  test('點擊 CTA 進入 /add 並呈現拍照步驟', async ({ page }) => {
    await page.goto('/');

    const cta = page.getByRole('link', { name: '快速記錄' });
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/add$/);
    await expect(page.locator('input[type="file"][capture="environment"]')).toBeAttached();
    await expect(page.getByText('拍攝車位照片')).toBeVisible();
  });

  test('首屏提供捷徑教學入口', async ({ page }) => {
    await page.goto('/');

    const guideLink = page.getByRole('link', { name: '捷徑教學' });
    await expect(guideLink).toBeVisible();
    await guideLink.click();

    await expect(page).toHaveURL(/\/guide$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('捷徑設定教學');
  });
});
