import { test, expect } from '@playwright/test';

/**
 * 核心分帳旅程：記帳 → 自動進紀錄 → 結清 → 刪除復原。
 * 裝置語言為 en-US，斷言使用英文文案。
 */
test('記帳後自動進紀錄，可結清並於刪除後復原', async ({ page }) => {
  // PWA「離線就緒」提示會浮在拇指區，出現時先關閉避免攔截點擊。
  await page.addLocatorHandler(page.getByRole('button', { name: 'Close' }), async (btn) => {
    await btn.click();
  });

  await page.goto('/');

  // 記帳：計算機輸入 300（預設 3 位成員平分）
  await page.getByRole('button', { name: '3', exact: true }).click();
  const zero = page.getByRole('button', { name: '0', exact: true });
  await zero.click();
  await zero.click();
  await expect(page.locator('h1')).toContainText('NT$ 300');

  // 完成 → 自動切換到紀錄頁
  await page.getByRole('button', { name: /Done/ }).click();
  await expect(page.getByRole('heading', { name: 'Trip History' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NT$ 300' })).toBeVisible();
  await expect(page.getByTestId('expense-card')).toHaveCount(1);

  // 結清：me 墊付 300，其餘兩人各欠 100 → 兩列結清建議
  await expect(page.getByTestId('settlement-row')).toHaveCount(2);
  const settlement = page.getByTestId('settlement-row').first();
  await settlement.click();
  await expect(settlement.getByText('Settled')).toBeVisible();

  // 再點一次可取消結清
  await settlement.click();
  await expect(settlement.getByText('Settled')).toHaveCount(0);

  // 刪除 → undo toast → 復原
  await page.getByTestId('expense-card').first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByTestId('undo-toast')).toBeVisible();
  await expect(page.getByTestId('undo-toast')).toContainText('Deleted');
  await expect(page.getByTestId('expense-card')).toHaveCount(0);

  await page.getByTestId('undo-toast').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('undo-toast')).toHaveCount(0);
  await expect(page.getByTestId('expense-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'NT$ 300' })).toBeVisible();
});
