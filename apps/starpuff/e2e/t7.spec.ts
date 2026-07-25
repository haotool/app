import { expect, test, type Page } from '@playwright/test';

// T7-A 運行時收斂守門（#819 卡 4/7/8）：PWA 更新時機閘、存檔備援恢復、統一設定頁。

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      win: () => void;
      hurtPlayer: (damage: number) => void;
      playerHp: () => number;
      cameraFx: () => { shakeRunning: boolean; flashRunning: boolean; flashDuration: number };
      save: () => {
        schemaVersion: number;
        highestClearedLevel: number;
        levels: Record<string, { cleared: boolean; bestTimeMs: number; eggsFound: string[] }>;
      };
    };
    __spQueuePwaUpdate?: (apply: () => void) => void;
    __spPwaApplied?: boolean;
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

async function clickCanvas(page: Page, ratioX: number, ratioY: number): Promise<void> {
  const box = await page.locator('#app canvas').boundingBox();
  if (!box) throw new Error('canvas 不存在');
  await page.mouse.click(box.x + box.width * ratioX, box.y + box.height * ratioY);
}

async function gotoTitle(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
}

async function startGame(page: Page): Promise<void> {
  await gotoTitle(page);
  // 開始按鈕位於畫布 66% 高度（TitleScene 佈局）。
  await clickCanvas(page, 0.5, 0.66);
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
}

test('PWA 更新時機閘（卡 8）：遊戲中只標記 pending 絕不套用，Result 場景才自動套用', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await startGame(page);
  // 遊戲中注入待套用更新（假 apply 記錄旗標，走正式 queue 管線）。
  await page.evaluate(() => {
    window.__spPwaApplied = false;
    window.__spQueuePwaUpdate?.(() => {
      window.__spPwaApplied = true;
    });
  });
  // 超過重試間隔（5s）仍不得套用：遊戲進行中為硬禁區。
  await page.waitForTimeout(6500);
  expect(await page.evaluate(() => window.__spPwaApplied)).toBe(false);
  expect(await page.evaluate(() => window.__sp.scene())).toBe('Game');
  // 過關進 Result：controls 邊界觀察者應在安全場景自動套用。
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 20_000 })
    .toBe('Result');
  await expect
    .poll(() => page.evaluate(() => window.__spPwaApplied), { timeout: 10_000 })
    .toBe(true);
  expect(errors).toEqual([]);
});

test('PWA 更新時機閘（卡 8）：Title 殼層安靜時 queue 即套用', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  // 殼卡（安裝指引/方向告知）開啟即殼層忙碌（正確延後）；先收卡驗證安靜路徑。
  await page.evaluate(() => {
    document.querySelectorAll('.install-overlay').forEach((el) => el.remove());
    window.__spPwaApplied = false;
    window.__spQueuePwaUpdate?.(() => {
      window.__spPwaApplied = true;
    });
  });
  await expect
    .poll(() => page.evaluate(() => window.__spPwaApplied), { timeout: 10_000 })
    .toBe(true);
  expect(errors).toEqual([]);
});

test('存檔備援（卡 7）：legacy 存檔落盤觸發輪替，主檔損毀重載後自備援恢復進度不歸零', async ({
  page,
}) => {
  test.setTimeout(90_000);
  // 種入 v1 legacy 存檔（無 checksum、L1-L4 通關、無 achievements 欄位）：
  // 開機成就補發會走正式 persistSave，把 legacy 主檔輪替入 sp-save-backup。
  await page.addInitScript(() => {
    const entry = { cleared: true, bestTimeMs: 45000, eggsFound: [] };
    localStorage.setItem(
      'sp-save',
      JSON.stringify({
        schemaVersion: 1,
        highestClearedLevel: 4,
        levels: { 1: entry, 2: entry, 3: entry, 4: entry },
        lastPlayedAt: 1700000000000,
      }),
    );
  });
  await gotoTitle(page);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('sp-save-backup') !== null))
    .toBe(true);
  // 輪替後主檔已升 v2 並附 checksum。
  const mainRaw = await page.evaluate(() => localStorage.getItem('sp-save'));
  expect(JSON.parse(mainRaw ?? '{}')).toMatchObject({
    schemaVersion: 2,
    checksum: expect.any(String),
  });
  // 主檔寫壞（模擬截斷損毀）後重載：loadSave 應從備援恢復，L1-L4 進度仍在。
  await page.evaluate(() => localStorage.setItem('sp-save', '{corrupted'));
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  expect(await page.evaluate(() => window.__sp.save().levels['4']?.cleared ?? false)).toBe(true);
  expect(await page.evaluate(() => window.__sp.save().highestClearedLevel)).toBe(4);
});

test('統一設定頁（卡 4）：Title 入口開啟、全偏好切換即存並跨重載持久', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="settings"]').click();
  await expect(page.locator('.settings-card')).toBeVisible();
  // 逐一切換：音效關、震動關、常亮關、減少動態開、震屏弱。
  await page.locator('[data-setting="audioMuted"]').click();
  await page.locator('[data-setting="hapticsEnabled"]').click();
  await page.locator('[data-setting="wakeLockEnabled"]').click();
  await page.locator('[data-setting="reducedMotion"]').click();
  await page.locator('[data-shake="low"]').click();
  const stored = JSON.parse(
    await page.evaluate(() => localStorage.getItem('sp-settings') ?? '{}'),
  ) as Record<string, unknown>;
  expect(stored).toMatchObject({
    audioMuted: true,
    hapticsEnabled: false,
    wakeLockEnabled: false,
    reducedMotion: true,
    screenShake: 'low',
  });
  // 音效開關與 HUD 靜音鈕同步（aria-pressed）。
  expect(await page.locator('[data-menu="mute"]').getAttribute('aria-pressed')).toBe('true');
  await page.locator('[data-setting="close"]').click();
  await expect(page.locator('.settings-card')).toHaveCount(0);
  // 跨重載持久：開機還原靜音偏好。
  await gotoTitle(page);
  expect(await page.locator('[data-menu="mute"]').getAttribute('aria-pressed')).toBe('true');
  expect(errors).toEqual([]);
});

test('設定 migration（卡 4）：legacy 散鍵一次性吸收入 sp-settings 且不刪除', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sp-muted', '1');
    localStorage.setItem('sp-rotation', 'cw');
  });
  await gotoTitle(page);
  const stored = JSON.parse(
    await page.evaluate(() => localStorage.getItem('sp-settings') ?? '{}'),
  ) as Record<string, unknown>;
  expect(stored).toMatchObject({ schemaVersion: 1, audioMuted: true, shellRotation: 'cw' });
  expect(await page.evaluate(() => localStorage.getItem('sp-muted'))).toBe('1');
  expect(await page.locator('[data-menu="mute"]').getAttribute('aria-pressed')).toBe('true');
});

// 受擊觸發 fx 震屏（PLAYER_DAMAGED → shake(4)）後取樣主相機震動狀態。
async function hurtAndSampleShake(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    window.__sp.hurtPlayer(1);
    let seen = false;
    for (let i = 0; i < 30; i++) {
      if (window.__sp.cameraFx().shakeRunning) seen = true;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return seen;
  });
}

test('震屏強度閘（卡 12）：預設受擊會震屏，reducedMotion 下完全不震', async ({ page }) => {
  test.setTimeout(90_000);
  // 預設（full）：受擊應觀測到震屏。
  await startGame(page);
  expect(await hurtAndSampleShake(page)).toBe(true);
  // reducedMotion 開啟後重載：同一受擊管線完全不震屏。
  await page.evaluate(() => {
    const raw = localStorage.getItem('sp-settings');
    const settings = raw !== null ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(
      'sp-settings',
      JSON.stringify({ ...settings, schemaVersion: 1, reducedMotion: true }),
    );
  });
  await startGame(page);
  expect(await hurtAndSampleShake(page)).toBe(false);
});
