import { test, expect } from '@playwright/test';
import { TEST_PHOTO_BASE64 } from './helpers';

/**
 * /add 快速記錄旅程：直達 → 注入照片 → 樓層儲存 → 摘要 → 返回首頁後紀錄出現。
 * 文案斷言採 zh-TW（Add/Home init 均會將 i18n 語言設為 DEFAULT_SETTINGS.language）。
 */
test.describe('/add 快速記錄旅程', () => {
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 25.033, longitude: 121.5654 },
  });

  test('直達 /add 完成 3 taps 記錄並於首頁看到紀錄', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    // 相對路徑：baseURL 含 /park-keeper/ 前綴，勿用絕對路徑跳出 base。
    await page.goto('add');

    // 巨型拍照 CTA：label 直包 capture input（無程式化喚起）。
    const fileInput = page.locator('input[type="file"][capture="environment"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TEST_PHOTO_BASE64, 'base64'),
    });

    await expect(page.getByAltText('車位照片')).toBeVisible();

    // 樓層 chip 即儲存。
    await page.getByRole('button', { name: 'B2', exact: true }).click();

    // 儲存成功摘要與返回首頁（摘要 CTA 有可見文字；header 返回箭頭僅 aria-label）。
    await expect(page.getByText('停車位置已儲存。')).toBeVisible();
    const backHome = page.getByRole('link', { name: '返回首頁' }).filter({ hasText: '返回首頁' });
    await expect(backHome).toBeVisible();

    await backHome.click();
    await expect(page.getByRole('heading', { level: 1, name: 'ParkKeeper' })).toBeVisible();
    // 紀錄出現在列表（樓層 B2）。
    await expect(page.getByText('B2', { exact: true }).first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('from=shortcut 隱藏返回鍵；未知 from 值靜默降級', async ({ page }) => {
    await page.goto('add?from=shortcut');
    await expect(page.locator('input[type="file"][capture="environment"]')).toBeAttached();
    await expect(page.getByRole('link', { name: '返回首頁' })).toHaveCount(0);

    await page.goto('add?from=unknown-value');
    await expect(page.locator('input[type="file"][capture="environment"]')).toBeAttached();
    await expect(page.getByRole('link', { name: '返回首頁' })).toHaveCount(1);
  });
});
