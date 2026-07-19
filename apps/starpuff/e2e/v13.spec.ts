import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      bossHp: () => number;
      gotoLevel: (levelId: number, ex?: boolean) => void;
      lose: () => void;
      damageBoss: (amount: number) => void;
      bossState: () => { phase: string; state: string } | null;
      scenePaused: () => boolean;
      probe: () => { x: number; scrollX: number };
      save: () => {
        levels: Record<string, { cleared: boolean; exCleared?: boolean; bestTimeMs?: number }>;
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

async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
}

// 存檔種子（§86）：exIds 指定 EX 已制霸的魔王關（additive 欄位、schema v1 不升版）。
async function seedSave(
  page: Page,
  ids: readonly number[],
  exIds: readonly number[] = [],
): Promise<void> {
  await page.addInitScript(
    ({ clearedIds, exClearedIds }) => {
      const levels: Record<
        string,
        { cleared: boolean; bestTimeMs: number; eggsFound: string[]; exCleared?: boolean }
      > = {};
      for (const id of clearedIds) {
        levels[String(id)] = { cleared: true, bestTimeMs: 45000, eggsFound: [] };
      }
      for (const id of exClearedIds) {
        const entry = levels[String(id)];
        if (entry) entry.exCleared = true;
      }
      localStorage.setItem(
        'sp-save',
        JSON.stringify({
          schemaVersion: 1,
          highestClearedLevel: Math.max(...clearedIds),
          levels,
          lastPlayedAt: Date.now(),
        }),
      );
    },
    { clearedIds: ids, exClearedIds: exIds },
  );
}

// 前室右行入 arena：入場運鏡完成後 BOSS_SPAWNED 設定血條。
async function walkIntoArena(page: Page, expectedHp: number): Promise<void> {
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 })
    .toBe(expectedHp);
  await page.keyboard.up('ArrowRight');
}

// 可傷窗輪詢：入場演出完（active）後傷害才結算。
async function pollDamage(page: Page, amount: number, timeoutMs: number): Promise<number> {
  const before = await page.evaluate(() => window.__sp.bossHp());
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await page.evaluate((value) => window.__sp.damageBoss(value), amount);
    const hp = await page.evaluate(() => window.__sp.bossHp());
    if (hp < before) return hp;
    await page.waitForTimeout(300);
  }
  return before;
}

const ALL_TWENTY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

test('L12 Prismix EX（§86）：地圖 EX 徽鈕入場 HP 120、磨破寫 exCleared 不動一般紀錄', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await seedSave(page, ALL_TWENTY);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 分區分頁（§78）：L12 EX 徽鈕位於三區頁。
  await page.locator('[data-menu="zone-3"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('[data-menu="node-12-ex"]')).toBeAttached();
  await page.locator('[data-menu="node-12-ex"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  // EX_MODS ×1.5：80 → 120；前室 retrofit 前提下走廊道入場。
  await walkIntoArena(page, 120);
  // 入場演出完成後以正式傷害管線磨破（分裂/掙扎/合體全走 FSM，內部時序由單測把關）。
  await pollDamage(page, 30, 20000);
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const hp = await page.evaluate(() => window.__sp.bossHp());
    if (hp <= 0) break;
    await page.evaluate(() => window.__sp.damageBoss(15));
    await page.waitForTimeout(350);
  }
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  const entry = await page.evaluate(() => window.__sp.save().levels['12']);
  expect(entry?.exCleared).toBe(true);
  expect(entry?.cleared).toBe(true);
  // EX 擊破不動一般最佳時間（§58 慣例）。
  expect(entry?.bestTimeMs).toBe(45000);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L16/L20 EX smoke（§86）：gotoLevel ex 直達，HP 135/165 且首傷成立', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  // 不 seed 全通關：開始鈕在全通關存檔下改進地圖（§39 hub 模型），此案要直進 Game。
  await startGame(page);
  // Syrona EX：90 × 1.5 = 135。
  await page.evaluate(() => window.__sp.gotoLevel(16, true));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(16);
  await walkIntoArena(page, 135);
  expect(await pollDamage(page, 5, 20000)).toBeLessThan(135);
  // Voidra EX：110 × 1.5 = 165。
  await page.evaluate(() => window.__sp.gotoLevel(20, true));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(20);
  await walkIntoArena(page, 165);
  expect(await pollDamage(page, 5, 20000)).toBeLessThan(165);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('星核制霸（§86）：五王 EX 全制霸存檔載入標題/圖鑑/地圖零錯誤', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSave(page, ALL_TWENTY, [4, 7, 12, 16, 20]);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  // 金色換裝＋制霸章渲染路徑（canvas 視覺由截圖 QA 覆蓋）。
  await page.waitForTimeout(900);
  await page.locator('[data-menu="codex"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Codex');
  await page.waitForTimeout(600);
  await page.locator('[data-menu="back"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 全通關存檔預設落五區頁（highestClearedLevel=20）：EX 徽鈕存在＝全制霸態不移除
  // 入口、可重玩。
  await expect(page.locator('[data-menu="node-20-ex"]')).toBeAttached();
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L4/L7 前室相機（§86 B1 回歸網）：入場運鏡後相機貼齊 arena、玩家恆在視窗內', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  for (const levelId of [4, 7] as const) {
    await page.evaluate((id) => window.__sp.gotoLevel(id), levelId);
    await expect
      .poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 })
      .toBe(levelId);
    await page.keyboard.down('ArrowRight');
    await expect
      .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 })
      .toBeGreaterThan(0);
    await page.keyboard.up('ArrowRight');
    // 魔王自身入場運鏡（fade→push→reset pan）完成後，相機必須回貼 arena 左緣，
    // 不得被拉回世界原點（B1：pan 目標未平移前室寬 → 玩家離屏）。
    await expect
      .poll(() => page.evaluate(() => Math.round(window.__sp.probe().scrollX)), {
        timeout: 15000,
      })
      .toBe(400);
    // 走到 arena 右半場：相機錨定不動、玩家仍在視窗內（非離屏）。
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2500);
    await page.keyboard.up('ArrowRight');
    const probe = await page.evaluate(() => ({
      x: window.__sp.probe().x,
      scrollX: window.__sp.probe().scrollX,
    }));
    expect(Math.round(probe.scrollX)).toBe(400);
    expect(probe.x - probe.scrollX).toBeGreaterThan(0);
    expect(probe.x - probe.scrollX).toBeLessThan(1250);
  }
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('EX 中途退出防鎖（§86）：EX 戰中暫停重開保留變體、退出主選單不寫 exCleared', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.gotoLevel(12, true));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(12);
  await walkIntoArena(page, 120);
  // 磨掉部分血量後暫停重開：EX 模式保留（血條回滿 120 而非一般 80）。
  await pollDamage(page, 10, 20000);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  await page.locator('[data-pause="restart"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scenePaused())).toBe(false);
  // 場景就緒門（v15 flake 根修）：restart 為 queued op，resume 後 scenePaused 立即為
  // false 但新場景尚未重建；此時送出的 keydown 會落入 teardown/create 窗被吃掉
  //（Playwright 無 OS auto-repeat 不會補發）→ 玩家不走、bossHp 恆 -1 逾時。
  // 以重生座標（前室起點 x≈90，重啟前玩家在 arena x>400）確認 create 完成才送鍵；
  // 轉場瞬間探針防禦回大值（沿 enemies() 探針 try/catch 慣例）。
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          try {
            return Math.round(window.__sp.probe().x);
          } catch {
            return Number.MAX_SAFE_INTEGER;
          }
        }),
      { timeout: 15000 },
    )
    .toBeLessThan(200);
  await walkIntoArena(page, 120);
  // 戰中退出主選單：不鎖存檔——exCleared 未寫、一般紀錄不動、可再次入場。
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  await page.locator('[data-pause="quit"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 10000 })
    .toBe('Title');
  const entry = await page.evaluate(() => window.__sp.save().levels['12']);
  expect(entry?.exCleared ?? false).toBe(false);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('EX 敗北再戰（§86）：Result 顯示再戰 EX、重入後血條回 EX 值', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.gotoLevel(12, true));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(12);
  await walkIntoArena(page, 120);
  // 敗北 → Result 顯示 EX 標示 → 再戰保留變體（血條 120 非 80）。
  await page.evaluate(() => window.__sp.lose());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 10000 })
    .toBe('Result');
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 10000 })
    .toBe('Game');
  await walkIntoArena(page, 120);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('舊存檔相容（§86）：v9 世代存檔（1-9＋L4/L7 EX）載入二十節點、EX 紀錄保留', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await seedSave(page, [1, 2, 3, 4, 5, 6, 7, 8, 9], [4, 7]);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 1-9 通關存檔預設落三區頁（挑戰 L10）：切回一區頁驗 L4 EX 徽鈕（歷代紀錄不損毀）。
  await page.locator('[data-menu="zone-1"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('[data-menu="node-4-ex"]')).toBeAttached();
  const save = await page.evaluate(() => window.__sp.save());
  expect(save.levels['4']?.exCleared).toBe(true);
  expect(save.levels['7']?.exCleared).toBe(true);
  expect(save.levels['12']?.exCleared ?? false).toBe(false);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
