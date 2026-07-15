import { test, expect } from '@playwright/test';
import { getFab, TEXT } from './helpers';

test.describe('FAB 開啟 QuickEntry', () => {
  test('點擊 FAB 顯示 bottom sheet 與車號輸入框', async ({ page }) => {
    await page.goto('/');

    await getFab(page).click();

    await expect(page.getByPlaceholder(TEXT.platePlaceholder)).toBeVisible();
  });
});
