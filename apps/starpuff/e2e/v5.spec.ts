import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      bossHp: () => number;
      skipToBoss: () => void;
      spawn: (kind: string, x?: number, y?: number) => void;
      ammo: () => { ammo: number; flavor: string };
      probe: () => { x: number; scrollX: number };
      quota: () => { killCount: number; killQuota: number };
      paused: () => boolean;
      scenePaused: () => boolean;
      gameTime: () => number;
      codexTab: () => string;
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

async function gotoTitle(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
}

async function startGame(page: Page): Promise<void> {
  await gotoTitle(page);
  await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
}

test('暫停/接續（§35）：ESC 立即真暫停（時鐘與實體凍結），繼續後恢復運行', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  expect(await page.evaluate(() => window.__sp.paused())).toBe(true);
  // 真暫停斷言：sys.isPaused 為真，且暫停期間場景時鐘與實體座標連續取樣不變。
  expect(await page.evaluate(() => window.__sp.scenePaused())).toBe(true);
  const t1 = await page.evaluate(() => ({
    time: window.__sp.gameTime(),
    probe: window.__sp.probe(),
  }));
  await page.waitForTimeout(400);
  const t2 = await page.evaluate(() => ({
    time: window.__sp.gameTime(),
    probe: window.__sp.probe(),
  }));
  expect(t2.time).toBe(t1.time);
  expect(t2.probe).toEqual(t1.probe);
  await page.locator('[data-pause="resume"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect(page.locator('.pause-overlay')).toHaveCount(0);
  expect(await page.evaluate(() => window.__sp.paused())).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__sp.scenePaused())).toBe(false);
  // 恢復後時鐘續走。
  await expect.poll(() => page.evaluate(() => window.__sp.gameTime())).toBeGreaterThan(t2.time);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

test('暫停重新開始（§35）：彈藥/血量/擊殺配額/實體重置回關卡初始', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 先取得 1 發彈藥（吸入受控生成的 jelly），製造非初始狀態。
  await page.keyboard.down('X');
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__sp.spawn('jelly', 185, 340));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 }).toBe(1);
  await page.keyboard.up('X');
  // 擊殺一隻累積配額：彈道上生成標準靶後點按發射（同 smoke 測試模式）。
  await page.evaluate(() => window.__sp.spawn('jelly', 300, 350));
  await page.waitForTimeout(400);
  await page.keyboard.down('X');
  await page.waitForTimeout(80);
  await page.keyboard.up('X');
  await expect
    .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 4000 })
    .toBeGreaterThanOrEqual(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  await page.locator('[data-pause="restart"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect(page.locator('.pause-overlay')).toHaveCount(0);
  // 重開後回到當前關（第 1 關）且彈藥歸零、血量回滿、擊殺配額歸零。
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await expect.poll(() => page.evaluate(() => window.__sp.quota().killCount)).toBe(0);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('Boss 戰中暫停再繼續（§35）：戰鬥凍結後可無縫接續', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.skipToBoss());
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 15000 })
    .toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  expect(await page.evaluate(() => window.__sp.scenePaused())).toBe(true);
  const before = await page.evaluate(() => ({
    time: window.__sp.gameTime(),
    bossHp: window.__sp.bossHp(),
  }));
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({
    time: window.__sp.gameTime(),
    bossHp: window.__sp.bossHp(),
  }));
  expect(after).toEqual(before);
  await page.locator('[data-pause="resume"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scenePaused())).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  expect(await page.evaluate(() => window.__sp.stage())).toBe(4);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('離頁自動暫停（§35）：visibilitychange 隱藏即入暫停選單，回主選單可退出', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });
  await expect(page.locator('.pause-overlay')).toBeVisible();
  expect(await page.evaluate(() => window.__sp.paused())).toBe(true);
  await page.locator('[data-pause="quit"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('圖鑑/技能介紹（§36）：主選單進入、分頁切換、返回', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="codex"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Codex');
  expect(await page.evaluate(() => window.__sp.codexTab())).toBe('monsters');
  await page.locator('[data-menu="tab-skills"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.codexTab())).toBe('skills');
  await page.locator('[data-menu="tab-monsters"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.codexTab())).toBe('monsters');
  await page.locator('[data-menu="back"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('按鈕配置取消（§34）：拖曳後取消還原布局且不寫入 localStorage', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="config"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect(page.locator('.cfg-bar')).toBeVisible();
  const keyB = page.locator('[data-btn="b"]');
  const beforeLeft = await keyB.evaluate((el) => parseFloat((el as HTMLElement).style.left));
  const box = await keyB.boundingBox();
  if (!box) throw new Error('B 鍵不存在');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await keyB.dispatchEvent('pointerdown', {
    pointerId: 8,
    isPrimary: true,
    clientX: startX,
    clientY: startY,
  });
  await keyB.dispatchEvent('pointermove', {
    pointerId: 8,
    isPrimary: true,
    clientX: startX - 200,
    clientY: startY + 40,
  });
  await keyB.dispatchEvent('pointerup', { pointerId: 8, isPrimary: true });
  await expect
    .poll(() => keyB.evaluate((el) => parseFloat((el as HTMLElement).style.left)))
    .toBeLessThan(beforeLeft);
  await page.locator('[data-cfg="cancel"]').dispatchEvent('pointerdown', {
    pointerId: 8,
    isPrimary: true,
  });
  await expect(page.locator('.cfg-bar')).toHaveCount(0);
  // 取消還原進入時布局且未寫入 localStorage。
  expect(await keyB.evaluate((el) => parseFloat((el as HTMLElement).style.left))).toBeCloseTo(
    beforeLeft,
    1,
  );
  expect(await page.evaluate(() => localStorage.getItem('sp-key-layout'))).toBeNull();
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});

test('按鈕配置（§34）：拖曳 B 鍵、儲存 localStorage、重載後套用、恢復預設', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="config"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect(page.locator('.cfg-bar')).toBeVisible();
  const keyB = page.locator('[data-btn="b"]');
  await expect(keyB).toBeVisible();
  // 拖曳 B 鍵至畫面中央偏左（synthetic pointer 序列於元素本身派發）。
  const box = await keyB.boundingBox();
  if (!box) throw new Error('B 鍵不存在');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await keyB.dispatchEvent('pointerdown', {
    pointerId: 8,
    isPrimary: true,
    clientX: startX,
    clientY: startY,
  });
  await keyB.dispatchEvent('pointermove', {
    pointerId: 8,
    isPrimary: true,
    clientX: startX - 220,
    clientY: startY + 60,
  });
  await keyB.dispatchEvent('pointerup', { pointerId: 8, isPrimary: true });
  await page.locator('[data-cfg="save"]').dispatchEvent('pointerdown', {
    pointerId: 8,
    isPrimary: true,
  });
  await expect(page.locator('.cfg-bar')).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem('sp-key-layout'));
  expect(stored).not.toBeNull();
  const layout = JSON.parse(stored ?? '{}') as { version: number; b: { cx: number } };
  expect(layout.version).toBe(1);
  expect(layout.b.cx).toBeLessThan(0.9);
  // 重載後布局持久化套用至按鍵 style（瀏覽器會去掉百分比尾零，取數值比較）。
  await page.reload();
  await expect(page.locator('#app canvas')).toBeVisible();
  const leftPct = await keyB.evaluate((el) => parseFloat((el as HTMLElement).style.left));
  expect(leftPct).toBeCloseTo(layout.b.cx * 100, 1);
  // 恢復預設：再入配置模式按重置，儲存後 localStorage 回預設值。
  await page.locator('[data-menu="config"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await page.locator('[data-cfg="reset"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect
    .poll(() => keyB.evaluate((el) => parseFloat((el as HTMLElement).style.left)))
    .toBe(92);
  await page.locator('[data-cfg="save"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
