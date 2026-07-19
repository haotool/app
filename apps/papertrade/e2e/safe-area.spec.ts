import { test, expect } from '@playwright/test';
import { acknowledgeDisclaimer, mockBybit } from './support/mock-bybit';

// R6-1：覆寫 --sat 模擬 notch 裝置 standalone 狀態列（47px），驗證頂部 safe-area 適配。
const SAT_OVERRIDE = ':root{--sat:47px}';

test.describe('R6-1 頂部 safe-area 適配', () => {
  test('交易頁 sticky header 吃 safe-area、首屏標題不被狀態列遮擋', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/trade');
    await acknowledgeDisclaimer(page);
    await expect(page.getByText('60,000.0').first()).toBeVisible();
    await page.addStyleTag({ content: SAT_OVERRIDE });

    const paddingTop = await page
      .locator('div.sticky')
      .first()
      .evaluate((element) => parseFloat(getComputedStyle(element).paddingTop));
    expect(paddingTop).toBeGreaterThanOrEqual(47);

    const pairTop = await page
      .getByRole('button', { name: /切換交易對/ })
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(pairTop).toBeGreaterThanOrEqual(47);
  });

  test('行情頁首屏標題與捲動後工具列均不被狀態列遮擋', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/');
    await acknowledgeDisclaimer(page);
    await page.addStyleTag({ content: SAT_OVERRIDE });

    const titleTop = await page
      .getByRole('heading', { name: '行情' })
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(titleTop).toBeGreaterThanOrEqual(47);

    await page.evaluate(() => window.scrollTo(0, 600));
    const searchTop = await page
      .getByRole('searchbox', { name: '搜尋交易對' })
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(searchTop).toBeGreaterThanOrEqual(47);
  });
});
