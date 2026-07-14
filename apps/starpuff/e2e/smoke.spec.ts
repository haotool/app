import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      bossHp: () => number;
      playerHp: () => number;
      win: () => void;
      lose: () => void;
      fillQuota: () => void;
      skipToBoss: () => void;
      spawn: (kind: string, x?: number, y?: number) => void;
      ammo: () => { ammo: number; flavor: string };
      probe: () => { x: number; scrollX: number };
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
  // 橫式手柄：左搖桿區 + 右側 A/B 兩圓鍵（無文字節點）。
  await expect(page.locator('#joy-zone')).toBeVisible();
  const buttons = page.locator('[data-btn]');
  await expect(buttons).toHaveCount(2);
  await expect(buttons.first()).toHaveText('');
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

test('第一關補滿配額出星星門，走入後轉場進第二關', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(1);
  // 注入擊殺配額加速：星星門於世界右端生成，按住右行走向門。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 20000 }).toBe(2);
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('魔王戰敗北進 Result 敗北畫面，再戰直接回魔王關', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.skipToBoss());
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 15000 })
    .toBeGreaterThan(0);
  // 魔王關死亡＝敗北進結算（Stage 1-3 死亡仍為重試當前關）。
  await page.evaluate(() => window.__sp.lose());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  // 再戰魔王按鈕位於畫布 68% 高度（ResultScene 佈局）；敗北重試直接回第 4 關。
  await clickCanvas(page, 0.5, 0.68);
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('吞 puffy 賦星：彈匣轉珊瑚屬性，發射命中後屬性保留', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 先按住吸入，再於吸入錐前方受控生成 puffy（高空下飄會落入錐內被拉近吞下）。
  await page.keyboard.down('X');
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__sp.spawn('puffy', 190, 320));
  await expect
    .poll(() => page.evaluate(() => window.__sp.ammo()), { timeout: 8000 })
    .toEqual({ ammo: 1, flavor: 'puffy' });
  await page.keyboard.up('X');
  // 於彈道上生成標準靶（jelly 落地靜止），點按發射爆裂星命中（AoE 小爆走 burstSmall 管線）。
  await page.evaluate(() => window.__sp.spawn('jelly', 300, 350));
  await page.waitForTimeout(400);
  // 點按發射：需跨至少一個遊戲幀（Phaser 逐幀輪詢 isDown），80ms 仍低於吸入閾值。
  await page.keyboard.down('X');
  await page.waitForTimeout(80);
  await page.keyboard.up('X');
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 4000 }).toBe(0);
  // 空彈匣維持前值屬性（§20）；命中演出期間零 console error。
  expect(await page.evaluate(() => window.__sp.ammo().flavor)).toBe('puffy');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('跳關直達第四關魔王，強制勝利結算總用時', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.skipToBoss());
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  // 魔王入場演出完成後 bossHp 就緒。
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 15000 })
    .toBeGreaterThan(0);
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});
