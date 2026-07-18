import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      bossHp: () => number;
      fillQuota: () => void;
      lose: () => void;
      gotoLevel: (levelId: number) => void;
      damageBoss: (amount: number) => void;
      damageBossAt: (amount: number, x: number, y: number) => void;
      bossState: () => { phase: string; state: string } | null;
      grantInvuln: (ms: number) => void;
      bossPos: () => { x: number; y: number };
      probe: () => { x: number; scrollX: number };
      elite: () => { armed: boolean; done: boolean; doorX: number | null };
      slayElite: () => void;
      meteor: () => { falling: number; embers: number; telegraphs: number } | null;
      tide: () => { waterY: number; phase: string } | null;
      save: () => {
        levels: Record<string, { cleared: boolean; eggsFound?: string[] }>;
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
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
}

async function gotoLevel(page: Page, levelId: number): Promise<void> {
  await page.evaluate((id) => window.__sp.gotoLevel(id), levelId);
  await expect
    .poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 })
    .toBe(levelId);
}

// 韌性右行（沿 v8-v11 慣例）：死亡重試重啟場景吞鍵，週期重按自癒；精英擋路走正式秒殺。
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

// 魔王入場運鏡等待：血條就位＝BOSS_SPAWNED 已發、可傷窗開啟由 poll 傷害驗證。
async function enterVoidraArena(page: Page): Promise<void> {
  await gotoLevel(page, 20);
  // 前室廊道（§69）：右行走入 arena 觸發入場運鏡。
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(110);
  await page.keyboard.up('ArrowRight');
}

// P1 可傷窗輪詢：入場運鏡完成（active）後傷害才結算。
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

test('舊存檔相容（§84）：v11 存檔載入五區分頁，L17 開放、L18/L20 迷霧鎖定', async ({ page }) => {
  const errors = collectErrors(page);
  await seedClearedSave(page, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 挑戰 L17 落五區頁：17 開放、18/20 迷霧鎖定（無入口鈕）。
  await expect(page.locator('[data-menu="node-17"]')).toBeAttached();
  await expect(page.locator('[data-menu="node-18"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="node-20"]')).toHaveCount(0);
  // 四區頁籤直達：魔王節點 EX 徽鈕仍在。
  await page.locator('[data-menu="zone-4"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('[data-menu="node-16"]')).toBeAttached();
  await expect(page.locator('[data-menu="node-16-ex"]')).toBeAttached();
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L17 低重力（§81 floorbot-lowgrav-landing）：0.55 重力全程地面通關', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 17);
  expect(await walkRightUntilMap(page, 90_000)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['17']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L18 流星雨（§79）：預警圈→隕星→餘燼可觀測，全程地面通關', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 18);
  // 波次節拍（4.5s＋預警 0.8s）：預警圈與隕星於兩個週期內必然可觀測。
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__sp.meteor());
        return state !== null && (state.telegraphs > 0 || state.falling > 0);
      },
      { timeout: 12_000 },
    )
    .toBe(true);
  expect(await walkRightUntilMap(page, 120_000)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['18']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L19 全機制終試（§84 floorbot 契約）：四機制同關全程地面通關（不用星門/噴口）', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 19);
  expect(await walkRightUntilMap(page, 130_000)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['19']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L18 暫停凍結（§79 QA 矩陣）：隕星/預警圈暫停凍結、續玩推進', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 18);
  // 等首波（預警或墜落中）再暫停，凍結/恢復比對最精確。
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__sp.meteor());
        return state !== null && (state.telegraphs > 0 || state.falling > 0);
      },
      { timeout: 12_000 },
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  const atPause = await page.evaluate(() => window.__sp.meteor());
  await page.waitForTimeout(1200);
  const whilePaused = await page.evaluate(() => window.__sp.meteor());
  // 暫停期間隕星波不推進：墜落中/餘燼/預警圈計數全凍結。
  expect(whilePaused).toEqual(atPause);
  await page.locator('[data-pause="resume"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('.pause-overlay')).toHaveCount(0);
  // 續玩推進：兩個波次週期內狀態必然變化（墜落結算或新預警）。
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__sp.meteor());
        return JSON.stringify(state) !== JSON.stringify(whilePaused);
      },
      { timeout: 12_000 },
    )
    .toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('v11 觀察項收尾（§83）：Syrona 皇冠 ×2 精確傷害與 P3 自然循環 e2e 級觸發', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 16);
  // 走入 arena 觸發入場（HP 90 階梯）。
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(90);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(3600);
  // 皇冠 ×2（§74，damageBossAt 精確 hook）：頂帶命中雙倍、本體命中單倍。
  const boss = await page.evaluate(() => window.__sp.bossPos());
  await page.evaluate((pos) => window.__sp.damageBossAt(1, pos.x, pos.y - 70), boss);
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(88);
  await page.evaluate((pos) => window.__sp.damageBossAt(1, pos.x, pos.y + 20), boss);
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(87);
  // 進 P3（≤33%）：受控無敵窗下觀測自然循環——wave 與 overload 呈現層招式必然輪轉。
  await page.evaluate(() => window.__sp.damageBoss(58));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(29);
  expect(await page.evaluate(() => window.__sp.tide())).not.toBeNull();
  await page.evaluate(() => window.__sp.grantInvuln(30_000));
  const seen = new Set<string>();
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__sp.bossState());
        if (state?.phase === 'p3' && state.state !== 'idle') seen.add(state.state);
        return seen.has('wave') && seen.has('overload');
      },
      { timeout: 30_000, intervals: [120] },
    )
    .toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L20 Voidra 三段（§82）：P2 生存段免傷帶、過熱窗輸出、段起點重試與全破謝幕', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await startGame(page);
  await enterVoidraArena(page);
  // P1：入場運鏡完成後可傷（poll 至傷害結算）。
  const afterP1 = await pollDamage(page, 10, 20_000);
  expect(afterP1).toBeLessThan(110);
  // 打進 P2（≤77，落點 70）：核心升頂——非過熱窗傷害忽略（唯一輸出窗設計）。
  await page.evaluate((amount) => window.__sp.damageBoss(amount), afterP1 - 70);
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(70);
  await page.evaluate(() => window.__sp.damageBoss(5));
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__sp.bossHp())).toBe(70);
  // 段起點重試（§82）：P2 死亡不回滾整場——場景不換、魔王血回段起點。
  await page.evaluate(() => window.__sp.lose());
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__sp.scene())).toBe('Game');
  expect(await page.evaluate(() => window.__sp.bossHp())).toBe(77);
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  // 過熱窗輪詢（9s/20s/33s 波次表）：窗內傷害正常結算。
  const afterOverheat = await pollDamage(page, 5, 30_000);
  expect(afterOverheat).toBeLessThan(77);
  // 窗內打穿 40% 提前入 P3：低重力終局傷害恆可結算。
  await page.evaluate(() => window.__sp.damageBoss(40));
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 5000 })
    .toBeLessThanOrEqual(44);
  const afterP3 = await pollDamage(page, 10, 15_000);
  expect(afterP3).toBeLessThan(44);
  // 擊破 → 星光復甦謝幕（§84）→ 跳過 → Result → 通關寫檔。
  await page.evaluate(() => window.__sp.damageBoss(999));
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15_000 })
    .toBe('Credits');
  await page.locator('[data-menu="credits-skip"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  expect(await page.evaluate(() => window.__sp.save().levels['20']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
