import { expect, test, type Page } from '@playwright/test';

// T7-A 運行時收斂守門（#819 卡 4/7/8）：PWA 更新時機閘、存檔備援恢復、統一設定頁。

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      win: () => void;
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
  const applied = await page.evaluate(() => {
    let flag = false;
    window.__spQueuePwaUpdate?.(() => {
      flag = true;
    });
    return flag;
  });
  expect(applied).toBe(true);
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
