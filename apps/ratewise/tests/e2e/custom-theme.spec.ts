import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

/**
 * E2 自訂主題色 - 設定頁選色旅程 E2E
 *
 * 旅程（依設計簡報品質閘門）：
 * 1. 設定頁點選「自訂主題色」卡 → 選色面板展開
 * 2. 點精選色票 → 即時全 app 套用（data-style=custom + inline --color-primary + theme-color meta）
 * 3. 重載後仍生效（bootstrap pre-paint 覆寫）
 * 4. 切回內建主題（Zen）→ inline 覆寫零殘留
 */

const CORAL = '#FF6B6B';
const CORAL_TRIPLE = '255 107 107';

const getInlinePrimary = (page: Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue('--color-primary').trim());

const getDataStyle = (page: Page) => page.evaluate(() => document.documentElement.dataset['style']);

const customCard = (page: Page) => page.getByRole('button', { name: '自訂主題色 打造專屬主色' });

const gotoSettings = async (page: Page) => {
  await page.getByRole('link', { name: /設定/i }).first().click();
  await expect(customCard(page)).toBeVisible();
};

test.describe('自訂主題色選色旅程', () => {
  test('選色即時套用 → 重載仍生效 → 切回內建主題無殘留', async ({ rateWisePage: page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // 1. 進設定頁，啟用自訂主題色
    await gotoSettings(page);
    await customCard(page).click();
    await expect(page.getByRole('group', { name: '精選色票' })).toBeVisible();
    expect(await getDataStyle(page)).toBe('custom');

    // 2. 點珊瑚色票 → 即時全 app 套用
    await page.getByRole('button', { name: `自訂主題色 ${CORAL}` }).click();
    await expect.poll(() => getInlinePrimary(page)).toBe(CORAL_TRIPLE);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', CORAL);

    // 持久化形狀符合 SSOT
    const stored = await page.evaluate(() => localStorage.getItem('ratewise-theme'));
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ style: 'custom', customPrimary: CORAL });

    // 首頁同步變色（inline 覆寫掛在 documentElement，全路由生效）
    await page
      .getByRole('link', { name: /單幣別/i })
      .first()
      .click();
    await expect(page.getByTestId('amount-input')).toBeVisible();
    expect(await getInlinePrimary(page)).toBe(CORAL_TRIPLE);

    // 3. 重載仍生效（bootstrap allowlist + pre-paint 覆寫）
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('amount-input')).toBeVisible();
    expect(await getDataStyle(page)).toBe('custom');
    await expect.poll(() => getInlinePrimary(page)).toBe(CORAL_TRIPLE);

    // 4. 切回 Zen → inline 覆寫零殘留
    await gotoSettings(page);
    await page.getByRole('button', { name: /^Zen/ }).click();
    await expect.poll(() => getDataStyle(page)).toBe('zen');
    const residual = await page.evaluate(() => {
      const style = document.documentElement.style;
      return Array.from(style).filter((name) => name.startsWith('--color-'));
    });
    expect(residual).toEqual([]);

    expect(consoleErrors).toEqual([]);
  });
});
