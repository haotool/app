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
      save: () => {
        levels: Record<string, { cleared: boolean; eggsFound?: string[] }>;
      };
    };
    __spStage?: { warps(): number[][] };
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

// 韌性右行（沿 v8/v9 慣例）：死亡重試重啟場景吞鍵，週期重按自癒；精英擋路走正式秒殺。
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

test('舊存檔相容（§65）：v9 存檔載入十二節點，L10 開放、L11/L12 迷霧鎖定', async ({ page }) => {
  const errors = collectErrors(page);
  await seedClearedSave(page, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 分區分頁（§77）：挑戰 L10 落三區頁——8-10 可入、11/12 迷霧鎖定（無入口鈕）。
  for (const id of [8, 9, 10]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await expect(page.locator('[data-menu="node-11"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="node-12"]')).toHaveCount(0);
  // 頁籤直達一/二區驗證舊節點仍可入。
  await page.locator('[data-menu="zone-1"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  for (const id of [1, 2, 3, 4]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await page.locator('[data-menu="zone-2"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  for (const id of [5, 6, 7]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L10 星門折躍（§66）：跳入星門傳送至高台帶並保留可玩狀態', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 10);
  expect(await page.evaluate(() => window.__spStage?.warps().length)).toBe(4);
  // 走到首對星門正下方（門心 x=1050、y=300）。
  const reached = await walkRightPast(page, 1030, 45_000);
  expect(reached).toBeGreaterThanOrEqual(1030);
  // 原地垂直跳入（跳頂中心 ≈282 落於觸發半徑）：低幀率下最穩定的進門姿勢；
  // 被怪擊退遠離門下（含死亡重試回起點）時整段重走回門下帶再試。
  let warped = false;
  for (let i = 0; i < 12 && !warped; i += 1) {
    const x = (await page.evaluate(() => window.__sp.probe())).x;
    if (x < 1015) await walkRightPast(page, 1030, 20_000);
    else if (x > 1080) {
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(160);
      await page.keyboard.up('ArrowLeft');
    }
    await page.keyboard.press('Z', { delay: 60 });
    await page.waitForTimeout(800);
    warped = (await page.evaluate(() => window.__sp.probe())).x > 1900;
  }
  expect(warped).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L10 保底線（§66 floorbot-no-warp）：全程地面不碰星門仍可通關', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 10);
  // 地面走查：星門為跳入制（門心高於站立中心 80px），純走路恆不觸發。
  expect(await walkRightUntilMap(page, 90_000)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['10']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L11 中點重生（§67）：越過 checkpoint 後死亡自 1850 重生，進度與計時保留', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 11);
  const reached = await walkRightPast(page, 1900, 60_000);
  expect(reached).toBeGreaterThanOrEqual(1900);
  const beforeQuota = await page.evaluate(() => window.__sp.quota());
  // 等殘餘 i-frame 過後一次斃命（正式受擊管線）。
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.__sp.hurtPlayer(5));
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 8000 }).toBe(5);
  const probe = await page.evaluate(() => window.__sp.probe());
  expect(Math.abs(probe.x - 1850)).toBeLessThanOrEqual(30);
  expect(await page.evaluate(() => window.__sp.scene())).toBe('Game');
  expect(await page.evaluate(() => window.__sp.stage())).toBe(11);
  const afterQuota = await page.evaluate(() => window.__sp.quota());
  expect(afterQuota.killCount).toBe(beforeQuota.killCount);
  // 重生護體（審查修復）：落地窗顯式無敵——重生瞬間受擊不掉血。
  await page.evaluate(() => window.__sp.hurtPlayer(1));
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L12 魔王關體系（§68/§69）：前室增益→單向門→三階段→雙子連破寫檔含彩蛋', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 12);
  // 前室起點：魔王未入場。
  expect((await page.evaluate(() => window.__sp.probe())).x).toBeLessThan(120);
  expect(await page.evaluate(() => window.__sp.bossHp())).toBe(-1);
  // 走過台座帶拾增益（二選一取一消一；護盾可能拾後旋即格擋消耗，觀測累計拾取數）
  // → 入 arena 觸發入場。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.buff().pickups), { timeout: 20000 })
    .toBeGreaterThanOrEqual(1);
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(80);
  await page.keyboard.up('ArrowRight');
  // 入場演出完（active）後以正式傷害管線推進三階段。
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.__sp.damageBoss(28));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(52);
  // 單具擊破入掙扎窗 → 窗內補殺＝雙子連破（跳過 P3）。
  await page.evaluate(() => window.__sp.damageBoss(26));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(26);
  await page.evaluate(() => window.__sp.damageBoss(26));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  const entry = await page.evaluate(() => window.__sp.save().levels['12']);
  expect(entry?.cleared).toBe(true);
  expect(entry?.eggsFound).toContain('twin-finish');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L12 保底磨王（§68）：標準傷害逐具擊破走 P3 裂核收尾', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 12);
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(80);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(3500);
  // P1 → P2 分裂 → 擊破單具 → 等掙扎窗過（1s）合體入 P3 → 磨裂核。
  await page.evaluate(() => window.__sp.damageBoss(28));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(52);
  await page.evaluate(() => window.__sp.damageBoss(5));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(47);
  await page.evaluate(() => window.__sp.damageBoss(21));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(26);
  // 掙扎窗滿合體（1.0s）後對裂核結算。
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.__sp.damageBoss(26));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
