import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      bossHp: () => number;
      playerHp: () => number;
      win: () => void;
      lose: () => void;
    };
  }
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function clickCanvas(page: Page, ratioX: number, ratioY: number): Promise<void> {
  const box = await page.locator('#app canvas').boundingBox();
  if (!box) throw new Error('canvas 不存在');
  await page.mouse.click(box.x + box.width * ratioX, box.y + box.height * ratioY);
}

async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  // 開始按鈕位於畫布 66% 高度（TitleScene 佈局）。
  await clickCanvas(page, 0.5, 0.66);
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
}

test('載入 Title：canvas 顯示且零 console error', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test('點開始進入 GameScene：遊戲運行且 HUD 狀態就緒', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // HUD 由 PLAYER_DAMAGED/AMMO_CHANGED 事件驅動；初始狀態以 debug hook 驗證。
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  const buttons = page.locator('[data-btn]');
  await expect(buttons).toHaveCount(4);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('強制勝利進 Result，再玩一次回到 GameScene', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  // 再玩一次按鈕位於畫布 68% 高度（ResultScene 佈局）。
  await clickCanvas(page, 0.5, 0.68);
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});
