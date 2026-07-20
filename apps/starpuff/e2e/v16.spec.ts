import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      win: () => void;
      gotoLevel: (levelId: number, ex?: boolean) => void;
      paused: () => boolean;
      scenePaused: () => boolean;
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

// v16 D3：勝利結算主 CTA「下一關」——魔王關擊破後零折返接續下一區首關。
test('勝利結算下一關（D3）：L4 擊破後主 CTA 直入 L5，世界地圖降次選', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.gotoLevel(4));
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 15000 }).toBe(4);
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');

  // 雙鈕並存：主 CTA 下一關＋次選世界地圖。
  await expect(page.locator('[data-menu="next-level"]')).toHaveCount(1);
  await expect(page.locator('[data-menu="map"]')).toHaveCount(1);
  await page
    .locator('[data-menu="next-level"]')
    .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(5);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});
