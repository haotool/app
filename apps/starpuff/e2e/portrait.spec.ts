import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      fillQuota: () => void;
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

// 直持旋轉殼（US-028 / §28）：390×844 viewport 不轉橫直接進遊戲並可操作。
test('直持 390×844：旋轉殼進場、搖桿與按鍵可操作、走星星門進第二關', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

  // 響應寬幅：844/390 比例 → 邏輯寬 clamp(round(2.164×480)) = 1039、高 480。
  expect(await page.evaluate(() => window.__sp.view())).toEqual({ width: 1039, height: 480 });

  // 旋轉殼下 canvas 指標錯位，開始遊戲走 DOM 備援鈕（pointerdown；殼層攔 touchstart 無 click）。
  // v5 主選單有四顆 DOM 鈕，以 data-menu 指定開始鍵。
  const startButton = page.locator('[data-menu="start"]');
  await expect(startButton).toHaveCount(1);
  await startButton.dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);

  // 搖桿重映射（§90 ccw 新預設）：portrait 裝置座標「往上」對應遊戲「往右」；
  // 位移以殼局部空間計算。
  const joyZone = page.locator('#joy-zone');
  const before = await page.evaluate(() => window.__sp.probe());
  await joyZone.dispatchEvent('pointerdown', {
    pointerId: 3,
    isPrimary: true,
    clientX: 150,
    clientY: 330,
  });
  await joyZone.dispatchEvent('pointermove', {
    pointerId: 3,
    isPrimary: true,
    clientX: 150,
    clientY: 250,
  });
  await expect
    .poll(async () => (await page.evaluate(() => window.__sp.probe())).x - before.x, {
      timeout: 5000,
    })
    .toBeGreaterThan(50);
  await joyZone.dispatchEvent('pointerup', { pointerId: 3, isPrimary: true });

  // A 鍵按壓態（is-pressed）於旋轉殼內 hit-test 正確。
  const jumpButton = page.locator('[data-btn="a"]');
  await jumpButton.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true });
  await expect(jumpButton).toHaveClass(/is-pressed/);
  await jumpButton.dispatchEvent('pointerup', { pointerId: 7, isPrimary: true });
  await expect(jumpButton).not.toHaveClass(/is-pressed/);

  // 直持完整過關路徑（§39 hub 流）：補配額後鍵盤右行走入星星門，進世界地圖再入第二關。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 45000 }).toBe('Map');
  await page.keyboard.up('ArrowRight');
  await page.locator('[data-menu="node-2"]').dispatchEvent('pointerdown', {
    pointerId: 6,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(2);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

// 舊方向偏好（§90）：sp-rotation=cw 時殼轉 90deg，裝置「往下滑」對應遊戲「往右」。
test('直持 390×844（sp-rotation=cw 舊方向）：殼與搖桿語意跟隨偏好', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => localStorage.setItem('sp-rotation', 'cw'));
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

  // 殼 transform 為 rotate(90deg) 矩陣（matrix(0, 1, -1, 0, …)）。
  const transform = await page.evaluate(
    () => getComputedStyle(document.getElementById('game-shell')!).transform,
  );
  expect(transform.startsWith('matrix(0, 1, -1, 0')).toBe(true);

  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');

  const joyZone = page.locator('#joy-zone');
  const before = await page.evaluate(() => window.__sp.probe());
  await joyZone.dispatchEvent('pointerdown', {
    pointerId: 3,
    isPrimary: true,
    clientX: 150,
    clientY: 250,
  });
  await joyZone.dispatchEvent('pointermove', {
    pointerId: 3,
    isPrimary: true,
    clientX: 150,
    clientY: 330,
  });
  await expect
    .poll(async () => (await page.evaluate(() => window.__sp.probe())).x - before.x, {
      timeout: 5000,
    })
    .toBeGreaterThan(50);
  await joyZone.dispatchEvent('pointerup', { pointerId: 3, isPrimary: true });
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
