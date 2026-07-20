import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      gotoLevel: (levelId: number, ex?: boolean) => void;
      damageBoss: (amount: number) => void;
      bossHp: () => number;
      probe: () => { x: number; scrollX: number };
      codexTab: () => string;
      save: () => { schemaVersion: number; achievements: string[] };
      achievementToast: () => string;
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

const ALL_TWENTY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
const BOSS_IDS = [4, 7, 12, 16, 20] as const;

// v1 世代存檔種子（§94）：schemaVersion 1、無 achievements 欄位——模擬 v9–v14 舊玩家。
async function seedV1Save(
  page: Page,
  ids: readonly number[],
  options: { exIds?: readonly number[]; eggs?: Record<number, readonly string[]> } = {},
): Promise<void> {
  await page.addInitScript(
    ({ clearedIds, exClearedIds, eggMap }) => {
      const levels: Record<
        string,
        { cleared: boolean; bestTimeMs: number; eggsFound: string[]; exCleared?: boolean }
      > = {};
      for (const id of clearedIds) {
        levels[String(id)] = {
          cleared: true,
          bestTimeMs: 45000,
          eggsFound: [...(eggMap[String(id)] ?? [])],
        };
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
    {
      clearedIds: ids,
      exClearedIds: options.exIds ?? [],
      eggMap: Object.fromEntries(
        Object.entries(options.eggs ?? {}).map(([key, value]) => [key, [...value]]),
      ) as Record<string, string[]>,
    },
  );
}

async function gotoTitle(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
}

test('舊存檔開機補發（§94）：v13 世代 v1 存檔載入即補發歷史成就並升 v2', async ({ page }) => {
  const errors = collectErrors(page);
  // 全 20 通關＋五王 EX＋三隱藏彩蛋（彩蛋僅 3 顆）：開機補發精確 19 條——
  // egg-10／egg-all 未達門檻必須不補發（無多發）。
  await seedV1Save(page, ALL_TWENTY, {
    exIds: BOSS_IDS,
    eggs: { 12: ['twin-finish'], 16: ['vent-hit-count'], 20: ['survive-collect'] },
  });
  await gotoTitle(page);
  // 持久化層直讀：schema 升 v2 且補發已落盤（parseSave 正規化前的真值）。
  const persisted = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('sp-save') ?? '{}') as {
        schemaVersion: number;
        achievements?: string[];
      },
  );
  expect(persisted.schemaVersion).toBe(2);
  const awarded = persisted.achievements ?? [];
  expect(awarded).toHaveLength(19);
  for (const id of [
    'first-clear',
    'all-clear',
    'ex-conquest',
    'egg-first',
    'egg-twin',
    'egg-vent',
    'egg-core',
    'speed-boss-60',
    'speed-boss-120',
  ]) {
    expect(awarded).toContain(id);
  }
  expect(awarded).not.toContain('egg-10');
  expect(awarded).not.toContain('egg-all');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('成就分頁（§94）：圖鑑第三分頁切換、部分進度開機零補發', async ({ page }) => {
  const errors = collectErrors(page);
  await seedV1Save(page, [1, 2, 3]);
  await gotoTitle(page);
  // 部分進度：僅 first-clear 成立——開機補發恰一條，無多發。
  await expect
    .poll(() => page.evaluate(() => window.__sp.save().achievements))
    .toEqual(['first-clear']);
  await page.locator('[data-menu="codex"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Codex');
  await page.locator('[data-menu="tab-achievements"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.codexTab())).toBe('achievements');
  // 分頁往返：成就頁 → 圖鑑頁不留殘影（restart 重建）。
  await page.locator('[data-menu="tab-monsters"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.codexTab())).toBe('monsters');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

// 以正式傷害管線磨破果凍王（入場運鏡完成後傷害才結算）。
async function slayJellord(page: Page, expectedHp: number): Promise<void> {
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 })
    .toBe(expectedHp);
  await page.keyboard.up('ArrowRight');
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const hp = await page.evaluate(() => window.__sp.bossHp());
    if (hp <= 0) break;
    await page.evaluate(() => window.__sp.damageBoss(15));
    await page.waitForTimeout(300);
  }
  expect(await page.evaluate(() => window.__sp.bossHp())).toBeLessThanOrEqual(0);
}

test('遊戲內解鎖（§94）：真實擊破管線寫入成就並顯示合併 toast', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  // 直達 L4 以正式傷害管線擊破果凍王：boss-jellord＋速通成就經 persistAndAward 落盤。
  await page.evaluate(() => window.__sp.gotoLevel(4));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(4);
  await slayJellord(page, 60);
  // 擊破批 toast（觀測點）：同批合併單張、含首勝名稱。
  await expect
    .poll(() => page.evaluate(() => window.__sp.achievementToast()), { timeout: 10000 })
    .toContain('搖晃的王座');
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  const afterWin = await page.evaluate(() => window.__sp.save().achievements);
  expect(afterWin).toContain('boss-jellord');
  expect(afterWin).toContain('speed-boss-120');
  expect(afterWin).not.toContain('ex-jellord');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('EX 擊破頒發（§94）：EX 變體擊破僅頒 EX 成就、不動一般首勝與速通', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  // EX 果凍王：60 × 1.5 = 90（§58 EX_MODS）。
  await page.evaluate(() => window.__sp.gotoLevel(4, true));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(4);
  await slayJellord(page, 90);
  await expect
    .poll(() => page.evaluate(() => window.__sp.achievementToast()), { timeout: 10000 })
    .toContain('EX 果凍王制霸');
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15000 })
    .toBe('Result');
  const after = await page.evaluate(() => window.__sp.save().achievements);
  expect(after).toContain('ex-jellord');
  // EX 不寫 cleared/bestTime（§58）：首勝與速通不得誤發。
  expect(after).not.toContain('boss-jellord');
  expect(after).not.toContain('speed-boss-120');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
