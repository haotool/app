import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      gotoLevel: (levelId: number, ex?: boolean) => void;
      bossHint: () => string;
      bossHp: () => number;
      probe: () => { x: number; scrollX: number };
      view: () => { width: number; height: number };
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
}

// #809：魔王前室反制提示卡——首遇顯示、入 arena 記憶、再訪不重複打擾。
test('#809 前室反制提示：L4 首遇顯示拍翅越王教學、入 arena 後記憶不再顯示', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.gotoLevel(4));
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);

  // 前室（未入 arena）顯示提示浮字。
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHint()), { timeout: 5000 })
    .toContain('拍翅');

  // 走進 arena：提示收字並寫記憶。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 })
    .toBeGreaterThan(0);
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.bossHint())).toBe('');
  expect(await page.evaluate(() => localStorage.getItem('sp-boss-jump-hint'))).toBe('1');

  // 重進魔王關：已記憶不再顯示。
  await page.evaluate(() => window.__sp.gotoLevel(7));
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(7);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__sp.bossHint())).toBe('');
  expect(errors).toEqual([]);
});

// #817（桌機情境於 Desktop Chrome project 執行）：方向恆正、虛擬鍵隱藏、
// 鍵位卡一次性、Title 常駐操作說明入口。
test.describe('#817 桌機正置', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < 1024,
    '桌機情境需寬視口 project（Desktop Chrome）',
  );

  test('桌機：殼不旋轉、虛擬鍵隱藏、首次鍵位卡顯示且記憶、Title 有操作說明入口', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('#app canvas')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

    // 桌機 class 掛載＋殼 transform 恆正（無旋轉矩陣）。
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('sp-desktop')),
    ).toBe(true);
    const transform = await page.evaluate(
      () => getComputedStyle(document.getElementById('game-shell')!).transform,
    );
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);

    // 首次鍵位卡（殼層安靜時刻）顯示並記憶。
    const card = page.locator('.install-card', { hasText: '鍵盤操作' });
    await expect(card).toBeVisible({ timeout: 10000 });
    await card
      .locator('button', { hasText: '知道了' })
      .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
    await expect(card).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sp-desktop-keys'))).toBe('1');

    // Title 常駐「操作說明」入口可重看。
    const keysEntry = page.locator('[data-menu="keys"]');
    await expect(keysEntry).toHaveCount(1);
    await keysEntry.dispatchEvent('pointerdown', { pointerId: 6, isPrimary: true });
    await expect(page.locator('.install-card', { hasText: '鍵盤操作' })).toBeVisible();
    await page
      .locator('.install-card button', { hasText: '知道了' })
      .dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true });

    // 進遊戲：虛擬鍵隱藏、鍵盤可操作。
    await page
      .locator('[data-menu="start"]')
      .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await expect(page.locator('#controls')).toBeHidden();
    const before = await page.evaluate(() => window.__sp.probe());
    await page.keyboard.down('ArrowRight');
    await expect
      .poll(async () => (await page.evaluate(() => window.__sp.probe())).x - before.x, {
        timeout: 5000,
      })
      .toBeGreaterThan(50);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });

  test('桌機再訪：鍵位卡已記憶不重複打擾', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('sp-desktop-keys', '1'));
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
    await page.waitForTimeout(4000);
    await expect(page.locator('.install-card', { hasText: '鍵盤操作' })).toHaveCount(0);
  });
});

// #839 觸控筆電（細指標＋觸點>0＋寬視口）雙模並存：不進桌機模式（旋轉殼語意
// 與虛擬鍵照舊，觸控遊玩不回退），補鍵盤引導——首次鍵位卡＋Title 操作說明入口。
// 模擬方式：Playwright hasTouch 會把主指標翻成 coarse（真實觸控筆電主指標恆 fine），
// 故以 maxTouchPoints stub 做契約級模擬——判定器讀的正是 pointer media＋觸點數。
test.describe('#839 觸控筆電雙模並存', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < 1024,
    '觸控筆電情境需寬視口 project（Desktop Chrome）',
  );

  test('觸控筆電：不掛 sp-desktop、虛擬鍵保留、鍵位卡與操作說明入口補齊', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem('sp-install-dismissed', '1');
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
    });
    await page.goto('/');
    await expect(page.locator('#app canvas')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

    // 混合裝置條件成立（fine pointer＋觸點>0）；桌機 class 不得掛載（觸控能力保留）。
    expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('sp-desktop')),
    ).toBe(false);

    // 首次鍵位卡顯示並記憶（與桌機共用 sp-desktop-keys 記憶）。
    const card = page.locator('.install-card', { hasText: '鍵盤操作' });
    await expect(card).toBeVisible({ timeout: 10000 });
    await card
      .locator('button', { hasText: '知道了' })
      .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
    await expect(card).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sp-desktop-keys'))).toBe('1');

    // Title 常駐操作說明入口。
    await expect(page.locator('[data-menu="keys"]')).toHaveCount(1);

    // 進遊戲：虛擬鍵保留（雙模不回退觸控操作面）。
    await page
      .locator('[data-menu="start"]')
      .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await expect(page.locator('#controls')).toBeVisible();
    await page.waitForTimeout(400);
    expect(errors).toEqual([]);
  });
});

// #817（直持情境於 Portrait project 執行）：未解鎖方向提示一次性；橫持不誤觸。
test.describe('#817 直持方向解鎖引導', () => {
  test.skip(
    ({ viewport }) => (viewport?.height ?? 0) <= (viewport?.width ?? 0),
    '直持情境需 portrait project',
  );

  test('直持：一次性方向解鎖提示卡、記憶後不重複', async ({ page }) => {
    const errors = collectErrors(page);
    // 隔離其他卡片：旋轉告知與安裝指引先記憶（同殼層卡片管線會排隊搶佔安靜時刻）。
    await page.addInitScript(() => {
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem('sp-install-dismissed', '1');
    });
    await page.goto('/');
    await expect(page.locator('#app canvas')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

    // 直持非桌機：sp-desktop 不得掛載（觸控裝置維持旋轉殼語意）。
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('sp-desktop')),
    ).toBe(false);

    const card = page.locator('.install-card', { hasText: '橫持遊玩體驗更佳' });
    await expect(card).toBeVisible({ timeout: 10000 });
    await card
      .locator('button', { hasText: '知道了' })
      .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
    await expect(card).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sp-orientation-hint'))).toBe('1');

    // 再訪不重複。
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
    await page.waitForTimeout(4000);
    await expect(page.locator('.install-card', { hasText: '橫持遊玩體驗更佳' })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

// #817 橫持（行動裝置 landscape）：方向提示與鍵位卡皆不得誤觸。
test('#817 橫持：無方向解鎖提示、無桌機鍵位卡（互不誤觸）', async ({ page, viewport }) => {
  test.skip(
    (viewport?.height ?? 0) >= (viewport?.width ?? 0) || (viewport?.width ?? 0) >= 1024,
    '橫持情境需行動 landscape project',
  );
  await page.addInitScript(() => {
    localStorage.setItem('sp-rotation-notice', '1');
    localStorage.setItem('sp-install-dismissed', '1');
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  expect(await page.evaluate(() => document.documentElement.classList.contains('sp-desktop'))).toBe(
    false,
  );
  await page.waitForTimeout(4000);
  await expect(page.locator('.install-card')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sp-orientation-hint'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sp-desktop-keys'))).toBeNull();
});
