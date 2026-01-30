import { test, expect } from '@playwright/test';

/**
 * 桌面/行動版內容一致性測試
 * [fix:2026-01-30] 配合 Header 架構調整，主標題改用 getByText
 */
test('core content parity across desktop and mobile', async ({ page }) => {
  await page.goto('/');

  // 主標題 - Header 使用 <span> 而非 <h1>
  await expect(page.getByText('RateWise 匯率好工具').first()).toBeVisible();

  // FAQ 區塊標題
  await expect(page.getByRole('heading', { name: '常見問題精選' })).toBeVisible();

  // FAQ 連結
  await expect(page.getByRole('link', { name: '查看完整 FAQ' })).toBeVisible();

  // 頁尾連結
  const visibleFooter = page.locator('footer:visible');
  await visibleFooter.scrollIntoViewIfNeeded();
  await expect(
    visibleFooter.getByRole('link', { name: 'Taiwan Bank (臺灣銀行牌告匯率)' }),
  ).toBeVisible();
});
