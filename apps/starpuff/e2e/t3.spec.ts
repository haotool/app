import { expect, test, type Page } from '@playwright/test';

// T3 星暴 2.0＋SP 情境鍵驗收（#815，連動 #812 輸入面）：
// SP 三態（引爆/變身/解除）＋隱藏條件、B 長按誤放歸零、蓄能星跨關持有/死亡清除/
// EX 進場清除/不疊加、鍵盤 C 桌機映射。

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      fillQuota: () => void;
      gotoLevel: (levelId: number, ex?: boolean) => void;
      grantStar: (flavor: string) => void;
      hurtPlayer: (damage: number) => void;
      transform: () => { form: string | null; remainingMs: number };
      starburst: () => { phase: string };
      ammo: () => { ammo: number; flavor: string; mix: string | null };
      probe: () => { x: number; scrollX: number };
      alive: () => { total: number; inhalable: number };
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
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
}

// 混味五槽注入（jelly/shelly 交錯：無配方、無同系變身資格）→ 滿匣自動結晶。
async function grantChargedStar(page: Page): Promise<void> {
  for (const flavor of ['jelly', 'shelly', 'jelly', 'shelly', 'jelly']) {
    await page.evaluate((kind) => window.__sp.grantStar(kind), flavor);
  }
  await expect
    .poll(() => page.evaluate(() => window.__sp.starburst().phase), { timeout: 8000 })
    .toBe('charged');
  expect(await page.evaluate(() => window.__sp.ammo().ammo)).toBe(0);
}

// SP 點按（鍵盤 C）：headless 幀取樣錯拍防護——週期重按直到觀測到預期條件。
async function tapSpUntil(page: Page, predicate: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    await page.keyboard.press('C', { delay: 120 });
    await page.waitForTimeout(250);
    if (await predicate()) return;
  }
  expect(await predicate()).toBe(true);
}

// 韌性右行至過門進世界地圖（沿 v9 慣例）：fillQuota 原子補配額防敵潮干擾。
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

// 預置 v1 存檔（沿 v9 慣例）：EX 入口需魔王節點已通關。
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

// 行動觸控情境（Mobile Chrome project）：桌機 project 僅跑末段鍵盤映射 describe。
test.describe('行動觸控情境', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) >= 1024,
    '觸控情境於 Mobile Chrome project 執行',
  );

  test('SP 三態與隱藏條件（§109）：無技能隱藏→變身徽→解除箭→引爆星→蓄爆後隱藏', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await startGame(page);
    await page.evaluate(() => window.__sp.fillQuota());
    const spBtn = page.locator('[data-btn="sp"]');
    // 無技能可用：SP 完全隱藏。
    await expect(spBtn).not.toHaveClass(/is-sp-on/);
    // 同系 x3（地面）：變身資格成立 → SP 浮現（形態色圓徽）。
    for (let i = 0; i < 3; i += 1) await page.evaluate(() => window.__sp.grantStar('zappy'));
    await expect(spBtn).toHaveClass(/is-sp-on/, { timeout: 8000 });
    // SP 點按 → 立即變身；變身中 SP 仍可用（解除迴旋箭）。
    await tapSpUntil(page, () => page.evaluate(() => window.__sp.transform().form === 'volt'));
    await expect(spBtn).toHaveClass(/is-sp-on/);
    // 再按 SP 提前解除；彈匣已空（變身消耗）→ 無技能 → SP 隱藏。
    await tapSpUntil(page, () => page.evaluate(() => window.__sp.transform().form === null));
    await expect(spBtn).not.toHaveClass(/is-sp-on/, { timeout: 8000 });
    // 蓄能星存在 → SP 浮現（金色大星）；引爆完成後無技能 → 隱藏。
    await grantChargedStar(page);
    await expect(spBtn).toHaveClass(/is-sp-on/, { timeout: 8000 });
    await tapSpUntil(page, () => page.evaluate(() => window.__sp.starburst().phase === 'none'));
    await expect(spBtn).not.toHaveClass(/is-sp-on/, { timeout: 8000 });
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });

  test('誤放歸零（#812）：B 鍵任何長按不觸發星暴也不變身；點按發射語意不變', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await startGame(page);
    await page.evaluate(() => window.__sp.fillQuota());
    // 蓄能星＋滿匣（不疊加狀態）：長按 B 1.5s——不得引爆、彈匣不得清空
    //（舊 0.8s 星暴長按路徑已移除）。
    await grantChargedStar(page);
    for (const flavor of ['jelly', 'shelly', 'jelly', 'shelly', 'jelly']) {
      await page.evaluate((kind) => window.__sp.grantStar(kind), flavor);
    }
    // 不疊加：蓄能星存在時再滿匣不再結晶，彈匣維持 5。
    expect(await page.evaluate(() => window.__sp.ammo().ammo)).toBe(5);
    expect(await page.evaluate(() => window.__sp.starburst().phase)).toBe('charged');
    // 長按 B 1.5s：按下緣發射一發（§109 即按即射，滿匣不再 defer）→ 續按轉吸入；
    // 不得引爆蓄能星、不得整匣清空（舊 0.8s 星暴長按會直接歸零）。
    await page.keyboard.down('X');
    await page.waitForTimeout(1500);
    await page.keyboard.up('X');
    expect(await page.evaluate(() => window.__sp.starburst().phase)).toBe('charged');
    expect(await page.evaluate(() => window.__sp.ammo().ammo)).toBe(4);
    // B 點按發射語意不變：再點按續射一發。
    await page.keyboard.press('X', { delay: 120 });
    await expect
      .poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 })
      .toBe(3);
    // 同系 x3（變身資格成立）：長按 B 1.2s——不得變身（舊地面長按 0.6s 路徑已移除）。
    await page.evaluate(() => window.__sp.gotoLevel(1));
    await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(1);
    await page.evaluate(() => window.__sp.fillQuota());
    for (let i = 0; i < 3; i += 1) await page.evaluate(() => window.__sp.grantStar('zappy'));
    await page.keyboard.down('X');
    await page.waitForTimeout(1200);
    await page.keyboard.up('X');
    expect(await page.evaluate(() => window.__sp.transform().form)).toBeNull();
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });

  test('蓄能星跨關持有（§109）：帶星過門進下一關仍在；死亡清除', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await startGame(page);
    await grantChargedStar(page);
    // 帶星過門：L1 → Map（首次帶星過關 toast 於此觸發，斷言以相位為準）。
    expect(await walkRightUntilMap(page, 60_000)).toBe(true);
    await page.keyboard.up('ArrowRight');
    // 進下一關：蓄能星跨關持有。
    await page
      .locator('[data-menu="node-2"]')
      .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
    await expect
      .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
      .toBe('Game');
    await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(2);
    await expect
      .poll(() => page.evaluate(() => window.__sp.starburst().phase), { timeout: 8000 })
      .toBe('charged');
    // 死亡清除：正式受擊管線致死 → 重試後蓄能星消失。
    await page.evaluate(() => window.__sp.hurtPlayer(5));
    await expect.poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 8000 }).toBe(5);
    expect(await page.evaluate(() => window.__sp.starburst().phase)).toBe('none');
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });

  test('EX 進場清除（§109/§8.4）：帶星通關後進 EX 變體，蓄能星被清除', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = collectErrors(page);
    await seedClearedSave(page, [1, 2, 3, 4]);
    await startGame(page);
    await page.evaluate(() => window.__sp.gotoLevel(3));
    await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(3);
    await grantChargedStar(page);
    // L3 帶星過門 → Map（carry 成立）→ 進 L4 EX：EX 純度要求進場清除。
    expect(await walkRightUntilMap(page, 60_000)).toBe(true);
    await page.keyboard.up('ArrowRight');
    await page
      .locator('[data-menu="node-4-ex"]')
      .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
    await expect
      .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
      .toBe('Game');
    await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__sp.starburst().phase)).toBe('none');
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });
});

// 桌機鍵盤映射（Desktop Chrome project）：C=SP 全鍵盤流程可完成變身。
test.describe('鍵盤 C 桌機映射（§109）', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < 1024,
    '桌機情境需寬視口 project（Desktop Chrome）',
  );

  test('桌機：同系 x3 按 C 立即變身、再按 C 解除', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await startGame(page);
    await page.evaluate(() => window.__sp.fillQuota());
    for (let i = 0; i < 3; i += 1) await page.evaluate(() => window.__sp.grantStar('floaty'));
    await tapSpUntil(page, () => page.evaluate(() => window.__sp.transform().form === 'gale'));
    await tapSpUntil(page, () => page.evaluate(() => window.__sp.transform().form === null));
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });
});
