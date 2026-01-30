import { test, expect } from '@playwright/test';

/**
 * 桌面/行動版內容一致性測試
 * [fix:2026-01-31] 配合新 UI 架構調整
 */
test('core content parity across desktop and mobile', async ({ page }) => {
  await page.goto('/');

  // [fix:2026-01-31] 新 UI 結構：檢查主要區塊
  // 應用名稱
  await expect(page.getByText('RateWise').first()).toBeVisible();

  // [fix:2026-01-31] 貨幣列表區域
  await expect(page.getByRole('region', { name: /currency list/i })).toBeVisible();

  // [fix:2026-01-31] 資料來源連結
  await expect(page.getByRole('link', { name: /臺灣銀行牌告/i })).toBeVisible();
});
