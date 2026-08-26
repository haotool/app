import { expect, test, type Page } from '@playwright/test';

import { dismissControlHints } from './testHelpers';

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

async function gotoTitle(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
}

async function startGame(page: Page): Promise<void> {
  await gotoTitle(page);
  // 開始鈕的唯一指標命中 SSOT 是透明 DOM data-menu 命中盒；以真實瀏覽器點擊
  // 避免 canvas 比例在 resize／低幀時序下落到視覺文字而漏觸發。
  await page.locator('[data-menu="start"]').click();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await dismissControlHints(page);
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
  // 過關進 Result：controls 邊界觀察者在安全場景啟動寬限；進場瞬間不得立即 reload
  //（審查 Should-fix：防吃掉下一關 CTA 點擊），寬限期滿才套用。
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 20_000 })
    .toBe('Result');
  expect(await page.evaluate(() => window.__spPwaApplied)).toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.__spPwaApplied), { timeout: 10_000 })
    .toBe(true);
  expect(errors).toEqual([]);
});

test('Result CTA 競態（審查 Should-fix）：寬限期內點下一關進遊戲不被 reload 吃掉', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => {
    window.__spPwaApplied = false;
    window.__spQueuePwaUpdate?.(() => {
      window.__spPwaApplied = true;
    });
  });
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 20_000 })
    .toBe('Result');
  // 寬限期內立即點下一關 CTA：點擊必須生效（進入 Game），本次套用被放棄。
  await page.locator('[data-menu="next-level"]').dispatchEvent('pointerdown', {
    pointerId: 3,
    isPrimary: true,
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 15_000 })
    .toBe('Game');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__spPwaApplied)).toBe(false);
  // 再次過關回安全場景：寬限期滿照常套用。
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 20_000 })
    .toBe('Result');
  await expect
    .poll(() => page.evaluate(() => window.__spPwaApplied), { timeout: 10_000 })
    .toBe(true);
  expect(errors).toEqual([]);
});

test('PWA 更新時機閘（卡 8）：Title 殼層安靜時 queue 經寬限期自動套用', async ({ page }) => {
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
  // 寬限期（1.5s）內不套用（防吃掉點擊），期滿自動套用。
  expect(await page.evaluate(() => window.__spPwaApplied)).toBe(false);
  // 殼卡佇列（安裝指引→方向告知）1s 輪詢會再顯卡佔用殼層（開卡期間正確延後）：
  // 輪詢中持續收卡，驗證安靜窗一到即套用。
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          document.querySelectorAll('.install-overlay').forEach((el) => el.remove());
          return window.__spPwaApplied;
        }),
      { timeout: 15_000 },
    )
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

test('設定頁鍵盤可操作（審查 Blocking）：Enter/Space 純鍵盤切換各類偏好', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="settings"]').click();
  await expect(page.locator('.settings-card')).toBeVisible();
  const readSettings = async (): Promise<Record<string, unknown>> =>
    JSON.parse(await page.evaluate(() => localStorage.getItem('sp-settings') ?? '{}')) as Record<
      string,
      unknown
    >;
  // Enter 切換布林偏好（音效 → 靜音 true）。
  await page.locator('[data-setting="audioMuted"]').focus();
  await page.keyboard.press('Enter');
  expect((await readSettings())['audioMuted']).toBe(true);
  // Space 切換另一布林偏好（震動回饋 → false）。
  await page.locator('[data-setting="hapticsEnabled"]').focus();
  await page.keyboard.press('Space');
  expect((await readSettings())['hapticsEnabled']).toBe(false);
  // Enter 選震屏分段（弱）。
  await page.locator('[data-shake="low"]').focus();
  await page.keyboard.press('Enter');
  expect((await readSettings())['screenShake']).toBe('low');
  // Enter 觸發完成鈕收頁。
  await page.locator('[data-setting="close"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.settings-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});

// #870：overlay 宣告 role="dialog" + aria-modal="true"，就必須真的鎖住焦點。
// 修復前開啟後焦點仍留在底層 Title 按鈕，Shift+Tab 可回到「圖鑑／地圖」等鈕並啟用，
// 造成模態視窗還開著就切換場景。
test('設定頁焦點鎖定（#870）：焦點入框、Tab 循環不外漏、關閉還原至觸發鈕', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  // 以 click 開啟：Chromium 原生行為會讓 button 同時取得焦點，故觸發鈕仍是還原目標。
  // 不用「focus + Enter」是因為 TitleScene 綁了場景級 `keydown-ENTER`→開始遊戲，
  // 會搶在 DOM 按鈕的鍵盤啟用之前把場景切走——那是獨立於本 issue 的可及性缺陷，
  // 不在此處順手改動 Title 的輸入語意（見 follow-up issue）。
  await page.locator('[data-menu="settings"]').click();
  await expect(page.locator('.settings-card')).toBeVisible();

  const activeIsInsideCard = () =>
    page.evaluate(() => {
      const card = document.querySelector('.settings-card');
      return (
        card !== null && document.activeElement !== null && card.contains(document.activeElement)
      );
    });

  // 驗收 1：焦點落在對話框內第一個可聚焦控制項。
  expect(await activeIsInsideCard()).toBe(true);

  // 驗收 2：Shift+Tab 於首項不外漏——這正是本 issue 的缺陷路徑。
  await page.keyboard.press('Shift+Tab');
  expect(await activeIsInsideCard()).toBe(true);
  // 正向繞行一整圈也不得跑到底層（多繞兩次確保跨過邊界）。
  const focusableCount = await page.evaluate(
    () =>
      document.querySelectorAll(
        '.settings-card button, .settings-card [tabindex]:not([tabindex="-1"])',
      ).length,
  );
  for (let i = 0; i < focusableCount + 2; i += 1) {
    await page.keyboard.press('Tab');
    expect(await activeIsInsideCard()).toBe(true);
  }

  // 驗收 3：關閉後焦點還原至觸發按鈕。
  await page.locator('[data-setting="close"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.settings-card')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-menu') ?? null)).toBe(
    'settings',
  );
  expect(errors).toEqual([]);
});

test('設定頁指標路徑（審查 Blocking）：完整指標事件鏈不雙觸發', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="settings"]').click();
  await expect(page.locator('.settings-card')).toBeVisible();
  // 真實 click（pointerdown→pointerup→click 全鏈）：布林偏好恰翻轉一次。
  await page.locator('[data-setting="audioMuted"]').click();
  const stored = JSON.parse(
    await page.evaluate(() => localStorage.getItem('sp-settings') ?? '{}'),
  ) as Record<string, unknown>;
  expect(stored['audioMuted']).toBe(true);
  await expect(page.locator('[data-setting="audioMuted"]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(errors).toEqual([]);
});

test('按鈕配置鍵盤可操作（審查補筆）：設定頁轉入後純鍵盤觸發縮放與取消', async ({ page }) => {
  const errors = collectErrors(page);
  await gotoTitle(page);
  await page.locator('[data-menu="settings"]').click();
  await expect(page.locator('.settings-card')).toBeVisible();
  await page.locator('[data-setting="key-config"]').click();
  await expect(page.locator('.cfg-bar')).toBeVisible();
  // 純鍵盤路徑（原生 button 可 Tab 聚焦）：聚焦後 Enter 觸發 click activation。
  const scaleValue = page.locator('[data-cfg="scale-value"]');
  await expect(scaleValue).toHaveText('100%');
  await page.locator('[data-cfg="scale-up"]').focus();
  await page.keyboard.press('Enter');
  await expect(scaleValue).toHaveText('105%');
  // 取消鈕鍵盤觸發收頁（不落盤）。
  await page.locator('[data-cfg="cancel"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cfg-bar')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('設定 migration（卡 4）：legacy 散鍵一次性吸收入 sp-settings 並刪除（單真相）', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.removeItem('sp-settings');
    localStorage.setItem('sp-muted', '1');
    localStorage.setItem('sp-rotation', 'cw');
  });
  await gotoTitle(page);
  const stored = JSON.parse(
    await page.evaluate(() => localStorage.getItem('sp-settings') ?? '{}'),
  ) as Record<string, unknown>;
  expect(stored).toMatchObject({ schemaVersion: 2, audioMuted: true, shellRotation: 'cw' });
  // 單真相（審查 Should-fix）：升版落盤成功即刪 legacy，避免主鍵遺失時吸回過期偏好。
  expect(await page.evaluate(() => localStorage.getItem('sp-muted'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sp-rotation'))).toBeNull();
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
