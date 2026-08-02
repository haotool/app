import { expect, test, type Locator, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'screenshots/modal-landscape';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
    };
  }
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return errors;
}

async function expectInsideViewport(locator: Locator, viewport: { width: number; height: number }) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`找不到 ${await locator.getAttribute('class')}`);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
}

async function waitForTitle(page: Page): Promise<void> {
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
}

test.describe('手機 viewport-level 提示與設定截圖回歸', () => {
  test('橫式：PWA、操作提示、暫停、設定、按鈕配置都不被遮蔽', async ({ page, viewport }) => {
    test.skip(
      !viewport || viewport.height >= viewport.width || viewport.width >= 1024,
      '需要手機橫式 project',
    );
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.removeItem('sp-install-dismissed');
      localStorage.setItem('sp-orientation-landscape-seen', '1');
      localStorage.setItem('sp-rotation-notice', '1');
    });
    await page.goto('/');
    await waitForTitle(page);

    const pwaCard = page.locator('.install-card');
    await expect(pwaCard).toContainText('加到主畫面');
    await expect(pwaCard).toHaveAttribute('aria-modal', 'false');
    await expectInsideViewport(pwaCard, viewport!);
    await expectInsideViewport(pwaCard.getByRole('button', { name: '知道了' }), viewport!);
    await pwaCard.screenshot({ path: `${SCREENSHOT_DIR}/pwa-card.png` });
    await screenshot(page, 'landscape-pwa');
    await pwaCard.getByRole('button', { name: '知道了' }).dispatchEvent('pointerdown', {
      pointerId: 1,
      isPrimary: true,
    });

    await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
      pointerId: 2,
      isPrimary: true,
    });
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');

    const controlHints = page.locator('[data-control-hints="card"]');
    await expect(controlHints).toBeVisible();
    await expect(controlHints).toHaveAttribute('aria-modal', 'true');
    await expectInsideViewport(controlHints, viewport!);
    await expect(controlHints.locator('[data-control-hint="item"]')).toHaveCount(5);
    for (const item of await controlHints.locator('[data-control-hint="item"]').all()) {
      await expectInsideViewport(item, viewport!);
    }
    await expectInsideViewport(controlHints.locator('[data-control-hints="close"]'), viewport!);
    await controlHints.screenshot({ path: `${SCREENSHOT_DIR}/control-hints-card.png` });
    await screenshot(page, 'landscape-control-hints');
    await controlHints.locator('[data-control-hints="close"]').dispatchEvent('pointerdown', {
      pointerId: 3,
      isPrimary: true,
    });

    await page.keyboard.press('Escape');
    const pauseCard = page.locator('.pause-card');
    await expect(pauseCard).toBeVisible();
    await expectInsideViewport(pauseCard, viewport!);
    for (const button of await pauseCard.locator('button').all()) {
      await expectInsideViewport(button, viewport!);
    }
    await pauseCard.screenshot({ path: `${SCREENSHOT_DIR}/pause-card.png` });
    await screenshot(page, 'landscape-pause');

    await page.locator('[data-pause="settings"]').dispatchEvent('pointerdown', {
      pointerId: 4,
      isPrimary: true,
    });
    const settingsCard = page.locator('.settings-card');
    await expect(settingsCard).toBeVisible();
    await expect(settingsCard).toHaveAttribute('aria-modal', 'true');
    await expectInsideViewport(settingsCard, viewport!);
    for (const button of await settingsCard.locator('button').all()) {
      await expectInsideViewport(button, viewport!);
    }
    await settingsCard.screenshot({ path: `${SCREENSHOT_DIR}/settings-card.png` });
    await screenshot(page, 'landscape-settings');

    await settingsCard.locator('[data-setting="key-config"]').dispatchEvent('pointerdown', {
      pointerId: 5,
      isPrimary: true,
    });
    const configBar = page.locator('.cfg-bar');
    await expect(configBar).toBeVisible();
    await expectInsideViewport(configBar, viewport!);
    for (const button of await configBar.locator('button').all()) {
      await expectInsideViewport(button, viewport!);
    }
    await configBar.screenshot({ path: `${SCREENSHOT_DIR}/key-config-bar.png` });
    await screenshot(page, 'landscape-key-config');
    await configBar.locator('[data-cfg="cancel"]').dispatchEvent('pointerdown', {
      pointerId: 6,
      isPrimary: true,
    });

    expect(errors).toEqual([]);
  });

  test('橫式：回訪方向更新提示卡完整可見', async ({ page, viewport }) => {
    test.skip(
      !viewport || viewport.height >= viewport.width || viewport.width >= 1024,
      '需要手機橫式 project',
    );
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('sp-install-dismissed', '1');
      localStorage.setItem('sp-orientation-landscape-seen', '1');
      localStorage.removeItem('sp-rotation-notice');
      localStorage.setItem(
        'sp-save',
        JSON.stringify({
          schemaVersion: 2,
          highestClearedLevel: 0,
          levels: {},
          lastPlayedAt: 1,
          achievements: [],
        }),
      );
    });
    await page.goto('/');
    await waitForTitle(page);

    const rotationCard = page.locator('.install-card', { hasText: '直持方向更新了' });
    await expect(rotationCard).toBeVisible({ timeout: 7000 });
    await expectInsideViewport(rotationCard, viewport!);
    for (const button of await rotationCard.locator('button').all()) {
      await expectInsideViewport(button, viewport!);
    }
    await rotationCard.screenshot({ path: `${SCREENSHOT_DIR}/rotation-notice-card.png` });
    await screenshot(page, 'landscape-rotation-notice');
    await rotationCard.getByRole('button', { name: '使用新方向' }).dispatchEvent('pointerdown', {
      pointerId: 8,
      isPrimary: true,
    });
    await expect(rotationCard).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sp-rotation-notice'))).toBe('1');
    expect(errors).toEqual([]);
  });

  test('橫式：設定損毀修復提示卡完整可見', async ({ page, viewport }) => {
    test.skip(
      !viewport || viewport.height >= viewport.width || viewport.width >= 1024,
      '需要手機橫式 project',
    );
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('sp-install-dismissed', '1');
      localStorage.setItem('sp-orientation-landscape-seen', '1');
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem('sp-settings', '{not-json');
    });
    await page.goto('/');
    await waitForTitle(page);

    const recoveryCard = page.locator('.install-card', { hasText: '偏好設定已重置' });
    await expect(recoveryCard).toBeVisible({ timeout: 8000 });
    await expectInsideViewport(recoveryCard, viewport!);
    await expectInsideViewport(recoveryCard.getByRole('button', { name: '我知道了' }), viewport!);
    await recoveryCard.screenshot({ path: `${SCREENSHOT_DIR}/settings-recovery-card.png` });
    await screenshot(page, 'landscape-settings-recovery');
    await recoveryCard.getByRole('button', { name: '我知道了' }).dispatchEvent('pointerdown', {
      pointerId: 9,
      isPrimary: true,
    });
    await expect(recoveryCard).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sp-settings'))).not.toBe('{not-json');
    expect(errors).toEqual([]);
  });

  test('橫式：儲存不可用提示卡完整可見', async ({ page, viewport }) => {
    test.skip(
      !viewport || viewport.height >= viewport.width || viewport.width >= 1024,
      '需要手機橫式 project',
    );
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('sp-install-dismissed', '1');
      localStorage.setItem('sp-orientation-landscape-seen', '1');
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem(
        'sp-settings',
        JSON.stringify({
          schemaVersion: 1,
          audioMuted: false,
          hapticsEnabled: true,
          wakeLockEnabled: true,
          reducedMotion: false,
          controlHintsEnabled: true,
          controlHintsPlayCount: 0,
          screenShake: 'full',
          shellRotation: null,
          keyLayout: null,
        }),
      );
      const nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key: string, value: string): void {
        if (key === 'sp-storage-probe') {
          throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
        }
        nativeSetItem.call(this, key, value);
      };
    });
    await page.goto('/');
    await waitForTitle(page);

    const unavailableCard = page.locator('.install-card', { hasText: '進度無法保存' });
    await expect(unavailableCard).toBeVisible({ timeout: 8000 });
    await expectInsideViewport(unavailableCard, viewport!);
    await expectInsideViewport(
      unavailableCard.getByRole('button', { name: '我知道了' }),
      viewport!,
    );
    await unavailableCard.screenshot({ path: `${SCREENSHOT_DIR}/save-unavailable-card.png` });
    await screenshot(page, 'landscape-save-unavailable');
    await unavailableCard.getByRole('button', { name: '我知道了' }).dispatchEvent('pointerdown', {
      pointerId: 10,
      isPrimary: true,
    });
    await expect(unavailableCard).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('直式：方向提示保持正向可讀；未轉橫再次進站仍提示，轉橫後才記憶', async ({
    page,
    viewport,
  }) => {
    test.skip(
      !viewport || viewport.height <= viewport.width || viewport.width >= 1024,
      '需要手機直式 project',
    );
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('sp-install-dismissed', '1');
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.removeItem('sp-orientation-landscape-seen');
      localStorage.removeItem('sp-orientation-hint');
    });
    await page.goto('/');
    await waitForTitle(page);

    const orientationCard = page.locator('.install-card', { hasText: '橫持遊玩體驗更佳' });
    await expect(orientationCard).toBeVisible({ timeout: 7000 });
    await expectInsideViewport(orientationCard, viewport!);
    await expect(orientationCard).toHaveCSS('transform', 'none');
    await orientationCard.screenshot({ path: `${SCREENSHOT_DIR}/portrait-orientation.png` });
    await screenshot(page, 'portrait-orientation');
    await orientationCard.getByRole('button', { name: '知道了' }).dispatchEvent('pointerdown', {
      pointerId: 7,
      isPrimary: true,
    });
    expect(await page.evaluate(() => localStorage.getItem('sp-orientation-landscape-seen'))).toBe(
      null,
    );

    await page.reload();
    await waitForTitle(page);
    await expect(page.locator('.install-card', { hasText: '橫持遊玩體驗更佳' })).toBeVisible({
      timeout: 7000,
    });

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('.install-card', { hasText: '橫持遊玩體驗更佳' })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sp-orientation-landscape-seen'))).toBe(
      '1',
    );
    expect(errors).toEqual([]);
  });
});
