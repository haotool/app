import { test, expect, type Page } from '@playwright/test';
import { acknowledgeDisclaimer, mockBybit, type MockMarket } from './support/mock-bybit';

async function enterTradePage(page: Page): Promise<MockMarket> {
  const market = await mockBybit(page);
  await page.goto('/papertrade/');
  await acknowledgeDisclaimer(page);
  await page.getByRole('link', { name: '交易' }).click();
  await expect(page.getByText('60,000.0').first()).toBeVisible();
  return market;
}

async function openMarketLong(page: Page, usdt: string): Promise<void> {
  await page.getByRole('textbox', { name: '數量（USDT）' }).fill(usdt);
  await page.getByRole('button', { name: '買多' }).click();
  await expect(page.getByText('目前持倉 (1)')).toBeVisible();
}

test.describe('PaperTrade trading journeys', () => {
  test('resting limit order fills when the mark crosses the limit price', async ({ page }) => {
    const market = await enterTradePage(page);

    await page.getByRole('tab', { name: '限價' }).click();
    await page.getByRole('textbox', { name: '限價（USDT）' }).fill('59000');
    await page.getByRole('textbox', { name: '數量（USDT）' }).fill('5900');
    await page.getByRole('button', { name: '買多' }).click();

    const orderList = page.getByRole('region', { name: '目前掛單' });
    await expect(orderList).toBeVisible();
    await expect(page.getByText('目前掛單 (1)')).toBeVisible();

    // mark 跌破限價：掛單以 mark 成交、轉為持倉並跳成交 toast。
    market.pushTicker('BTCUSDT', 58900);

    await expect(page.getByText(/限價單成交/)).toBeVisible();
    await expect(page.getByText('目前持倉 (1)')).toBeVisible();
    await expect(orderList).toBeHidden();
  });

  test('take-profit closes the position when the mark reaches the target', async ({ page }) => {
    const market = await enterTradePage(page);
    await openMarketLong(page, '6000');

    await page.getByRole('button', { name: '止盈止損' }).click();
    await page.getByRole('textbox', { name: /止盈價/ }).fill('61000');
    await page.getByRole('button', { name: '確認' }).click();
    await expect(page.getByText(/止盈 61,000/)).toBeVisible();

    market.pushTicker('BTCUSDT', 61500);

    await expect(page.getByText(/止盈觸發/)).toBeVisible();
    await expect(page.getByText('目前持倉 (0)')).toBeVisible();
    await expect(page.getByText('尚無持倉')).toBeVisible();
  });

  test('liquidation shows a warning toast and clears the position', async ({ page }) => {
    const market = await enterTradePage(page);
    await openMarketLong(page, '6000');

    // 10x 多單強平價約 54,300：直接跳空跌破。
    market.pushTicker('BTCUSDT', 50000);

    await expect(page.getByText(/強制平倉/)).toBeVisible();
    await expect(page.getByText(/已全數損失/)).toBeVisible();
    await expect(page.getByText('目前持倉 (0)')).toBeVisible();
  });
});
