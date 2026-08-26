import { expect, type Page } from '@playwright/test';

// 保留舊版提示的相容清理；現行正常遊戲的小天使提示不攔截輸入，因此不需要
// 在每條玩法 journey 前先完成 onboarding。
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
