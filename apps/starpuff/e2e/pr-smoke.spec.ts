import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: { scene: () => string; probe: () => { x: number } };
  }
}

const MOVE_DISTANCE = 36;

async function startGuidedTutorial(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('[data-menu="start"]').click();
  await expect(page.locator('[data-tutorial-choice="guided"]')).toBeVisible();
  await page.locator('[data-tutorial-choice="guided"]').click();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect(page.locator('.guided-tutorial-overlay')).toBeVisible();
}

async function completeMove(page: Page): Promise<void> {
  const before = await page.evaluate(() => window.__sp.probe().x);
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    await page.keyboard.down('ArrowRight');
    await expect
      .poll(() => page.evaluate(() => window.__sp.probe().x), { timeout: 5000 })
      .toBeGreaterThan(before + MOVE_DISTANCE);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');
    await expect
      .poll(() => page.evaluate(() => window.__sp.probe().x), { timeout: 5000 })
      .toBeLessThan(before - MOVE_DISTANCE);
    await page.keyboard.up('ArrowLeft');
    return;
  }

  const joyZone = page.locator('#joy-zone');
  const box = await joyZone.boundingBox();
  if (!box) throw new Error('找不到左側搖桿區');
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const delta = Math.min(80, Math.max(48, box.width * 0.28));
  await joyZone.dispatchEvent('pointerdown', {
    pointerId: 11,
    isPrimary: true,
    clientX: centerX,
    clientY: centerY,
  });
  await joyZone.dispatchEvent('pointermove', {
    pointerId: 11,
    isPrimary: true,
    clientX: centerX + delta,
    clientY: centerY,
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.probe().x), { timeout: 5000 })
    .toBeGreaterThan(before + MOVE_DISTANCE);
  await joyZone.dispatchEvent('pointermove', {
    pointerId: 11,
    isPrimary: true,
    clientX: centerX - delta,
    clientY: centerY,
  });
  await expect
    .poll(() => page.evaluate(() => window.__sp.probe().x), { timeout: 5000 })
    .toBeLessThan(before - MOVE_DISTANCE);
  await joyZone.dispatchEvent('pointerup', { pointerId: 11, isPrimary: true });
}

async function completeJump(page: Page): Promise<void> {
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    await page.keyboard.press('Z', { delay: 90 });
    return;
  }
  const jumpButton = page.locator('[data-btn="a"]');
  await jumpButton.dispatchEvent('pointerdown', { pointerId: 12, isPrimary: true });
  await page.waitForTimeout(250);
  await jumpButton.dispatchEvent('pointerup', { pointerId: 12, isPrimary: true });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sp-install-dismissed', '1');
    const current = JSON.parse(localStorage.getItem('sp-settings') ?? '{}') as Record<
      string,
      unknown
    >;
    localStorage.setItem(
      'sp-settings',
      JSON.stringify({ ...current, schemaVersion: 2, guidedTutorialStatus: 'unseen' }),
    );
  });
});

test('PR smoke：桌機與行動橫向可完成第一個真實操作', async ({ page }) => {
  await startGuidedTutorial(page);
  await expect(page.getByRole('button', { name: '下一步' })).toHaveCount(0);
  await completeMove(page);
  await expect(page.getByRole('button', { name: '下一步' })).toBeVisible({ timeout: 5000 });

  const card = page.locator('.guided-tutorial-card');
  const metrics = await card.evaluate((element) => {
    const cardRect = element.getBoundingClientRect();
    const selectors = ['#joy-zone', '[data-btn="a"]', '[data-btn="b"]', '[data-btn="tf"]'];
    const overlaps = selectors.some((selector) => {
      const target = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      return target
        ? cardRect.left < target.right &&
            cardRect.right > target.left &&
            cardRect.top < target.bottom &&
            cardRect.bottom > target.top
        : false;
    });
    return {
      withinViewport:
        cardRect.left >= 0 &&
        cardRect.top >= 0 &&
        cardRect.right <= window.innerWidth &&
        cardRect.bottom <= window.innerHeight,
      overlaps,
      pointerEvents: getComputedStyle(element).pointerEvents,
    };
  });
  expect(metrics.withinViewport).toBe(true);
  expect(metrics.overlaps).toBe(false);
  expect(metrics.pointerEvents).toBe('none');
});

test('PR smoke：跳躍後看懂雙指長按連吞提示', async ({ page }) => {
  await startGuidedTutorial(page);
  await completeMove(page);
  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '跳一下就好' })).toBeVisible();
  await completeJump(page);
  await expect(page.getByRole('button', { name: '下一步' })).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '把星星吸進來' })).toBeVisible();
  await expect(page.locator('.guided-tutorial-instruction')).toContainText('長按');

  if ((page.viewportSize()?.width ?? 0) < 1000) {
    await expect(page.locator('.guided-tutorial-tip')).toContainText('一顆接一顆');
    await expect(page.locator('.guided-tutorial-tip')).toContainText('同時按');
    await expect(page.locator('.guided-tutorial-instruction')).not.toContainText(/\b[AB]\b/);
    await expect(
      page.locator('.guided-tutorial-card > .learning-control-strip [data-control-token="action"]'),
    ).toBeVisible();
    await expect(page.locator('.guided-tutorial-tip [data-control-token="action"]')).toBeVisible();
    await expect(page.locator('.guided-tutorial-tip [data-control-token="jump"]')).toBeVisible();
    await expect(page.locator('.guided-tutorial-tip-art')).toHaveAttribute(
      'src',
      /tutorial-touch-continuous-inhale-v4/,
    );
  } else {
    await expect(page.locator('.guided-tutorial-tip')).toContainText('連續吸入');
  }
});
