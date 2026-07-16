import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      fillQuota: () => void;
      gotoLevel: (levelId: number) => void;
      spawn: (kind: string, x?: number, y?: number) => void;
      grantStar: (flavor: string) => void;
      ammo: () => { ammo: number; flavor: string; mix: string | null };
      probe: () => { x: number; scrollX: number };
      quota: () => { killCount: number; killQuota: number };
      alive: () => { total: number; inhalable: number };
      gateOpen: () => boolean;
      walk: () => { rotation: number; bob: number; vy: number };
      elite: () => { armed: boolean; done: boolean; doorX: number | null };
      slayElite: () => void;
      save: () => { levels: Record<string, { cleared: boolean }> };
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

// 點按發射：跨至少一個遊戲幀且低於吸入閾值 150ms。
async function tapFire(page: Page): Promise<void> {
  await page.keyboard.down('X');
  await page.waitForTimeout(80);
  await page.keyboard.up('X');
}

test('走動手感（§45）：步頻傾角振盪且 bob 起伏；idle 傾角歸零', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.fillQuota());
  // 走動取樣：傾角應隨步頻振盪（多組相異值）、bob 應出現正值。
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  const samples: { rotation: number; bob: number }[] = [];
  for (let i = 0; i < 16; i += 1) {
    samples.push(await page.evaluate(() => window.__sp.walk()));
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('ArrowRight');
  const rotations = new Set(samples.map((sample) => sample.rotation.toFixed(4)));
  expect(rotations.size).toBeGreaterThanOrEqual(4);
  expect(Math.max(...samples.map((sample) => sample.bob))).toBeGreaterThan(1);
  expect(Math.max(...samples.map((sample) => Math.abs(sample.rotation)))).toBeGreaterThan(0.02);
  // 停走復位：步頻傾角與 bob 歸零（低幀率下 onGround 瞬斷可留 airTilt 微角，容忍 <0.02）。
  await page.waitForTimeout(600);
  const idle = await page.evaluate(() => window.__sp.walk());
  expect(Math.abs(idle.rotation)).toBeLessThan(0.02);
  expect(idle.bob).toBe(0);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('下砸改制（§44）：吞含狀態空中「下＋跳」觸發下砸，彈藥不消耗', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.fillQuota());
  // 吞含（puffed）：先賦星一發。
  await page.evaluate(() => window.__sp.grantStar('jelly'));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo)).toBe(1);
  // 起跳離地後按住下 + 再按跳 → 下砸（vy 直達 700）。
  await page.keyboard.down('Z');
  await page.waitForTimeout(60);
  await page.keyboard.up('Z');
  await page.waitForTimeout(150);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(50);
  await page.keyboard.down('Z');
  await expect
    .poll(() => page.evaluate(() => window.__sp.walk().vy), { timeout: 2000 })
    .toBeGreaterThanOrEqual(690);
  await page.keyboard.up('Z');
  await page.keyboard.up('ArrowDown');
  // 彈藥保持（下砸零彈藥消耗）、生命無損。
  expect(await page.evaluate(() => window.__sp.ammo().ammo)).toBe(1);
  expect(await page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('混合星彈（§46）：依序吞兩異味合成疾光星，一發清列隊三隻', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.fillQuota());
  // jelly + floaty → swiftlight（穿透 3）。
  await page.evaluate(() => window.__sp.grantStar('jelly'));
  await page.evaluate(() => window.__sp.grantStar('floaty'));
  await expect
    .poll(() => page.evaluate(() => window.__sp.ammo()))
    .toEqual({ ammo: 1, flavor: 'jelly', mix: 'swiftlight' });
  // 彈道上列隊三隻 jelly：穿透 3 一發全清（fillQuota 後配額凍結，改以場上存活數斷言）。
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('jelly', x + 140, 350);
    window.__sp.spawn('jelly', x + 200, 350);
    window.__sp.spawn('jelly', x + 260, 350);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 4000 })
    .toBeGreaterThanOrEqual(3);
  await page.waitForTimeout(300);
  await tapFire(page);
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 6000 })
    .toBe(0);
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo)).toBe(0);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

// 韌性右行至精英武裝：死亡重試會重啟場景吞掉按住的鍵，週期重按自癒。
async function walkRightUntilEliteArmed(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.evaluate(() => window.__sp.elite().armed)) return true;
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(350);
  }
  return false;
}

test('中魔王精英（§48）：軟鎖門擋前進，擊敗開門並掉落稀有味與回復食物', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  // 未開門（配額未滿）右行進入精英房：武裝生成精英與軟鎖門。
  expect(await walkRightUntilEliteArmed(page, 40_000)).toBe(true);
  const doorX = await page.evaluate(() => window.__sp.elite().doorX);
  expect(doorX).not.toBeNull();
  // 門阻擋：持續右行 2.5s 仍無法越過門柱。
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2500);
  const blockedX = await page.evaluate(() => window.__sp.probe().x);
  expect(blockedX).toBeLessThan((doorX ?? 0) + 5);
  await page.keyboard.up('ArrowRight');
  // 受控秒殺（正式傷害管線）→ 門開、掉落稀有味小怪（fillQuota 未呼叫，擊殺計入配額）。
  const killsBefore = await page.evaluate(() => window.__sp.quota().killCount);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite()), { timeout: 6000 })
    .toEqual({ armed: true, done: true, doorX: null });
  await expect
    .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 4000 })
    .toBeGreaterThan(killsBefore);
  // 開門後可通行：越過原門位。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.probe().x), { timeout: 10000 })
    .toBeGreaterThan((doorX ?? 0) + 40);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('通關 bot 抽驗（§49）：L1 精英線通關、L3 開門走查皆不卡關', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  // L1 精英線：擊殺精英後補滿配額，右行走完全程入圖（重試自癒重按）。
  expect(await walkRightUntilEliteArmed(page, 40_000)).toBe(true);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().done), { timeout: 6000 })
    .toBe(true);
  await page.evaluate(() => window.__sp.fillQuota());
  {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      if ((await page.evaluate(() => window.__sp.scene())) === 'Map') break;
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(400);
    }
  }
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.scene())).toBe('Map');
  expect(await page.evaluate(() => window.__sp.save().levels['1']?.cleared)).toBe(true);
  // L3（新八種混編 + drilly/glowy 在場）：自地圖節點重入 L1 再跳 L3，開門走查至星星門。
  await page.locator('[data-menu="node-1"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 10000 })
    .toBe('Game');
  await page.evaluate(() => window.__sp.gotoLevel(3));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(3);
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if ((await page.evaluate(() => window.__sp.scene())) === 'Map') break;
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press('Z', { delay: 40 });
    await page.waitForTimeout(500);
  }
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.scene())).toBe('Map');
  expect(await page.evaluate(() => window.__sp.save().levels['3']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('新怪行為（§47）：drilly 潛地免傷破土可殺；glowy 脈衝傷及近身玩家', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await startGame(page);
  // fillQuota 停止自然生成且凍結配額計數：以場上存活數作擊殺斷言。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.evaluate(() => window.__sp.grantStar('jelly'));
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('drilly', x + 170, 330);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 4000 })
    .toBeGreaterThanOrEqual(1);
  // 潛地期星彈免傷：射擊後 drilly 仍存活。
  await tapFire(page);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__sp.alive().total)).toBeGreaterThanOrEqual(1);
  // 破土窗（burrow 2.2s + windup 0.5s 後開 1.4s）：週期補彈連射直到擊殺清場。
  for (let round = 0; round < 14; round += 1) {
    if ((await page.evaluate(() => window.__sp.alive().total)) === 0) break;
    await page.evaluate(() => window.__sp.grantStar('jelly'));
    await tapFire(page);
    await page.waitForTimeout(520);
  }
  expect(await page.evaluate(() => window.__sp.alive().total)).toBe(0);
  // glowy：近身放置後於一個脈衝週期內（預警圈先行）對玩家造成傷害。
  const hpBefore = await page.evaluate(() => window.__sp.playerHp());
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('glowy', x + 60, 330);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 10000 })
    .toBeLessThan(hpBefore);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
