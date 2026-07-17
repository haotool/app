import { test, expect } from '@playwright/test';

/**
 * G15/G11 短視口回歸（wave-6 合議驗收）：
 * 三個視口高度斷言「成員 chips elementFromPoint 命中自身」＋「鍵盤末列（0/Done）可達」。
 * 375×664 模擬真實行動瀏覽器網址列可見時的有效視高（640–764px 缺口區間）。
 */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 664 },
  { width: 390, height: 844 },
];

/** 中心點 elementFromPoint 所命中的最近 button 文字；命中自身時等於該鈕文字。 */
async function hitTestButtonText(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
): Promise<string> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('target has no bounding box');
  return page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x ?? 0, y ?? 0);
      const btn = el instanceof Element ? el.closest('button') : null;
      return btn?.textContent?.trim() ?? 'none';
    },
    [box.x + box.width / 2, box.y + box.height / 2],
  );
}

for (const vp of VIEWPORTS) {
  test(`${vp.width}x${vp.height}：成員可點且鍵盤末列可達`, async ({ page }) => {
    // PWA「離線就緒」提示浮於面板上方，出現時先關閉避免污染 hit-test。
    await page.addLocatorHandler(
      page.getByRole('status').getByRole('button', { name: 'Close' }),
      async (btn) => {
        await btn.click();
      },
    );

    await page.setViewportSize(vp);
    await page.goto('/');
    await expect(page.getByTestId('home-panel')).toBeVisible();

    // SW 註冊後的離線就緒橫幅若在場，顯式關閉再量測。
    const banner = page.getByRole('status');
    await banner.waitFor({ state: 'visible', timeout: 7000 }).catch(() => {});
    if (await banner.count()) {
      await banner
        .getByRole('button', { name: 'Close' })
        .click({ timeout: 2000 })
        .catch(() => {});
      await expect(banner).toHaveCount(0);
    }

    // 1) 成員 chips 中心點 elementFromPoint 必命中自身（不被面板攔截）
    for (const name of ['Me', 'Oliver', 'Luna']) {
      const chip = page
        .locator('button[aria-pressed]')
        .filter({ hasText: new RegExp(`^${name}$`) });
      await expect(chip).toBeVisible();
      expect(await hitTestButtonText(page, chip)).toBe(name);
    }

    // 2) 面板內容溢出時（未捲動前）必須有捲動暗示漸層；無溢出時隱藏
    const hint = page.getByTestId('panel-scroll-hint');
    const overflowing = await page
      .getByTestId('home-panel')
      .evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    await expect(hint).toHaveCSS('opacity', overflowing ? '1' : '0');

    // 3) 鍵盤末列（0／Done）可達：可視或面板內捲入後命中自身
    for (const label of ['0', 'Done']) {
      const key = page.getByRole('button', { name: label, exact: true });
      await key.scrollIntoViewIfNeeded();
      expect(await hitTestButtonText(page, key)).toBe(label);
    }
  });
}
