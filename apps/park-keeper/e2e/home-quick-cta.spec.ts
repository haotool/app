import { test, expect } from '@playwright/test';
import { TEST_PHOTO_BASE64 } from './helpers';

/**
 * 首屏拍照 hero CTA：label 直包 capture input，tap 即開系統相機；
 * 拍照(1)→樓層(=儲存)(2) 共 2 taps（iOS webapp:// 只開首頁，此 CTA 即旗艦入口）。
 */
test.describe('首屏快速記錄 CTA', () => {
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 25.033, longitude: 121.5654 },
  });

  test('CTA 注入照片後開啟快速記錄並完成儲存', async ({ page }) => {
    await page.goto('/');

    // 拍照 hero：label 直包 capture input（無導覽跳頁）。
    const cta = page.getByTestId('quick-record-cta');
    await expect(cta).toBeVisible();
    await page.getByTestId('quick-record-cta-input').setInputFiles({
      name: 'cta-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TEST_PHOTO_BASE64, 'base64'),
    });

    // 快速記錄面板開啟且照片已預設帶入。
    await expect(page.getByTestId('quick-entry-handle')).toBeVisible();
    await expect(page.getByAltText('車位照片')).toBeVisible();

    // 樓層 tap 即儲存，關閉面板後紀錄出現在列表。
    await page.getByRole('button', { name: 'B2', exact: true }).click();
    await expect(page.getByTestId('quick-entry-handle')).toHaveCount(0);
    await expect(page.getByText('B2', { exact: true }).first()).toBeVisible();
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
