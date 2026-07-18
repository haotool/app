import { expect, test, type Page } from '@playwright/test';

// §71 熱修驗收：站台下＋跳穿落（雙平台型×雙輸入路）、蹲姿與跳鍵下跳指示、
// 下砸僅真空中觸發、吸入中怪物接觸豁免（中斷後恢復傷害性）。

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      playerHp: () => number;
      fillQuota: () => void;
      spawn: (kind: string, x?: number, y?: number) => void;
      probe: () => { x: number; scrollX: number };
      walk: () => { rotation: number; bob: number; vy: number };
      crouch: () => number;
    };
    __spStage?: { playerY(): number };
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
  await page.evaluate(() => window.__sp.fillQuota());
}

const playerY = (page: Page): Promise<number> =>
  page.evaluate(() => window.__spStage?.playerY() ?? -1);

// 走到目標 x（±12px），供登台前對位。
async function walkTo(page: Page, target: number): Promise<void> {
  const cur = (await page.evaluate(() => window.__sp.probe())).x;
  if (Math.abs(cur - target) <= 12) return;
  const key = cur < target ? 'ArrowRight' : 'ArrowLeft';
  await page.keyboard.down(key);
  await page.waitForFunction((t) => Math.abs(window.__sp.probe().x - t) <= 12, target, {
    timeout: 30_000,
  });
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
}

// 登上腳下正上方的平台（最多重試 3 次；平台層 stance y < 320、地面 ~377）。
async function climbPlatform(page: Page, x: number): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await walkTo(page, x);
    await page.keyboard.down('Z');
    await page.waitForTimeout(90);
    await page.keyboard.up('Z');
    await page.waitForTimeout(1000);
    if ((await playerY(page)) < 320) return;
  }
  throw new Error('登台失敗');
}

test('站台下＋跳＝穿落（鍵盤，elements 單向平台）且不觸發下砸', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // L1 elements oneway：x=1000。
  await climbPlatform(page, 1000);
  const jumpBtn = page.locator('[data-btn="a"]');
  await expect(jumpBtn).not.toHaveClass(/is-drop-ready/);
  // 壓下 → 蹲姿到位 + 跳鍵下跳指示亮起。
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => page.evaluate(() => window.__sp.crouch())).toBe(1);
  await expect(jumpBtn).toHaveClass(/is-drop-ready/);
  // 按跳 → 穿落到地面層；全程 vy 不得達下砸速（700）。
  await page.keyboard.down('Z');
  let maxVy = 0;
  await expect
    .poll(
      async () => {
        maxVy = Math.max(maxVy, (await page.evaluate(() => window.__sp.walk())).vy);
        return playerY(page);
      },
      { intervals: [30, 50], timeout: 4000 },
    )
    .toBeGreaterThan(360);
  expect(maxVy).toBeLessThan(600);
  await page.keyboard.up('Z');
  await page.keyboard.up('ArrowDown');
  // 離開可穿落狀態 → 指示還原、蹲姿回彈。
  await expect(jumpBtn).not.toHaveClass(/is-drop-ready/);
  await expect.poll(() => page.evaluate(() => window.__sp.crouch())).toBe(0);
  expect(errors).toEqual([]);
});

test('地形粉紅平台同權穿落（觸控：搖桿下滑＋A 鍵）', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // L1 terrain platform：x=700。
  await climbPlatform(page, 700);
  // 浮動搖桿：落點定錨後向下滑 48px（超過下向閾值 30）。
  const joyZone = page.locator('#joy-zone');
  await joyZone.dispatchEvent('pointerdown', {
    pointerId: 21,
    isPrimary: true,
    clientX: 150,
    clientY: 200,
  });
  await joyZone.dispatchEvent('pointermove', {
    pointerId: 21,
    isPrimary: true,
    clientX: 150,
    clientY: 248,
  });
  // 蹲姿到位 + 跳鍵變色。
  await expect.poll(() => page.evaluate(() => window.__sp.crouch())).toBe(1);
  const jumpBtn = page.locator('[data-btn="a"]');
  await expect(jumpBtn).toHaveClass(/is-drop-ready/);
  // A 鍵（跳）→ 穿落到地面層。
  await jumpBtn.dispatchEvent('pointerdown', { pointerId: 22, isPrimary: false });
  await expect
    .poll(() => playerY(page), { intervals: [30, 50], timeout: 4000 })
    .toBeGreaterThan(360);
  await jumpBtn.dispatchEvent('pointerup', { pointerId: 22, isPrimary: false });
  await joyZone.dispatchEvent('pointerup', {
    pointerId: 21,
    isPrimary: true,
    clientX: 150,
    clientY: 248,
  });
  await expect(jumpBtn).not.toHaveClass(/is-drop-ready/);
  expect(errors).toEqual([]);
});

test('地面下＋跳＝一般跳躍（不下砸不穿落）；真空中下＋跳＝下砸', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await walkTo(page, 500);
  const groundY = await playerY(page);
  expect(groundY).toBeGreaterThan(360);
  // 地面下＋跳：應向上起跳（y 變小）、全程 vy 不達下砸速。
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(120);
  await page.keyboard.down('Z');
  let minY = groundY;
  let maxVy = 0;
  for (let i = 0; i < 10; i += 1) {
    minY = Math.min(minY, await playerY(page));
    maxVy = Math.max(maxVy, (await page.evaluate(() => window.__sp.walk())).vy);
    await page.waitForTimeout(50);
  }
  await page.keyboard.up('Z');
  expect(minY).toBeLessThan(groundY - 40);
  expect(maxVy).toBeLessThan(600);
  await page.waitForTimeout(700);
  // 真空中（起跳離地 >150ms coyote 窗後）下＋跳 → 下砸（vy 直達 700 帶）。
  await page.keyboard.up('ArrowDown');
  await page.keyboard.down('Z');
  await page.waitForTimeout(80);
  await page.keyboard.up('Z');
  await page.waitForTimeout(240);
  await page.keyboard.down('ArrowDown');
  await page.keyboard.down('Z');
  await expect
    .poll(() => page.evaluate(() => window.__sp.walk().vy), {
      intervals: [20, 40],
      timeout: 2000,
    })
    .toBeGreaterThanOrEqual(690);
  await page.keyboard.up('Z');
  await page.keyboard.up('ArrowDown');
  expect(errors).toEqual([]);
});

test('吸入中怪物貼身零傷害；吸入中斷豁免過期後恢復傷害性', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await walkTo(page, 500);
  const hp0 = await page.evaluate(() => window.__sp.playerHp());
  // 前方 120px 生怪 → 長按吸入拉近，中途鬆開（吸入中斷、怪帶殘速貼身）。
  await page.evaluate(() => {
    const p = window.__sp.probe();
    window.__sp.spawn('jelly', p.x + 120, 350);
  });
  await page.waitForTimeout(60);
  await page.keyboard.down('X');
  await page.waitForTimeout(320);
  await page.keyboard.up('X');
  // 豁免窗（250ms）內貼身：零傷害。
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__sp.playerHp())).toBe(hp0);
  // 豁免過期後該怪恢復傷害性（風險回報保留）：等它接觸扣血。
  await expect
    .poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 5000 })
    .toBeLessThan(hp0);
  expect(errors).toEqual([]);
});
