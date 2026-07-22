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
      transform: () => { form: string | null; remainingMs: number };
      starburst: () => { phase: string };
      mercyWarp: (ms: number) => void;
      hurtPlayer: (damage: number) => void;
      mercyCount: () => number;
      gameTime: () => number;
      ammo: () => { ammo: number; flavor: string; mix: string | null };
      bossPos: () => { x: number; y: number };
      probe: () => { x: number; scrollX: number };
      alive: () => { total: number; inhalable: number };
      elite: () => { armed: boolean; done: boolean; doorX: number | null };
      slayElite: () => void;
      save: () => {
        levels: Record<string, { cleared: boolean; exCleared?: boolean }>;
      };
    };
    __spBossTrace?: { t: number; x: number; y: number }[];
    __spBossTraceStop?: boolean;
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

// SP 點按（§109 取代星化長按）：headless 低幀率下單次 keydown 的按下緣可能與
// 幀取樣錯拍——週期重按（每拍跨至少一遊戲幀）直到觀測到目標形態（行為守門）。
async function tapSpUntil(page: Page, expected: string | null): Promise<void> {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    await page.keyboard.press('C', { delay: 120 });
    await page.waitForTimeout(250);
    if ((await page.evaluate(() => window.__sp.transform().form)) === expected) return;
  }
  expect(await page.evaluate(() => window.__sp.transform().form)).toBe(expected);
}

// 韌性右行至精英武裝（沿 v8 慣例）：死亡重試重啟場景吞鍵，週期重按自癒。
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

// 預置 v1 存檔：ids 指定通關關卡（任何頁面腳本執行前寫入）。
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

// 舊語意（§57）：同系 x3 地面長按 0.6s 變身、變身中長按解除 → 新語意（§109）：
// 同系 ≥3 地面 SP（鍵盤 C）點按立即變身、變身中 SP 點按提前解除。
test('星化三形態（§109）：同系 x3 按 SP 變身、B 鍵改役、再按 SP 提前解除', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.fillQuota());
  // 雷化：zappy x3 → SP 點按即時變身、彈匣清空。
  for (let i = 0; i < 3; i += 1) await page.evaluate(() => window.__sp.grantStar('zappy'));
  await tapSpUntil(page, 'volt');
  expect((await page.evaluate(() => window.__sp.ammo())).ammo).toBe(0);
  // 雷化 B 鍵改役：點按鏈電束擊殺面前小怪（吸入已停用）。
  await page.evaluate(() => {
    const x = window.__sp.probe().x;
    window.__sp.spawn('jelly', x + 90, 350);
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 4000 })
    .toBeGreaterThanOrEqual(1);
  // 點按跨至少一個遊戲幀（headless 低幀率 ~66ms/幀），放開緣才可被取樣。
  await page.keyboard.press('X', { delay: 120 });
  await expect
    .poll(() => page.evaluate(() => window.__sp.alive().total), { timeout: 6000 })
    .toBe(0);
  // 再按 SP 提前解除（不返彈）。
  await tapSpUntil(page, null);
  expect((await page.evaluate(() => window.__sp.ammo())).ammo).toBe(0);
  // 風化與殼化資格觸發。
  for (let i = 0; i < 3; i += 1) await page.evaluate(() => window.__sp.grantStar('floaty'));
  await tapSpUntil(page, 'gale');
  await tapSpUntil(page, null);
  for (let i = 0; i < 3; i += 1) await page.evaluate(() => window.__sp.grantStar('shelly'));
  await tapSpUntil(page, 'shell');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('EX 挑戰（§58）：通關魔王節點見 EX 入口，EX 果凍王 HP 90 擊破記 exCleared 星章', async ({
  page,
}) => {
  test.setTimeout(120_000);
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
  // 分區分頁（§77）：已通關魔王節點的 EX 第二入口分屬一/二區頁，頁籤直達各自可見。
  await page.locator('[data-menu="zone-2"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('[data-menu="node-7-ex"]')).toBeAttached();
  await page.locator('[data-menu="zone-1"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect(page.locator('[data-menu="node-4-ex"]')).toBeAttached();
  await page.locator('[data-menu="node-4-ex"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  // 前室 retrofit（§86）＋EX 血量 x1.5：走過廊道入 arena 後血條 90。
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(90);
  await page.keyboard.up('ArrowRight');
  await expect
    .poll(
      async () => {
        await page.evaluate(() => window.__sp.damageBoss(1));
        return page.evaluate(() => window.__sp.bossHp());
      },
      { timeout: 20000 },
    )
    .toBeLessThan(90);
  await page.evaluate(() => window.__sp.damageBoss(89));
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp())).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  expect(await page.evaluate(() => window.__sp.save().levels['4']?.exCleared)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().levels['4']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L8 通關 bot（§60）：磁極洞窟磁場干擾下精英線通關不卡關', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 8);
  expect(await walkRightUntilEliteArmed(page, 45_000)).toBe(true);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().done), { timeout: 6000 })
    .toBe(true);
  expect(await walkRightUntilMap(page, 60_000)).toBe(true);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.save().levels['8']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('L9 通關 bot（§60）：鏡影迴廊雙精英逐房擊破後通關', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 9);
  expect(await walkRightUntilEliteArmed(page, 45_000)).toBe(true);
  const firstDoor = await page.evaluate(() => window.__sp.elite().doorX);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().doorX), { timeout: 6000 })
    .not.toBe(firstDoor);
  expect(await walkRightUntilEliteArmed(page, 45_000)).toBe(true);
  await page.evaluate(() => window.__sp.slayElite());
  await expect
    .poll(() => page.evaluate(() => window.__sp.elite().done), { timeout: 6000 })
    .toBe(true);
  expect(await walkRightUntilMap(page, 60_000)).toBe(true);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__sp.save().levels['9']?.cleared)).toBe(true);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('舊存檔相容（§58/§60）：v8 存檔載入九節點，L8 開放、L9 迷霧，EX 入口就位且 exCleared 預設鎖定', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await seedClearedSave(page, [1, 2, 3, 4, 5, 6, 7]);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Map');
  // 分區分頁（§77）：挑戰 L8 落三區頁——8 開放、9 迷霧鎖定（無入口鈕）。
  await expect(page.locator('[data-menu="node-8"]')).toBeAttached();
  await expect(page.locator('[data-menu="node-9"]')).toHaveCount(0);
  // 頁籤直達一/二區：1-7 已通關可入；已通關魔王節點見 EX 入口，
  // 舊檔 exCleared 缺省 false 不 crash。
  await page.locator('[data-menu="zone-2"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  for (const id of [5, 6, 7]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await expect(page.locator('[data-menu="node-7-ex"]')).toBeAttached();
  await page.locator('[data-menu="zone-1"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  for (const id of [1, 2, 3, 4]) {
    await expect(page.locator(`[data-menu="node-${id}"]`)).toBeAttached();
  }
  await expect(page.locator('[data-menu="node-4-ex"]')).toBeAttached();
  expect(await page.evaluate(() => window.__sp.save().levels['7']?.exCleared)).toBe(false);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('慈悲補血（§62）：低血久戰觸發愛心生成，拾取後 HP +1', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  // L3 迴避 L1 reach-x 彩蛋（走左緣 +1 HP 會污染斷言）。
  await gotoLevel(page, 3);
  await page.evaluate(() => window.__sp.fillQuota());
  // 清場護航（§109）：混味五槽（無配方、無同系資格）滿匣自動結晶 → SP 引爆清空
  // 場上小怪；gate 已開不再補生，低血走位不被殘敵干擾（防死亡重試污染斷言）。
  for (const flavor of ['jelly', 'shelly', 'jelly', 'shelly', 'jelly']) {
    await page.evaluate((kind) => window.__sp.grantStar(kind), flavor);
  }
  await expect
    .poll(() => page.evaluate(() => window.__sp.starburst().phase), { timeout: 8000 })
    .toBe('charged');
  const detonated = async (): Promise<boolean> => {
    await page.keyboard.press('C', { delay: 120 });
    await page.waitForTimeout(250);
    return page.evaluate(
      () => window.__sp.starburst().phase === 'none' && window.__sp.alive().total === 0,
    );
  };
  await expect.poll(detonated, { timeout: 10_000 }).toBe(true);
  // 星暴附 5s 無敵窗（§64）：以遊戲時鐘等窗期滿再壓血，避免無敵期輪詢空轉吃掉預算。
  const stormAt = await page.evaluate(() => window.__sp.gameTime());
  await expect
    .poll(() => page.evaluate((t0) => window.__sp.gameTime() - t0, stormAt), { timeout: 30_000 })
    .toBeGreaterThan(5200);
  // 正式受擊管線壓血至 1（i-frame 1.5s 間隔輪詢）。
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const hp = await page.evaluate(() => window.__sp.playerHp());
    if (hp <= 1) break;
    await page.evaluate(() => window.__sp.hurtPlayer(1));
    await page.waitForTimeout(1600);
  }
  expect(await page.evaluate(() => window.__sp.playerHp())).toBe(1);
  // 先離開世界左緣（受擊擊退堆積）再快轉：愛心錨點（玩家左側 120px）保持在可走位帶。
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2500);
  await page.keyboard.up('ArrowRight');
  // 時間快轉 ≥60s ＋ RNG 必中：原地等下一次 5s 評估生成（錨點＝玩家左側 120px）。
  await page.evaluate(() => window.__sp.mercyWarp(120_000));
  await expect
    .poll(() => page.evaluate(() => window.__sp.mercyCount()), { timeout: 12_000 })
    .toBe(1);
  // 生成確認後左行掃過愛心錨點接住：HP 1 → 2。
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 15_000 }).toBe(2);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('Noctra 返空連續飛行（§64 P0 熱修）：俯衝→返空→歸位全程無單幀瞬移', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await gotoLevel(page, 7);
  // 前室 retrofit（§86）：走過廊道入 arena 觸發魔王入場。
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 }).toBe(52);
  await page.keyboard.up('ArrowRight');
  // 誘導俯衝落點遠離盤旋相位點：玩家走到世界左緣（瞬移量與 |aimX−相位x| 成正比）。
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowLeft');
  // rAF 逐幀取樣魔王座標＋遊戲時鐘：涵蓋 P1 首輪 hover→bomb→hover→dive→返空→歸位。
  await page.evaluate(() => {
    window.__spBossTrace = [];
    window.__spBossTraceStop = false;
    const step = () => {
      const trace = window.__spBossTrace;
      if (!trace || window.__spBossTraceStop || trace.length >= 2500) return;
      trace.push({ t: window.__sp.gameTime(), ...window.__sp.bossPos() });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  // 等到取樣觀測到俯衝落地（y > 320），再多收 4s 涵蓋返空與歸位交接。
  await expect
    .poll(() => page.evaluate(() => (window.__spBossTrace ?? []).some((p) => p.y > 320)), {
      timeout: 30_000,
    })
    .toBe(true);
  await page.waitForTimeout(4000);
  const trace = await page.evaluate(() => {
    window.__spBossTraceStop = true;
    return window.__spBossTrace ?? [];
  });
  // 全程速度守門（遊戲時鐘正規化對齊 tween 位移）：合法峰值為俯衝 easeIn 尾速——
  // 邏輯寬 1039 下最壞全寬 plunge 約 5000px/s，預算 6000px/s；瞬移單幀數百 px
  // （>20000px/s）仍遠超。細部連續性由下方返空段 400px/s 緊縮守門把關。
  let checked = 0;
  for (let i = 1; i < trace.length; i += 1) {
    const prev = trace[i - 1];
    const curr = trace[i];
    if (!prev || !curr) continue;
    const gameDtMs = curr.t - prev.t;
    if (gameDtMs <= 0 || gameDtMs > 210) continue;
    const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const budgetPx = (6000 * gameDtMs) / 1000 + 8;
    expect(
      dist,
      `第 ${i} 幀位移 ${dist.toFixed(1)}px 超出 ${budgetPx.toFixed(1)}px（dt=${gameDtMs.toFixed(1)}ms）`,
    ).toBeLessThanOrEqual(budgetPx);
    checked += 1;
  }
  expect(checked).toBeGreaterThan(60);
  // 返空歸位相位緊縮守門：落地後首次回到盤旋帶（y ≤ 260）起 2s 內，僅回升 tween
  // 與盤旋駕駛移動（≤340px/s×sf；含取樣競態表觀倍增餘裕取 900px/s）。原 bug 的相位
  // 座標直寫瞬移為單幀數百 px（任一 dt ≤210ms 下皆超出 900×dt+8），必然超標。
  const landingIdx = trace.findIndex((p) => p.y > 320);
  expect(landingIdx).toBeGreaterThan(-1);
  const returnIdx = trace.findIndex((p, i) => i > landingIdx && p.y <= 260);
  expect(returnIdx).toBeGreaterThan(-1);
  const returnStart = trace[returnIdx];
  if (!returnStart) throw new Error('返空樣本缺失');
  let phaseChecked = 0;
  for (let i = returnIdx + 1; i < trace.length; i += 1) {
    const prev = trace[i - 1];
    const curr = trace[i];
    if (!prev || !curr) continue;
    if (curr.t - returnStart.t > 2000) break;
    const gameDtMs = curr.t - prev.t;
    if (gameDtMs <= 0 || gameDtMs > 210) continue;
    const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const budgetPx = (900 * gameDtMs) / 1000 + 8;
    expect(
      dist,
      `返空第 ${i} 幀位移 ${dist.toFixed(1)}px 超出 ${budgetPx.toFixed(1)}px（dt=${gameDtMs.toFixed(1)}ms）`,
    ).toBeLessThanOrEqual(budgetPx);
    phaseChecked += 1;
  }
  expect(phaseChecked).toBeGreaterThan(5);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

// 舊語意（§64）：異系滿匣長按 0.8s 發動 → 新語意（§109）：滿五槽結晶後 SP 點按
// 引爆才開無敵窗（結晶本身不附無敵）。
test('星暴無敵（§64/§109）：引爆即 5s 無敵、期間零傷害、到期恢復受擊', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.fillQuota());
  // 異系五槽（jelly/zappy 交錯無配方、不同系不觸變身資格）→ 滿匣自動結晶。
  for (const flavor of ['jelly', 'zappy', 'jelly', 'zappy', 'jelly']) {
    await page.evaluate((kind) => window.__sp.grantStar(kind), flavor);
  }
  await expect
    .poll(() => page.evaluate(() => window.__sp.starburst().phase), { timeout: 8000 })
    .toBe('charged');
  expect((await page.evaluate(() => window.__sp.ammo())).ammo).toBe(0);
  // SP 點按 → 0.3s 蓄爆 → 引爆開 5s 無敵窗。
  const detonated = async (): Promise<boolean> => {
    await page.keyboard.press('C', { delay: 120 });
    await page.waitForTimeout(250);
    return page.evaluate(() => window.__sp.starburst().phase === 'none');
  };
  await expect.poll(detonated, { timeout: 10_000 }).toBe(true);
  const stormAt = await page.evaluate(() => window.__sp.gameTime());
  const hpAtStorm = await page.evaluate(() => window.__sp.playerHp());
  // 無敵期內連續以正式受擊管線打擊：HP 恆不變。
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate(() => window.__sp.hurtPlayer(1));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__sp.playerHp())).toBe(hpAtStorm);
  }
  // 等遊戲時鐘走滿 5s 窗（headless 遊戲時間落後牆鐘，以 gameTime 為準）。
  await expect
    .poll(() => page.evaluate((t0) => window.__sp.gameTime() - t0, stormAt), {
      timeout: 30_000,
    })
    .toBeGreaterThan(5200);
  // 到期恢復：受擊管線恢復扣血（輪詢容忍殘餘 i-frame 邊界）。
  await expect
    .poll(
      async () => {
        await page.evaluate(() => window.__sp.hurtPlayer(1));
        return page.evaluate(() => window.__sp.playerHp());
      },
      { timeout: 10_000 },
    )
    .toBeLessThan(hpAtStorm);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
