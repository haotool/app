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
      spawn: (kind: string, x?: number, y?: number) => void;
      grantStar: (flavor: string) => void;
      damageBoss: (amount: number) => void;
      ammo: () => { ammo: number; flavor: string; mix: string | null };
      probe: () => { x: number; scrollX: number };
      alive: () => { total: number; inhalable: number };
      elite: () => { armed: boolean; done: boolean; doorX: number | null };
      slayElite: () => void;
      save: () => { levels: Record<string, { cleared: boolean }> };
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
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
}

// 點按發射：跨至少一個遊戲幀且低於吸入閾值 150ms。
async function tapFire(page: Page): Promise<void> {
  await page.keyboard.down('X');
  await page.waitForTimeout(80);
  await page.keyboard.up('X');
}

async function gotoLevel(page: Page, levelId: number): Promise<void> {
  await page.evaluate((id) => window.__sp.gotoLevel(id), levelId);
  await expect
    .poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 })
    .toBe(levelId);
}

// 韌性右行至精英武裝：死亡重試會重啟場景吞掉按住的鍵，週期重按自癒。
async function walkRightUntilEliteArmed(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.__sp.elite());
    if (state.armed && !state.done) return true;
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(350);
  }
  return false;
}

// 韌性右行入圖：週期重按方向鍵＋補跳；死亡重試後 fillQuota 自癒重開門。
async function walkRightUntilMap(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await page.evaluate(() => window.__sp.scene())) === 'Map') return true;
    await page.evaluate(() => window.__sp.fillQuota());
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press('Z', { delay: 40 });
    await page.waitForTimeout(450);
  }
  return false;
}

test('舊存檔相容（§50）：v1 四關通關存檔載入見七節點，L5 開放、L6/L7 迷霧鎖定', async ({
  page,
}) => {
  const errors = collectErrors(page);
  // 預置 v1 舊存檔（1-4 全通關）：任何頁面腳本執行前寫入。
  await page.addInitScript(() => {
    const entry = { cleared: true, bestTimeMs: 45000, eggsFound: [] };
    localStorage.setItem(
      'sp-save',
      JSON.stringify({
        schemaVersion: 1,
        highestClearedLevel: 4,
        levels: { 1: entry, 2: entry, 3: entry, 4: entry },
        lastPlayedAt: Date.now(),
      }),
    );
  });
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 分區分頁（§77）：挑戰 L5 落二區頁——5 開放可入、6/7 迷霧鎖定（無入口鈕）。
  await expect(page.locator('[data-menu="node-5"]')).toBeAttached();
  await expect(page.locator('[data-menu="node-6"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="node-7"]')).toHaveCount(0);
  // 一區頁籤直達：1-4 已通關可入。
  await page.locator('[data-menu="zone-1"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  for (const id of [1, 2, 3, 4]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('上升氣流（§51）：L5 柱域內免跳自然升空，玩家升越高台層', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 5);
  await page.evaluate(() => window.__sp.fillQuota());
  // 右行至第一根氣流柱（x=1000，柱寬 96）。
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    const x = await page.evaluate(() => window.__sp.probe().x);
    if (x >= 968) break;
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(250);
  }
  await page.keyboard.up('ArrowRight');
  // 停在柱內不按跳：升力應將玩家帶離地面（y 400 帶）升越 260。
  await expect
    .poll(() => page.evaluate(() => window.__spStage?.playerY() ?? 999), {
      timeout: 8000,
    })
    .toBeLessThan(260);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L5 通關 bot（§56）：翔風峽谷精英線通關不卡關', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 5);
  // 精英房：武裝 → 受控擊殺（正式傷害管線）→ 開門。
  expect(await walkRightUntilEliteArmed(page, 45_000)).toBe(true);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().done), { timeout: 6000 })
    .toBe(true);
  // 補滿配額走完全程入圖。
  expect(await walkRightUntilMap(page, 60_000)).toBe(true);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.save().levels['5']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L6 通關 bot（§52/§56）：迴聲石廊雙精英逐房擊破後通關', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 6);
  // 第一房（x=1300 重殼迴力守衛）。
  expect(await walkRightUntilEliteArmed(page, 45_000)).toBe(true);
  const firstDoor = await page.evaluate(() => window.__sp.elite().doorX);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().doorX), { timeout: 6000 })
    .not.toBe(firstDoor);
  // 第二房（x=2500 暗雷水母）：續行武裝後擊破。
  expect(await walkRightUntilEliteArmed(page, 45_000)).toBe(true);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().done), { timeout: 6000 })
    .toBe(true);
  expect(await walkRightUntilMap(page, 60_000)).toBe(true);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.save().levels['6']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('Noctra 擊破（§54）：三階段事件流走完整 FSM，勝利入結算且存檔記錄 L7', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 7);
  // 入場運鏡完成後 BOSS_SPAWNED 設定血條（maxHp 52，§54 難度根修後基準）。
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 20000 }).toBe(52);
  // 入場結束才受擊（active 前 applyDamage 靜默忽略）：探針傷害輪詢至首度掉血。
  await expect
    .poll(
      async () => {
        await page.evaluate(() => window.__sp.damageBoss(1));
        return page.evaluate(() => window.__sp.bossHp());
      },
      { timeout: 20000 },
    )
    .toBeLessThan(52);
  // 正式傷害管線連段：跨 P2（≤31.2）與 P3（≤15.6）門檻直至擊破。
  await page.evaluate(() => window.__sp.damageBoss(21));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(30);
  await page.evaluate(() => window.__sp.damageBoss(20));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(10);
  await page.evaluate(() => window.__sp.damageBoss(10));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(0);
  // 擊破演出 → 勝利結算；通關即寫存檔。
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  expect(await page.evaluate(() => window.__sp.save().levels['7']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('新混合三式（§53）：毒爆雲 AoE 清簇；電鋸迴旋與迴風刃配方成立', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.fillQuota());
  // spora + puffy → 毒爆雲（AoE 90 + 緩速場）。
  await page.evaluate(() => window.__sp.grantStar('spora'));
  await page.evaluate(() => window.__sp.grantStar('puffy'));
  await expect
    .poll(() => page.evaluate(() => window.__sp.ammo()))
    .toEqual({ ammo: 1, flavor: 'spora', mix: 'sporeblast' });
  // 彈道上緊簇三隻 jelly：爆點於首敵接觸緣（約 +120），簇距壓在 AoE 90 內必全清；
  // jelly 首跳前（1.3s）即擊發。
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('jelly', x + 150, 350);
    window.__sp.spawn('jelly', x + 175, 350);
    window.__sp.spawn('jelly', x + 200, 350);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 4000 })
    .toBeGreaterThanOrEqual(3);
  await page.waitForTimeout(200);
  await tapFire(page);
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 6000 })
    .toBe(0);
  // boomy + zappy → 電鋸迴旋；floaty + boomy → 迴風刃。
  await page.evaluate(() => window.__sp.grantStar('boomy'));
  await page.evaluate(() => window.__sp.grantStar('zappy'));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().mix)).toBe('voltsaw');
  await page.evaluate(() => window.__sp.grantStar('floaty'));
  await page.evaluate(() => window.__sp.grantStar('boomy'));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().mix)).toBe('galewheel');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('新怪行為（§52）：spora 孢子雲區域拒止、boomy 迴旋殼刃皆傷及近身玩家', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await startGame(page);
  // L3（吞序彩蛋）：迴避 L1 reach-x 彩蛋——雲擊退玩家至左緣會觸發 +1 HP 抵銷傷害斷言。
  await gotoLevel(page, 3);
  await page.evaluate(() => window.__sp.fillQuota());
  // spora：貼身放置，一個噴發週期（3.6s）內孢子雲應命中玩家。
  const hpBefore = await page.evaluate(() => window.__sp.playerHp());
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('spora', x + 50, 330);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 12000 })
    .toBeLessThan(hpBefore);
  // boomy：中距放置，投擲殼刃（去程 144px）應再次命中玩家。
  const hpMid = await page.evaluate(() => window.__sp.playerHp());
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('boomy', x + 150, 330);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 12000 })
    .toBeLessThan(hpMid);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
