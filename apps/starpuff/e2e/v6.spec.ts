import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      version: () => string;
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      fillQuota: () => void;
      gotoLevel: (levelId: number) => void;
      spawn: (kind: string, x?: number, y?: number) => void;
      grantStar: (flavor: string) => void;
      shieldRaised: () => boolean;
      ammo: () => { ammo: number; flavor: string };
      probe: () => { x: number; scrollX: number };
      quota: () => { killCount: number; killQuota: number };
      alive: () => { total: number; inhalable: number };
      gateOpen: () => boolean;
      save: () => {
        schemaVersion: number;
        highestClearedLevel: number;
        levels: Record<string, { cleared: boolean; bestTimeMs: number; eggsFound: string[] }>;
      };
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

// 預置存檔（§38 schema v1）：於任何頁面腳本執行前寫入 localStorage。
async function presetSave(page: Page, clearedLevels: number[]): Promise<void> {
  await page.addInitScript((cleared: number[]) => {
    const levels: Record<string, object> = {};
    for (const id of cleared) {
      levels[String(id)] = { cleared: true, bestTimeMs: 32100, eggsFound: [] };
    }
    localStorage.setItem(
      'sp-save',
      JSON.stringify({
        schemaVersion: 1,
        highestClearedLevel: Math.max(0, ...cleared),
        levels,
        lastPlayedAt: 1,
      }),
    );
  }, clearedLevels);
}

async function gotoTitle(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
}

async function pressMenu(page: Page, menuId: string): Promise<void> {
  await page.locator(`[data-menu="${menuId}"]`).dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
}

async function startGame(page: Page): Promise<void> {
  await gotoTitle(page);
  await pressMenu(page, 'start');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
}

// 點按發射：跨至少一個遊戲幀且低於吸入閾值 150ms。
async function tapFire(page: Page): Promise<void> {
  await page.keyboard.down('X');
  await page.waitForTimeout(80);
  await page.keyboard.up('X');
}

test('版本號（§42）：__sp.version 回報 semver+SHA（無 git 環境為 nogit）格式', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  const version = await page.evaluate(() => window.__sp.version());
  // 與 vite.config.ts resolveAppVersion 的 fallback 契約對齊：短 SHA 或 nogit。
  expect(version).toMatch(/^v\d+\.\d+\.\d+\+([0-9a-f]{4,}|nogit)$/);
  expect(errors).toEqual([]);
});

test('世界地圖解鎖流（§39）：迷霧鎖關、已解鎖節點可入、鎖定節點無入口', async ({ page }) => {
  const errors = collectErrors(page);
  await presetSave(page, [1]);
  await gotoTitle(page);
  await pressMenu(page, 'map');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 已通關 1、可挑戰 2；3/4 迷霧鎖定（無 DOM 入口）。
  await expect(page.locator('[data-menu="node-1"]')).toHaveCount(1);
  await expect(page.locator('[data-menu="node-2"]')).toHaveCount(1);
  await expect(page.locator('[data-menu="node-3"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="node-4"]')).toHaveCount(0);
  await pressMenu(page, 'node-2');
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(2);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('關卡選擇重玩（§39）：已通關節點可重入，該關重打不影響更高解鎖', async ({ page }) => {
  const errors = collectErrors(page);
  await presetSave(page, [1, 2]);
  await gotoTitle(page);
  await pressMenu(page, 'map');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  await expect(page.locator('[data-menu="node-3"]')).toHaveCount(1);
  await pressMenu(page, 'node-1');
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(1);
  // 重玩中存檔解鎖態不回退。
  expect(
    await page.evaluate(() => ({
      l2: window.__sp.save().levels['2']?.cleared,
      highest: window.__sp.save().highestClearedLevel,
    })),
  ).toEqual({ l2: true, highest: 2 });
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('存檔持久化重載（§38）：通關寫檔後重載，地圖狀態與最佳用時保持', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 快速通關第一關：補配額後走入星星門。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 45000 }).toBe('Map');
  await page.keyboard.up('ArrowRight');
  const before = await page.evaluate(() => window.__sp.save());
  expect(before.levels['1']?.cleared).toBe(true);
  expect(before.levels['1']?.bestTimeMs).toBeGreaterThan(0);
  // 重載後（模擬關閉重開）：存檔仍在、地圖節點解鎖態一致。
  await page.reload();
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  const after = await page.evaluate(() => window.__sp.save());
  expect(after.levels['1']?.cleared).toBe(true);
  expect(after.levels['1']?.bestTimeMs).toBe(before.levels['1']?.bestTimeMs);
  await pressMenu(page, 'map');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  await expect(page.locator('[data-menu="node-2"]')).toHaveCount(1);
  await expect(page.locator('[data-menu="node-3"]')).toHaveCount(0);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('殼盾格擋（§40）：長按舉盾擋正面攻擊，消耗頂槽並反擊星爆', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.grantStar('shelly'));
  await expect
    .poll(() => page.evaluate(() => window.__sp.ammo()))
    .toEqual({ ammo: 1, flavor: 'shelly', mix: null });
  // 長按 ≥150ms：頂槽殼盾星 → 舉盾（取代吸入）。
  await page.keyboard.down('X');
  await expect
    .poll(() => page.evaluate(() => window.__sp.shieldRaised()), { timeout: 4000 })
    .toBe(true);
  // 正面（面向右側）放入滾刺瓜：接觸被格擋——不掉血、頂槽消耗、反擊星爆擊殺。
  const killsBefore = await page.evaluate(() => window.__sp.quota().killCount);
  await page.evaluate(() => window.__sp.spawn('spiky', window.__sp.probe().x + 150, 350));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 }).toBe(0);
  expect(await page.evaluate(() => window.__sp.playerHp())).toBe(5);
  expect(await page.evaluate(() => window.__sp.shieldRaised())).toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 4000 })
    .toBeGreaterThan(killsBefore);
  await page.keyboard.up('X');
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('雷鏈跳電（§40）：雷鏈星命中後跳電最近兩敵，一發清三隻', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.grantStar('zappy'));
  await expect
    .poll(() => page.evaluate(() => window.__sp.ammo()))
    .toEqual({ ammo: 1, flavor: 'zappy', mix: null });
  // 彈道上一隻主目標 + 鏈半徑（160px）內兩隻鄰近目標。
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('jelly', x + 150, 350);
    window.__sp.spawn('jelly', x + 200, 350);
    window.__sp.spawn('jelly', x + 240, 350);
  });
  await page.waitForTimeout(400);
  const killsBefore = await page.evaluate(() => window.__sp.quota().killCount);
  await tapFire(page);
  await expect
    .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 6000 })
    .toBeGreaterThanOrEqual(killsBefore + 3);
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo)).toBe(0);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('L1 無技能保底通關（§43）：僅移動＋吸入＋星彈全程走完並寫檔', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  // 基礎循環直到開門：吸一隻（+1 彈藥）→ 射一隻（+1 擊殺）；全程僅移動＋吸入＋星彈。
  // 韌性設計：受擊死亡重試（合法基礎玩法路徑）會重啟場景並吞掉按住的鍵——每輪重新
  // 按鍵、失敗輪直接進下一輪自癒，12 輪上限內以開門為唯一成功判準。
  for (let round = 0; round < 12; round += 1) {
    if (await page.evaluate(() => window.__sp.gateOpen())) break;
    await page.keyboard.down('X');
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const x = window.__sp.probe().x;
      window.__sp.spawn('jelly', x + 120, 340);
    });
    const gotAmmo = await page
      .waitForFunction(() => window.__sp.ammo().ammo >= 1, undefined, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    await page.keyboard.up('X');
    if (!gotAmmo) continue;
    await page.evaluate(() => {
      const x = window.__sp.probe().x;
      window.__sp.spawn('jelly', x + 220, 350);
    });
    await page.waitForTimeout(350);
    await tapFire(page);
    // 命中結算窗：星彈飛行＋擊殺回收。
    await page.waitForTimeout(700);
  }
  await expect
    .poll(() => page.evaluate(() => window.__sp.gateOpen()), { timeout: 4000 })
    .toBe(true);
  // 走入星星門（L1 地面路徑無阻，不需跳躍）→ 世界地圖 + 通關寫檔。
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 45000 }).toBe('Map');
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.save().levels['1']?.cleared)).toBe(true);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('反卡關走查（§43）：L2/L3 地面路徑（含磚前繞跳）可達星星門；飢荒必補可吸怪', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  for (const level of [2, 3]) {
    await page.evaluate((id) => window.__sp.gotoLevel(id), level);
    await expect
      .poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 })
      .toBe(level);
    // 飢荒保證律（§26）：彈藥 0 起步，場上必出現可吸怪。
    await expect
      .poll(() => page.evaluate(() => window.__sp.alive().inhalable), { timeout: 12000 })
      .toBeGreaterThanOrEqual(1);
    // 補滿配額停止生成後，右行＋週期跳（越過地面磚與元素）直到走入星星門。
    await page.evaluate(() => window.__sp.fillQuota());
    await page.keyboard.down('ArrowRight');
    const deadline = Date.now() + 50_000;
    while (Date.now() < deadline) {
      if ((await page.evaluate(() => window.__sp.scene())) === 'Map') break;
      await page.keyboard.press('Z', { delay: 40 });
      await page.waitForTimeout(500);
    }
    await page.keyboard.up('ArrowRight');
    expect(await page.evaluate(() => window.__sp.scene())).toBe('Map');
    expect(await page.evaluate((id) => window.__sp.save().levels[String(id)]?.cleared, level)).toBe(
      true,
    );
    // 自地圖重入下一輪走查。
    if (level === 2) {
      await pressMenu(page, 'node-1');
      await expect
        .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
        .toBe('Game');
    }
  }
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('重置進度（§38）：兩步確認僅清 sp-save，地圖回到初始迷霧', async ({ page }) => {
  const errors = collectErrors(page);
  await presetSave(page, [1, 2, 3]);
  await gotoTitle(page);
  await pressMenu(page, 'map');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  await expect(page.locator('[data-menu="node-4"]')).toHaveCount(1);
  // 第一步：武裝確認，存檔未動。
  await pressMenu(page, 'reset');
  expect(await page.evaluate(() => localStorage.getItem('sp-save'))).not.toBeNull();
  // 武裝 3 秒未確認自動解除：存檔仍在，且再點一次僅重新武裝（非執行重置）。
  // 等待帶 50% 裕度：高負載下 Phaser 場景時鐘相對牆鐘落後，3.1s 牆鐘可能未達 3s 場景時。
  await page.waitForTimeout(4500);
  expect(await page.evaluate(() => localStorage.getItem('sp-save'))).not.toBeNull();
  await pressMenu(page, 'reset');
  expect(await page.evaluate(() => localStorage.getItem('sp-save'))).not.toBeNull();
  // 第二步：武裝中確定重置——僅清 sp-save，地圖重建回初始態。
  await pressMenu(page, 'reset');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sp-save'))).toBeNull();
  await expect(page.locator('[data-menu="node-2"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="node-1"]')).toHaveCount(1);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});
