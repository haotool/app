import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: { scene: () => string; probe: () => { x: number } };
  }
}

async function dismissOptionalControlHints(page: Page): Promise<void> {
  const hint = page.locator('[data-control-hints="card"]');
  if ((page.viewportSize()?.width ?? 0) >= 1000) return;
  await hint.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await hint.count()) {
    await hint.locator('[data-control-hints="close"]').dispatchEvent('pointerdown', {
      pointerId: 10,
      isPrimary: true,
    });
  }
  await expect(hint).toHaveCount(0);
}

async function completeTouchMove(
  page: Page,
  pointerId: number,
): Promise<{ afterFirst: { x: number }; afterSecond: { x: number } }> {
  const joyZone = page.locator('#joy-zone');
  const viewport = page.viewportSize();
  const portrait = (viewport?.height ?? 0) > (viewport?.width ?? 0);
  const centerX = 150;
  const centerY = 330;
  const deltaX = portrait ? 0 : 80;
  const deltaY = portrait ? -80 : 0;
  await joyZone.dispatchEvent('pointerdown', {
    pointerId,
    isPrimary: true,
    clientX: centerX,
    clientY: centerY,
  });
  await joyZone.dispatchEvent('pointermove', {
    pointerId,
    isPrimary: true,
    clientX: centerX + deltaX,
    clientY: centerY + deltaY,
  });
  await page.waitForTimeout(1000);
  const afterFirst = await page.evaluate(() => window.__sp.probe());
  await joyZone.dispatchEvent('pointermove', {
    pointerId,
    isPrimary: true,
    clientX: centerX - deltaX,
    clientY: centerY - deltaY,
  });
  await page.waitForTimeout(1500);
  const afterSecond = await page.evaluate(() => window.__sp.probe());
  await joyZone.dispatchEvent('pointerup', { pointerId, isPrimary: true });
  return { afterFirst, afterSecond };
}

test.describe('混合式互動新手教學', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('sp-guided-test-seeded') === '1') return;
      const current = JSON.parse(localStorage.getItem('sp-settings') ?? '{}') as Record<
        string,
        unknown
      >;
      localStorage.setItem(
        'sp-settings',
        JSON.stringify({ ...current, schemaVersion: 1, guidedTutorialStatus: 'unseen' }),
      );
      sessionStorage.setItem('sp-guided-test-seeded', '1');
    });
  });

  test('首次開始先選擇，直接開始後不再自動彈出', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-menu="start"]')).toBeVisible();
    await page.locator('[data-menu="start"]').click();
    await expect(page.locator('.tutorial-choice-overlay')).toBeVisible();
    await page.locator('[data-tutorial-choice="direct"]').click();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await dismissOptionalControlHints(page);

    await page.locator('[data-menu="pause"]').click();
    await page.locator('[data-pause="quit"]').click();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
    await page.locator('[data-menu="start"]').click();
    await expect(page.locator('.tutorial-choice-overlay')).toHaveCount(0);
  });

  test('右手食指長按 B 時，右手大拇指仍可同時按 A', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1000, '僅在觸控專案驗證雙指標路徑');
    await page.goto('/');
    await page.locator('[data-menu="start"]').click();
    await page.locator('[data-tutorial-choice="direct"]').click();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await dismissOptionalControlHints(page);

    const inhaleButton = page.locator('[data-btn="b"]');
    const jumpButton = page.locator('[data-btn="a"]');
    await inhaleButton.dispatchEvent('pointerdown', { pointerId: 41, isPrimary: true });
    await jumpButton.dispatchEvent('pointerdown', { pointerId: 42, isPrimary: true });
    await expect(inhaleButton).toHaveClass(/is-pressed/);
    await expect(jumpButton).toHaveClass(/is-pressed/);
    await page.waitForTimeout(250);
    await expect(inhaleButton).toHaveClass(/is-pressed/);
    await expect(jumpButton).toHaveClass(/is-pressed/);

    await jumpButton.dispatchEvent('pointerup', { pointerId: 42, isPrimary: true });
    await inhaleButton.dispatchEvent('pointerup', { pointerId: 41, isPrimary: true });
    await expect(inhaleButton).not.toHaveClass(/is-pressed/);
    await expect(jumpButton).not.toHaveClass(/is-pressed/);
  });

  test('吸入步驟顯示長按連吞與 A+B 同按建議', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1000, '僅在觸控專案驗證觸控教學文案');
    await page.goto('/');
    await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
      pointerId: 1,
      isPrimary: true,
    });
    await page.locator('[data-tutorial-choice="guided"]').dispatchEvent('pointerdown', {
      pointerId: 2,
      isPrimary: true,
    });
    await expect(page.locator('.guided-tutorial-overlay')).toBeVisible();

    await completeTouchMove(page, 3);
    await page.getByRole('button', { name: '下一步' }).click();
    await expect(page.getByRole('heading', { name: '跳起來' })).toBeVisible();

    const jumpButton = page.locator('[data-btn="a"]');
    await jumpButton.dispatchEvent('pointerdown', { pointerId: 4, isPrimary: true });
    await page.waitForTimeout(300);
    await jumpButton.dispatchEvent('pointerup', { pointerId: 4, isPrimary: true });
    await expect(page.getByRole('button', { name: '下一步' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '下一步' }).click();

    await expect(page.getByRole('heading', { name: '把星星吸進來' })).toBeVisible();
    await expect(page.locator('.guided-tutorial-instruction')).toContainText('長按');
    await expect(page.locator('.guided-tutorial-tip')).toContainText('一顆接一顆');
    await expect(page.locator('.guided-tutorial-tip')).toContainText('同時按 A');
    await expect(page.locator('.guided-tutorial-art')).toHaveAttribute(
      'src',
      /tutorial-touch-hold-inhale/,
    );
    await expect(page.locator('.guided-tutorial-tip-art')).toHaveAttribute(
      'src',
      /tutorial-touch-dual-input/,
    );
  });

  test('設定可以重播，且未完成目前步驟前沒有下一步', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu="start"]').click();
    await page.locator('[data-tutorial-choice="direct"]').click();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await dismissOptionalControlHints(page);
    await page.locator('[data-menu="pause"]').click();
    await page.locator('[data-pause="quit"]').click();
    await page.locator('[data-menu="settings"]').click();
    await page.locator('[data-setting="replay-tutorial"]').click();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await expect(page.locator('.guided-tutorial-overlay')).toBeVisible();
    await expect(page.getByRole('button', { name: '下一步' })).toHaveCount(0);
  });

  test('桌機可以用左右鍵完成第一步實作', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1000, '僅在桌機專案驗證鍵盤路徑');
    await page.goto('/');
    await page.locator('[data-menu="start"]').click();
    await page.locator('[data-tutorial-choice="guided"]').click();
    await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
    await expect(page.locator('.guided-tutorial-overlay')).toBeVisible();

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(700);
    await page.keyboard.up('ArrowLeft');
    await expect(page.getByRole('button', { name: '下一步' })).toBeVisible({ timeout: 5000 });
  });

  test('觸控可以用左側搖桿完成第一步，390×844 也不遮住提示', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1000, '僅在觸控專案驗證搖桿路徑');
    await page.goto('/');
    await page.locator('[data-menu="start"]').dispatchEvent('pointerdown', {
      pointerId: 1,
      isPrimary: true,
    });
    await page.locator('[data-tutorial-choice="guided"]').dispatchEvent('pointerdown', {
      pointerId: 2,
      isPrimary: true,
    });
    await expect(page.locator('.guided-tutorial-overlay')).toBeVisible();
    await expect(page.locator('.guided-tutorial-art')).toBeVisible();

    const before = await page.evaluate(() => window.__sp.probe());
    // 直持旋轉殼的指標座標必須使用裝置座標：ccw 下滑動軸對應遊戲左右；橫持則直接左右。
    const { afterFirst, afterSecond } = await completeTouchMove(page, 3);
    expect(afterFirst.x).not.toBe(before.x);
    expect(afterSecond.x).not.toBe(afterFirst.x);
    await expect(page.getByRole('button', { name: '下一步' })).toBeVisible({ timeout: 5000 });
  });
});
