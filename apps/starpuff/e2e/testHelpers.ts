import { expect, type Page } from '@playwright/test';

// 觸控裝置首次開局會先顯示真正模態的操作提示；需要驗證遊戲輸入的 journey
// 必須先完成 onboarding，避免把「模態攔截成功」誤判成玩法／輸入回歸。
export async function dismissControlHints(page: Page): Promise<void> {
  const hint = page.locator('[data-control-hints="card"]');
  if ((await hint.count()) > 0) {
    await hint.locator('[data-control-hints="close"]').dispatchEvent('pointerdown', {
      pointerId: 10,
      isPrimary: true,
    });
  }
  await expect(hint).toHaveCount(0);
}
