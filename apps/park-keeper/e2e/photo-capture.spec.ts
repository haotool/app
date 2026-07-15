import { test, expect } from '@playwright/test';
import { getFab, TEXT, TEST_PHOTO_BASE64 } from './helpers';

test.describe('拍照流程模擬', () => {
  // CI 無法開啟相機，改以 input[type=file] 注入測試圖片模擬拍照（標準做法）。
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 25.033, longitude: 121.5654 },
  });

  test('注入測試圖片後，樓層 chip 可互動', async ({ page }) => {
    await page.goto('/');
    await getFab(page).click();
    await expect(page.getByPlaceholder(TEXT.platePlaceholder)).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TEST_PHOTO_BASE64, 'base64'),
    });

    await expect(page.getByAltText('Parking spot')).toBeVisible();

    const floorChip = page.getByRole('button', { name: 'B3', exact: true });
    await expect(floorChip).toBeVisible();
    await expect(floorChip).toBeEnabled();
  });
});
