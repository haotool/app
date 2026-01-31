import { test, expect } from '@playwright/test';

/**
 * 桌面/行動版內容一致性測試
 * [fix:2026-01-31] 配合新 UI 架構調整，簡化選擇器
 */
test('core content parity across desktop and mobile', async ({ page }) => {
  await page.goto('/');

  // [fix:2026-01-31] 新 UI 結構：檢查主要區塊
  // 應用名稱
  await expect(page.locator('[data-testid="app-title"]:visible')).toBeVisible();

  // [fix:2026-01-31] 貨幣選擇器（核心功能）
  await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 10000 });

  // [fix:2026-01-31] 資料來源連結（使用更寬鬆的選擇器）
  const dataSourceLink = page.getByRole('link').filter({ hasText: /臺灣|Taiwan|Bank/i });
  await expect(dataSourceLink.first()).toBeVisible({ timeout: 10000 });
});
