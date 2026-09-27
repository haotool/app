import { expect, test } from '@playwright/test';

const URL = '/a320-flight-deck/?quality=LOW';

test.describe('A320neo Flight Deck smoke', () => {
  test('loads, starts a flight and runs the simulation in the production bundle', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto(URL);
    await expect(page).toHaveTitle(/A320neo/);
    // 載入畫面依實際建構階段前進，最後進入主選單
    await expect(page.locator('button.start')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('button.scenario')).toHaveCount(4);

    // 語言切換
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('button.start')).toHaveText('Start');

    await page.locator('button.start').click();
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.phase-chip')).toHaveText(/TAXI/);

    // 推力 TOGA → 物理加速，飛行階段進入起飛滑跑（桌機鍵盤、手機油門滑軌）
    const track = page.locator('.thr-track');
    if (await track.isVisible()) {
      await track.click({ position: { x: 29, y: 2 } });
    } else {
      await page.locator('canvas.gl').click({ position: { x: 5, y: 300 } });
      await page.keyboard.press('t');
    }
    await expect(page.locator('.phase-chip')).toHaveText(/TAKEOFF ROLL/, { timeout: 30_000 });

    const size = await page
      .locator('canvas.gl')
      .evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(size[0]).toBeGreaterThan(100);
    expect(size[1]).toBeGreaterThan(100);
    expect(errors).toEqual([]);
  });

  test('serves SEO resources under the production subpath', async ({ request }) => {
    for (const path of ['robots.txt', 'sitemap.xml', 'llms.txt', 'favicon.svg', 'og-image.jpg']) {
      const res = await request.get(`/a320-flight-deck/${path}`);
      expect(res.status(), path).toBe(200);
    }
  });
});
