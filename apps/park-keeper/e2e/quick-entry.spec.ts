import { test, expect } from '@playwright/test';
import { getManualEntryTrigger, TEXT } from './helpers';

test.describe('手動記錄開啟 QuickEntry', () => {
  test('點擊手動記錄（不拍照）顯示 bottom sheet 與車號輸入框', async ({ page }) => {
    await page.goto('/');

    await getManualEntryTrigger(page).click();

    await expect(page.getByPlaceholder(TEXT.platePlaceholder)).toBeVisible();
  });
});
