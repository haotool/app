import { test, expect } from '@playwright/test';

/**
 * 核心分帳旅程：記帳 → 自動進紀錄 → 結清 → 刪除復原。
 * 裝置語言為 en-US，斷言使用英文文案。
 */
test('記帳後自動進紀錄，可結清並於刪除後復原', async ({ page }) => {
  // PWA「離線就緒」提示會浮在拇指區，出現時先關閉避免攔截點擊。
  await page.addLocatorHandler(
    page.getByRole('status').getByRole('button', { name: 'Close' }),
    async (btn) => {
      await btn.click();
    },
  );

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

/**
 * P0 迴歸（deep-qa H 場景）：EditExpenseSheet 的 Save 不得被 BottomNav 疊繪攔截。
 * 以 elementFromPoint 命中判定＋真實座標點擊驗證，非高階 API 的可操作性檢查。
 */
test('EditExpenseSheet 的 Save 可真實點擊且不誤觸 BottomNav', async ({ page }) => {
  await page.addLocatorHandler(
    page.getByRole('status').getByRole('button', { name: 'Close' }),
    async (btn) => {
      await btn.click();
    },
  );

  await page.goto('/');

  // 記一筆 300 → 進紀錄頁
  await page.getByRole('button', { name: '3', exact: true }).click();
  const zero = page.getByRole('button', { name: '0', exact: true });
  await zero.click();
  await zero.click();
  await page.getByRole('button', { name: /Done/ }).click();
  await expect(page.getByTestId('expense-card')).toHaveCount(1);

  // 展開 → Edit → 修改金額
  await page.getByTestId('expense-card').first().click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edit Expense' })).toBeVisible();
  await page.locator('input[type="number"]').first().fill('450');

  // Save 中心座標的 elementFromPoint 必須命中 Save 自身（而非 BottomNav）
  const saveBtn = page.getByRole('button', { name: 'Save', exact: true });
  const box = await saveBtn.boundingBox();
  if (!box) throw new Error('Save button has no bounding box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hit = await page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x ?? 0, y ?? 0);
      const btn = el instanceof Element ? el.closest('button') : null;
      return btn?.textContent?.trim() ?? 'none';
    },
    [cx, cy],
  );
  expect(hit).toBe('Save');

  // 真實座標點擊 → 儲存成功、留在紀錄頁、金額已更新
  await page.mouse.click(cx, cy);
  await expect(page.getByRole('heading', { name: 'Edit Expense' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Trip History' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NT$ 450' })).toBeVisible();
});

/**
 * G1 幾何鎖定（wave-6b）：關鍵觸控目標以真實 boundingBox 斷言 ≥44px。
 * jsdom 無版面引擎，class 斷言無法保證實高——class 被改壞時此測試必紅。
 */
test('關鍵觸控目標實測 boundingBox ≥44px', async ({ page }) => {
  const MIN = 44;
  const expectMinSize = async (
    locator: ReturnType<typeof page.getByRole>,
    label: string,
    both = false,
  ) => {
    const box = await locator.boundingBox();
    if (!box) throw new Error(`${label} has no bounding box`);
    expect(box.height, `${label} height`).toBeGreaterThanOrEqual(MIN);
    if (both) expect(box.width, `${label} width`).toBeGreaterThanOrEqual(MIN);
  };

  await page.goto('/');

  // UpdatePrompt CTA：等待離線就緒橫幅入場，量測 Close 後關閉
  const banner = page.getByRole('status');
  await banner.waitFor({ state: 'visible', timeout: 15_000 });
  const bannerClose = banner.getByRole('button', { name: 'Close' });
  await expectMinSize(bannerClose, 'UpdatePrompt Close CTA');
  await bannerClose.click();
  await expect(banner).toHaveCount(0);

  // Home：備註類別觸發鈕（icon 鈕，雙軸 ≥44）
  await expectMinSize(page.getByRole('button', { name: 'Pick category' }), '類別觸發', true);

  // 記一筆 300 → History
  await page.getByRole('button', { name: '3', exact: true }).click();
  const zero = page.getByRole('button', { name: '0', exact: true });
  await zero.click();
  await zero.click();
  await page.getByRole('button', { name: /Done/ }).click();
  await expect(page.getByTestId('expense-card')).toHaveCount(1);

  // History：分享鈕（header 分享鈕在 main 之外，以 main 限定範圍；exact 避免子字串誤中）
  await expectMinSize(
    page.getByRole('main').getByRole('button', { name: 'Share', exact: true }),
    'History 分享',
  );

  // 展開卡 → 新增備注 → 備注確認 check（icon 鈕，雙軸 ≥44）
  await page.getByTestId('expense-card').first().click();
  const addNote = page.getByRole('button', { name: 'Add note' });
  await expectMinSize(addNote, '新增備注');
  await addNote.click();
  await expectMinSize(page.getByRole('button', { name: 'Confirm' }), '備注確認', true);
});
