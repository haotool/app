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
  await expect(page.getByText('持倉 (1)')).toBeVisible();
}

test.describe('圖表 symbol 快切', () => {
  test('從 header 開啟快切 sheet 搜尋切換後保留當前時間框架', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/chart/BTCUSDT');
    await acknowledgeDisclaimer(page);
    await expect(page.getByRole('heading', { name: /BTC/ })).toBeVisible();

    const tf5m = page.getByRole('tab', { name: '5m', exact: true });
    await tf5m.click();
    await expect(tf5m).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: /切換交易對，目前為 BTC\/USDT/ }).click();
    const sheet = page.getByRole('dialog', { name: '選擇交易對' });
    await expect(sheet).toBeVisible();

    await sheet.getByRole('searchbox', { name: '搜尋交易對' }).fill('eth');
    await sheet.getByRole('button', { name: /ETH\/USDT/ }).click();

    await expect(page).toHaveURL(/\/papertrade\/chart\/ETHUSDT$/);
    await expect(page.getByRole('heading', { name: /ETH/ })).toBeVisible();
    await expect(page.getByText('3,000.0').first()).toBeVisible();
    await expect(tf5m).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('PaperTrade trading journeys', () => {
  test('resting limit order fills when the mark crosses the limit price', async ({ page }) => {
    const market = await enterTradePage(page);

    await page.getByRole('tab', { name: '限價' }).click();
    await page.getByRole('textbox', { name: '限價（USDT）' }).fill('59000');
    await page.getByRole('textbox', { name: '數量（USDT）' }).fill('5900');
    await page.getByRole('button', { name: '買多' }).click();

    const orderList = page.getByRole('region', { name: '當前委託' });
    await expect(orderList).toBeVisible();
    await expect(page.getByText('當前委託 (1)')).toBeVisible();

    // mark 跌破限價：掛單以 mark 成交、轉為持倉並跳成交 toast。
    market.pushTicker('BTCUSDT', 58900);

    await expect(page.getByText(/限價委託成交/)).toBeVisible();
    await expect(page.getByText('持倉 (1)')).toBeVisible();
    // R5-5：委託區塊常駐同顯，成交後回到空狀態而非隱藏。
    await expect(page.getByText('當前委託 (0)')).toBeVisible();
    await expect(orderList.getByText('尚無委託')).toBeVisible();
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
    await expect(page.getByText('持倉 (0)')).toBeVisible();
    await expect(page.getByText('尚無持倉')).toBeVisible();
  });

  test('liquidation shows a warning toast and clears the position', async ({ page }) => {
    const market = await enterTradePage(page);
    await openMarketLong(page, '6000');

    // 10x 多單強平價約 54,300：直接跳空跌破。
    market.pushTicker('BTCUSDT', 50000);

    await expect(page.getByText(/強制平倉/)).toBeVisible();
    await expect(page.getByText(/已全數損失/)).toBeVisible();
    await expect(page.getByText('持倉 (0)')).toBeVisible();
  });
});
