import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      bossHp: () => number;
      fillQuota: () => void;
      gotoLevel: (levelId: number) => void;
      damageBoss: (amount: number) => void;
      hurtPlayer: (damage: number) => void;
      probe: () => { x: number; scrollX: number };
      elite: () => { armed: boolean; done: boolean; doorX: number | null };
      slayElite: () => void;
      quota: () => { killCount: number; killQuota: number };
      buff: () => { id: string | null; remainingMs: number; pickups: number };
      tide: () => { waterY: number; phase: string } | null;
      twinHud: () => { active: boolean; aRatio: number; bRatio: number };
      save: () => {
        levels: Record<string, { cleared: boolean; eggsFound?: string[] }>;
      };
    };
    __spStage?: { playerY(): number; vents(): number[][] };
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
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
}

async function gotoLevel(page: Page, levelId: number): Promise<void> {
  await page.evaluate((id) => window.__sp.gotoLevel(id), levelId);
  await expect
    .poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 })
    .toBe(levelId);
}

// 韌性右行（沿 v8-v10 慣例）：死亡重試重啟場景吞鍵，週期重按自癒；精英擋路走正式秒殺。
async function walkRightUntilMap(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await page.evaluate(() => window.__sp.scene())) === 'Map') return true;
    await page.evaluate(() => window.__sp.fillQuota());
    const elite = await page.evaluate(() => window.__sp.elite());
    if (elite.armed && !elite.done) await page.evaluate(() => window.__sp.slayElite());
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press('Z', { delay: 40 });
    await page.waitForTimeout(450);
  }
  return false;
}

async function walkRightPast(page: Page, targetX: number, timeoutMs: number): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let x = 0;
  while (Date.now() < deadline) {
    x = (await page.evaluate(() => window.__sp.probe())).x;
    if (x >= targetX) break;
    const elite = await page.evaluate(() => window.__sp.elite());
    if (elite.armed && !elite.done) await page.evaluate(() => window.__sp.slayElite());
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(320);
  }
  await page.keyboard.up('ArrowRight');
  return x;
}

async function seedClearedSave(page: Page, ids: readonly number[]): Promise<void> {
  await page.addInitScript((clearedIds) => {
    const entry = { cleared: true, bestTimeMs: 45000, eggsFound: [] as string[] };
    const levels: Record<string, typeof entry> = {};
    for (const id of clearedIds) levels[String(id)] = { ...entry };
    localStorage.setItem(
      'sp-save',
      JSON.stringify({
        schemaVersion: 1,
        highestClearedLevel: Math.max(...clearedIds),
        levels,
        lastPlayedAt: Date.now(),
      }),
    );
  }, ids);
}

test('舊存檔相容（§76）：v10 存檔載入十六節點，L13 開放、L14+ 迷霧鎖定', async ({ page }) => {
  const errors = collectErrors(page);
  await seedClearedSave(page, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  for (const id of [1, 4, 7, 10, 12, 13]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await expect(page.locator('[data-menu="node-14"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="node-16"]')).toHaveCount(0);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L13 熱泉噴口（§72 floorbot-vent-ground-pass）：週期翻轉可觀測且全程地面通關', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 13);
  // 三座噴口存在且 6 秒內可觀測到噴發/停供雙相位（週期 2600/3200ms）。
  expect(await page.evaluate(() => window.__spStage?.vents().length)).toBe(3);
  let sawErupt = false;
  let sawIdle = false;
  const sampleDeadline = Date.now() + 7000;
  while (Date.now() < sampleDeadline && !(sawErupt && sawIdle)) {
    const vents = (await page.evaluate(() => window.__spStage?.vents())) ?? [];
    for (const vent of vents) {
      if (vent[1] === 1) sawErupt = true;
      else sawIdle = true;
    }
    await page.waitForTimeout(200);
  }
  expect(sawErupt).toBe(true);
  expect(sawIdle).toBe(true);
  // 保底線：視噴口為普通地磚全程地面推進（不藉升托），通關寫檔。
  expect(await walkRightUntilMap(page, 90_000)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['13']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L14 糖漿潮汐（§71 floorbot-tide-wait-window）：漲潮浸水永不吸底、等窗推進通關', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 14);
  // 潮汐配置存在；等到漲潮段（週期 9s、乾潮 4.95s 起漲）。
  expect(await page.evaluate(() => window.__sp.tide())).not.toBeNull();
  await expect
    .poll(() => page.evaluate(() => window.__sp.tide()?.phase), { timeout: 12_000 })
    .toBe('flood');
  // 漲潮浸水：站地面受接觸傷（i-frame 節流）且永不吸底（玩家 y 不越過地面帶）。
  await expect
    .poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 12_000 })
    .toBeLessThan(5);
  const playerY = await page.evaluate(() => window.__spStage?.playerY() ?? 0);
  expect(playerY).toBeLessThanOrEqual(410);
  // 退潮窗恢復乾潮（dry-window ≥40% 可觀測）。
  await expect
    .poll(() => page.evaluate(() => window.__sp.tide()?.phase), { timeout: 12_000 })
    .toBe('dry');
  // 保底線：等窗地面推進通關（死亡重試由韌性迴圈自癒）。
  expect(await walkRightUntilMap(page, 100_000)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['14']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L15 卡點二（§67 沿用）：越過 checkpoint 後死亡自 1900 重生，進度保留', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 15);
  const reached = await walkRightPast(page, 1950, 70_000);
  expect(reached).toBeGreaterThanOrEqual(1950);
  const beforeQuota = await page.evaluate(() => window.__sp.quota());
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.__sp.hurtPlayer(5));
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 8000 }).toBe(5);
  const probe = await page.evaluate(() => window.__sp.probe());
  expect(Math.abs(probe.x - 1900)).toBeLessThanOrEqual(30);
  expect(await page.evaluate(() => window.__sp.stage())).toBe(15);
  const afterQuota = await page.evaluate(() => window.__sp.quota());
  expect(afterQuota.killCount).toBe(beforeQuota.killCount);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L16 Syrona（§74）：前室→入場→P2 潮汐入 arena→P3 大沸騰→擊破寫檔', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 16);
  // 前室起點：魔王未入場、arena 無潮汐。
  expect((await page.evaluate(() => window.__sp.probe())).x).toBeLessThan(120);
  expect(await page.evaluate(() => window.__sp.bossHp())).toBe(-1);
  expect(await page.evaluate(() => window.__sp.tide())).toBeNull();
  // 走過台座帶拾增益 → 入 arena 觸發入場（HP 90 階梯）。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.buff().pickups), { timeout: 20000 })
    .toBeGreaterThanOrEqual(1);
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(90);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(3600);
  // P1→P2（≤66%）：潮汐入 arena（場控地形改寫）。
  await page.evaluate(() => window.__sp.damageBoss(31));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(59);
  await expect
    .poll(() => page.evaluate(() => window.__sp.tide() !== null), { timeout: 8000 })
    .toBe(true);
  const p2Tide = await page.evaluate(() => window.__sp.tide());
  // P2→P3（≤33%）：大沸騰——潮汐仍在（週期縮短為呈現層參數，水位語義不變）。
  await page.evaluate(() => window.__sp.damageBoss(30));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(29);
  expect(await page.evaluate(() => window.__sp.tide())).not.toBeNull();
  expect(p2Tide).not.toBeNull();
  // 磨死：擊破寫檔進結算。
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__sp.damageBoss(29));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  expect(await page.evaluate(() => window.__sp.save().levels['16']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L14 暫停凍結（§71 審查補強）：漲坡段暫停水位凍結、續玩推進', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 14);
  // 等漲坡段（水位逐幀變動帶）再暫停，凍結/恢復比對最精確。
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const tide = window.__sp.tide();
          return tide !== null && tide.phase === 'flood' && tide.waterY < 500 && tide.waterY > 360;
        }),
      { timeout: 20_000 },
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  const atPause = await page.evaluate(() => window.__sp.tide());
  await page.waitForTimeout(1100);
  const whilePaused = await page.evaluate(() => window.__sp.tide());
  expect(whilePaused?.waterY).toBe(atPause?.waterY);
  await page.locator('[data-pause="resume"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('.pause-overlay')).toHaveCount(0);
  await page.waitForTimeout(1000);
  const resumed = await page.evaluate(() => window.__sp.tide());
  expect(resumed?.waterY === whilePaused?.waterY && resumed?.phase === whilePaused?.phase).toBe(
    false,
  );
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('雙節血條觀測（§70 收尾）：L12 分裂期 HUD 雙節 active、擊破回落', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 12);
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(80);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(3500);
  expect((await page.evaluate(() => window.__sp.twinHud())).active).toBe(false);
  // 跌破 66% 分裂：雙節 active、各半條比例 >0。
  await page.evaluate(() => window.__sp.damageBoss(28));
  await expect
    .poll(() => page.evaluate(() => window.__sp.twinHud().active), { timeout: 8000 })
    .toBe(true);
  const hud = await page.evaluate(() => window.__sp.twinHud());
  expect(hud.aRatio).toBeGreaterThan(0);
  expect(hud.bRatio).toBeGreaterThan(0);
  // 單具擊破＋掙扎窗滿合體入 P3：回落單節。
  await page.evaluate(() => window.__sp.damageBoss(26));
  await page.waitForTimeout(1600);
  await expect
    .poll(() => page.evaluate(() => window.__sp.twinHud().active), { timeout: 8000 })
    .toBe(false);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
