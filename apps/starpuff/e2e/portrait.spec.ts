import { expect, test, type Page } from '@playwright/test';

import { dismissControlHints } from './testHelpers';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      playerHp: () => number;
      fillQuota: () => void;
      probe: () => { x: number; scrollX: number };
      view: () => { width: number; height: number };
      walk: () => { rotation: number; bob: number; vy: number };
      paused: () => boolean;
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
  await dismissControlHints(page);

  // 搖桿重映射（§87 ccw 新預設）：portrait 裝置座標「往上」對應遊戲「往右」；
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

// 舊方向偏好（§87）：sp-rotation=cw 時殼轉 90deg，裝置「往下滑」對應遊戲「往右」。
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
  await dismissControlHints(page);

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

  // D1 cw 向預設鍵位：A/B 中心同樣落於裝置右下拇指帶（雙向皆人體工學正確）。
  const cwBoxA = await page.locator('[data-btn="a"]').boundingBox();
  const cwBoxB = await page.locator('[data-btn="b"]').boundingBox();
  if (!cwBoxA || !cwBoxB) throw new Error('虛擬鍵不存在');
  expect((cwBoxA.x + cwBoxA.width / 2) / 390).toBeGreaterThanOrEqual(0.72);
  expect((cwBoxA.y + cwBoxA.height / 2) / 844).toBeGreaterThanOrEqual(0.78);
  expect((cwBoxB.x + cwBoxB.width / 2) / 390).toBeGreaterThanOrEqual(0.65);
  expect((cwBoxB.y + cwBoxB.height / 2) / 844).toBeLessThan((cwBoxA.y + cwBoxA.height / 2) / 844);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

// v16 D1：直持（ccw 新預設）預設鍵位必須落在裝置螢幕右下拇指帶，且「真手勢」
// （CDP 觸控經瀏覽器 hit-test，非元素直派）在右下區點按 A 能觸發跳躍。
test('直持 390×844（D1/D2）：預設 A/B 在右下拇指帶、真觸控點 A 能跳、選單命中 ≥48', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

  // D2：直持縮放下主/次選單 DOM 鈕命中短邊 ≥48（§98 保底；AABB 短邊即觸控短邊）。
  for (const menuId of ['start', 'map', 'codex', 'skills', 'settings']) {
    const box = await page.locator(`[data-menu="${menuId}"]`).boundingBox();
    if (!box) throw new Error(`選單鈕 ${menuId} 不存在`);
    expect(Math.min(box.width, box.height), menuId).toBeGreaterThanOrEqual(48);
  }

  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await dismissControlHints(page);

  // 幾何斷言：A 中心於裝置比例（fx ≥ 0.72、fy 0.78–0.95）、B 於其上方拇指弧帶。
  const boxA = await page.locator('[data-btn="a"]').boundingBox();
  const boxB = await page.locator('[data-btn="b"]').boundingBox();
  if (!boxA || !boxB) throw new Error('虛擬鍵不存在');
  const centerA = { x: boxA.x + boxA.width / 2, y: boxA.y + boxA.height / 2 };
  const centerB = { x: boxB.x + boxB.width / 2, y: boxB.y + boxB.height / 2 };
  expect(centerA.x / 390).toBeGreaterThanOrEqual(0.72);
  expect(centerA.y / 844).toBeGreaterThanOrEqual(0.78);
  expect(centerA.y / 844).toBeLessThanOrEqual(0.95);
  expect(centerB.x / 390).toBeGreaterThanOrEqual(0.65);
  expect(centerB.y / 844).toBeGreaterThanOrEqual(0.6);
  expect(centerB.y / 844).toBeLessThanOrEqual(0.78);

  // 真手勢：CDP dispatchTouchEvent 走瀏覽器輸入管線（含 hit-test 與 pointer 轉換），
  // 於 A 中心按住——按鍵進入按壓態且角色起跳（vy < 0）。
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: centerA.x, y: centerA.y }],
  });
  await expect(page.locator('[data-btn="a"]')).toHaveClass(/is-pressed/);
  await expect
    .poll(() => page.evaluate(() => window.__sp.walk().vy), { timeout: 3000 })
    .toBeLessThan(-50);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('[data-btn="a"]')).not.toHaveClass(/is-pressed/);

  // 真手勢：B 中心按住觸發吸入姿態（is-pressed），釋放還原。
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: centerB.x, y: centerB.y }],
  });
  await expect(page.locator('[data-btn="b"]')).toHaveClass(/is-pressed/);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('[data-btn="b"]')).not.toHaveClass(/is-pressed/);

  // F-06：直持下 HUD 暫停/靜音 DOM 鈕可及且命中短邊 ≥48，真觸控點暫停即凍結。
  for (const menuId of ['pause', 'mute']) {
    const box = await page.locator(`[data-menu="${menuId}"]`).boundingBox();
    if (!box) throw new Error(`HUD 鈕 ${menuId} 不存在`);
    expect(Math.min(box.width, box.height), menuId).toBeGreaterThanOrEqual(48);
  }
  const pauseBox = await page.locator('[data-menu="pause"]').boundingBox();
  if (!pauseBox) throw new Error('暫停鈕不存在');
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: pauseBox.x + pauseBox.width / 2, y: pauseBox.y + pauseBox.height / 2 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.__sp.paused())).toBe(true);
  await page
    .locator('[data-pause="resume"]')
    .dispatchEvent('pointerdown', { pointerId: 8, isPrimary: true });
  await expect.poll(() => page.evaluate(() => window.__sp.paused())).toBe(false);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});

// L30-UX：設定與按鈕配置是 viewport-level modal，不能被直持旋轉殼改變 layout 軸；
// 短視窗則必須保留可操作的垂直 scroll container，避免完成/取消鈕落出畫面。
test('直持設定：面板完整可見、短視窗可垂直滾動、按鈕配置不被旋轉殼擠出', async ({ page }) => {
  const errors = collectErrors(page);
  // 殼層卡片抑制：本案驗設定面板版面，與 PWA／方向提示卡無關。卡片由
  // whenShellIdle 於 Title 安靜時刻浮現，CI 慢機時會趕在點擊前蓋住設定鈕。
  // 本案是全檔唯一用 .click()（做 actionability 檢查）者，因此只有它被攔截逾時；
  // 其餘案走 dispatchEvent 繞過檢查故未曝光。沿 modal-landscape.spec 既有慣例。
  await page.addInitScript(() => {
    localStorage.setItem('sp-install-dismissed', '1');
    localStorage.setItem('sp-orientation-landscape-seen', '1');
    localStorage.setItem('sp-rotation-notice', '1');
  });
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');

  await page.locator('[data-menu="settings"]').click();
  const settingsCard = page.locator('.settings-card');
  await expect(settingsCard).toBeVisible();
  const fullMetrics = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('.settings-card');
    const overlay = document.querySelector<HTMLElement>('.settings-overlay');
    if (!card || !overlay) throw new Error('設定模態不存在');
    const cardRect = card.getBoundingClientRect();
    const buttonRects = Array.from(card.querySelectorAll('button')).map((button) => {
      const rect = button.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    });
    return {
      parent: overlay.parentElement?.tagName,
      card: {
        top: cardRect.top,
        bottom: cardRect.bottom,
        left: cardRect.left,
        right: cardRect.right,
      },
      buttons: buttonRects,
      touchAction: getComputedStyle(card).touchAction,
    };
  });
  expect(fullMetrics.parent).toBe('BODY');
  expect(fullMetrics.card.top).toBeGreaterThanOrEqual(0);
  expect(fullMetrics.card.bottom).toBeLessThanOrEqual(844);
  for (const button of fullMetrics.buttons) {
    expect(button.top).toBeGreaterThanOrEqual(0);
    expect(button.bottom).toBeLessThanOrEqual(844);
    expect(button.left).toBeGreaterThanOrEqual(0);
    expect(button.right).toBeLessThanOrEqual(390);
  }
  expect(fullMetrics.touchAction).toBe('pan-y');

  // 壓低 viewport 模擬手機瀏覽器可視區不足：內容超出時 scrollTop 必須真的可前進。
  await page.setViewportSize({ width: 390, height: 360 });
  await expect
    .poll(() => settingsCard.evaluate((card) => card.scrollHeight > card.clientHeight))
    .toBe(true);
  await settingsCard.evaluate((card) => {
    card.scrollTop = card.scrollHeight;
  });
  expect(await settingsCard.evaluate((card) => card.scrollTop)).toBeGreaterThan(0);
  const shortButtonMetrics = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('.settings-card');
    const button = document.querySelector<HTMLElement>('[data-setting="close"]');
    if (!card || !button) throw new Error('設定完成鈕不存在');
    const cardRect = card.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    return {
      cardTop: cardRect.top,
      cardBottom: cardRect.bottom,
      buttonTop: buttonRect.top,
      buttonBottom: buttonRect.bottom,
    };
  });
  expect(shortButtonMetrics.cardTop).toBeGreaterThanOrEqual(0);
  expect(shortButtonMetrics.cardBottom).toBeLessThanOrEqual(360);
  expect(shortButtonMetrics.buttonTop).toBeGreaterThanOrEqual(0);
  expect(shortButtonMetrics.buttonBottom).toBeLessThanOrEqual(360);
  await page.locator('[data-setting="close"]').click();
  await expect(settingsCard).toHaveCount(0);

  // 同一條直持路徑進入配置專頁：操作列也必須留在 viewport 內。
  await page.locator('[data-menu="settings"]').click();
  await page.locator('[data-setting="key-config"]').click();
  const configMetrics = await page.evaluate(() => {
    const bar = document.querySelector<HTMLElement>('.cfg-bar');
    if (!bar) throw new Error('按鈕配置列不存在');
    const rect = bar.getBoundingClientRect();
    const buttons = Array.from(bar.querySelectorAll('button')).map((button) => {
      const buttonRect = button.getBoundingClientRect();
      return {
        top: buttonRect.top,
        bottom: buttonRect.bottom,
        left: buttonRect.left,
        right: buttonRect.right,
      };
    });
    return {
      parent: bar.parentElement?.tagName,
      rect: { top: rect.top, bottom: rect.bottom },
      buttons,
    };
  });
  expect(configMetrics.parent).toBe('BODY');
  expect(configMetrics.rect.top).toBeGreaterThanOrEqual(0);
  expect(configMetrics.rect.bottom).toBeLessThanOrEqual(360);
  for (const button of configMetrics.buttons) {
    expect(button.top).toBeGreaterThanOrEqual(0);
    expect(button.bottom).toBeLessThanOrEqual(360);
    expect(button.left).toBeGreaterThanOrEqual(0);
    expect(button.right).toBeLessThanOrEqual(390);
  }
  // 配置按鈕沿 domButton 的 pointerdown 即時觸發，handler 會同步移除操作列；
  // 用真實 pointerdown 驗證觸控路徑，避免 Playwright click 在 pointerdown 後等待
  // 已被 teardown 的節點而誤判為 detached。
  await page.locator('[data-cfg="cancel"]').dispatchEvent('pointerdown', {
    pointerId: 9,
    isPrimary: true,
  });
  expect(errors).toEqual([]);
});

test('旋轉偵測：直持提示會在使用者轉橫後收起並記憶', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('sp-install-dismissed', '1');
    localStorage.removeItem('sp-orientation-landscape-seen');
    localStorage.removeItem('sp-orientation-hint');
  });
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  const orientationCard = page.locator('.install-card', { hasText: '橫持遊玩體驗更佳' });
  await expect(orientationCard).toBeVisible({ timeout: 7000 });

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(orientationCard).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sp-orientation-landscape-seen'))).toBe(
    '1',
  );
  expect(errors).toEqual([]);
});

test('觸控新手提示：前五場顯示、第五場後停止，設定可永久關閉', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('sp-install-dismissed', '1');
    localStorage.setItem('sp-orientation-landscape-seen', '1');
    localStorage.setItem('sp-desktop-keys', '1');
  });

  for (let play = 1; play <= 6; play += 1) {
    await page.goto('/');
    await expect(page.locator('#app canvas')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
    await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
      pointerId: play,
      isPrimary: true,
    });
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    const hint = page.locator('[data-control-hints="card"]');
    if (play <= 5) {
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('左手大拇指');
      await expect(hint).toContainText('右手食指');
      await expect(hint).toContainText('長按可以連續吸取多隻');
      await hint.locator('[data-control-hints="close"]').dispatchEvent('pointerdown', {
        pointerId: play + 10,
        isPrimary: true,
      });
      await expect(hint).toHaveCount(0);
    } else {
      await expect(hint).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () =>
          (
            JSON.parse(localStorage.getItem('sp-settings') ?? '{}') as {
              controlHintsPlayCount?: number;
            }
          ).controlHintsPlayCount,
      ),
    ).toBe(Math.min(play, 5));
  }

  await page.locator('[data-menu="pause"]').dispatchEvent('pointerdown', {
    pointerId: 99,
    isPrimary: true,
  });
  await page.locator('[data-pause="settings"]').dispatchEvent('pointerdown', {
    pointerId: 100,
    isPrimary: true,
  });
  await expect(page.locator('.settings-card')).toBeVisible();
  await page.locator('[data-setting="controlHintsEnabled"]').click();
  expect(
    await page.evaluate(
      () =>
        (
          JSON.parse(localStorage.getItem('sp-settings') ?? '{}') as {
            controlHintsEnabled?: boolean;
          }
        ).controlHintsEnabled,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});
