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
      quota: () => { killCount: number; killQuota: number };
      probe: () => { x: number; scrollX: number };
      spawn: (kind: string, x?: number, y?: number) => void;
      grantStar: (flavor: string) => void;
      hurtPlayer: (damage: number) => void;
      playerHp: () => number;
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

// v16 F-06/D4：HUD 暫停/靜音 DOM 化——自動化與讀屏可及，canvas 圖示保留純視覺。
test('HUD 暫停/靜音 DOM 鈕（F-06）：局內可點暫停並繼續、靜音狀態可切換', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);

  // 暫停 DOM 鈕：開啟暫停選單（場景真凍結），繼續後恢復。
  const pauseButton = page.locator('[data-menu="pause"]');
  await expect(pauseButton).toHaveCount(1);
  await pauseButton.dispatchEvent('pointerdown', { pointerId: 6, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.paused())).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__sp.scenePaused())).toBe(true);
  await page
    .locator('[data-pause="resume"]')
    .dispatchEvent('pointerdown', { pointerId: 6, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.paused())).toBe(false);

  // 靜音 DOM 鈕：aria-pressed 與 sp-muted 同步翻轉，再點還原。
  const muteButton = page.locator('#game-shell [data-menu="mute"]');
  await expect(muteButton).toHaveAttribute('aria-pressed', 'false');
  await muteButton.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true });
  await expect(muteButton).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('sp-muted'))).toBe('1');
  await muteButton.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true });
  await expect(muteButton).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

// v16 D5：教學關（L1）死亡重試保留一半擊殺配額——真實戰鬥管線擊殺 4 隻後死亡，
// 重生配額應顯示 2/6（非教學關與卡點關不受影響）。
test('教學關配額結轉（D5）：L1 擊殺 4 隻後死亡，重試保留 2/6', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await startGame(page);

  // 受控擊殺 ×4：玩家前方生成果凍丁、賦標準星、點按發射（正式擊殺管線計配額）。
  for (let target = 1; target <= 4; target += 1) {
    let attempts = 0;
    while (attempts < 6) {
      attempts += 1;
      await page.evaluate(() => {
        const x = window.__sp.probe().x;
        window.__sp.spawn('jelly', x + 130, 330);
        window.__sp.grantStar('jelly');
      });
      await page.waitForTimeout(250);
      await page.keyboard.down('X');
      await page.waitForTimeout(80);
      await page.keyboard.up('X');
      try {
        await expect
          .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 2500 })
          .toBeGreaterThanOrEqual(target);
        break;
      } catch {
        /* 星彈落空（果凍彈跳）：重生一隻再試。 */
      }
    }
    expect(await page.evaluate(() => window.__sp.quota().killCount)).toBeGreaterThanOrEqual(target);
  }
  const kills = await page.evaluate(() => window.__sp.quota().killCount);

  // 死亡 → 重試：配額保留 floor(kills/2)。
  await page.evaluate(() => window.__sp.hurtPlayer(99));
  await expect
    .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 10000 })
    .toBe(Math.floor(kills / 2));
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

// v16 F-03：怪物圖鑑分頁——每頁 12 格 6×2，翻頁鈕雙向可達。
test('圖鑑怪物分頁（F-03）：預設第 1 頁僅下一頁，翻至第 2 頁可返回', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page
    .locator('[data-menu="codex"]')
    .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Codex');

  // 第 1 頁：無上一頁、有下一頁。
  await expect(page.locator('[data-menu="monsters-prev"]')).toHaveCount(0);
  await expect(page.locator('[data-menu="monsters-next"]')).toHaveCount(1);
  await page
    .locator('[data-menu="monsters-next"]')
    .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
  // 第 2 頁（末頁）：有上一頁、無下一頁；返回第 1 頁。
  await expect(page.locator('[data-menu="monsters-prev"]')).toHaveCount(1);
  await expect(page.locator('[data-menu="monsters-next"]')).toHaveCount(0);
  await page
    .locator('[data-menu="monsters-prev"]')
    .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
  await expect(page.locator('[data-menu="monsters-next"]')).toHaveCount(1);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
