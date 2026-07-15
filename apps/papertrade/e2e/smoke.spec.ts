import { test, expect } from '@playwright/test';
import { acknowledgeDisclaimer, mockBybit } from './support/mock-bybit';

test.describe('PaperTrade smoke journey', () => {
  test('markets → chart → trade → open → close', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/');
    await acknowledgeDisclaimer(page);

    const btcRow = page.getByRole('link', { name: /BTC\/USDT/ });
    await expect(btcRow).toBeVisible();
    await expect(page.getByText('60,000.0').first()).toBeVisible();

    await btcRow.click();
    await expect(page).toHaveURL(/\/papertrade\/chart\/BTCUSDT$/);
    await expect(page.getByRole('heading', { name: /BTC/ })).toBeVisible();
    await expect(page.getByTestId('candle-chart')).toBeVisible();
    await expect(page.getByRole('tab', { name: '訂單簿' })).toBeVisible();

    await page.getByRole('link', { name: '買多' }).click();
    await expect(page).toHaveURL(/\/papertrade\/trade\?symbol=BTCUSDT&side=long$/);

    await page.getByRole('textbox', { name: '數量（USDT）' }).fill('6000');
    await page.getByRole('button', { name: '買多' }).click();

    await expect(page.getByText('目前持倉 (1)')).toBeVisible();
    await expect(page.getByText('強平價')).toBeVisible();

    await page.getByRole('button', { name: '平倉' }).click();
    await page.getByRole('button', { name: '確認平倉' }).click();

    await expect(page.getByText('尚無持倉')).toBeVisible();
    await expect(page.getByText('目前持倉 (0)')).toBeVisible();
  });

  test('bottom navigation switches between core tabs', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/');
    await acknowledgeDisclaimer(page);

    await page.getByRole('link', { name: '資產' }).click();
    await expect(page.getByText('總權益（USDT）')).toBeVisible();

    await page.getByRole('link', { name: '設定' }).click();
    await expect(page.getByText('關於 PaperTrade')).toBeVisible();

    await page.getByRole('link', { name: '行情' }).click();
    await expect(page.getByRole('searchbox', { name: '搜尋交易對' })).toBeVisible();
  });
});

test.describe('PWA install identity', () => {
  test('manifest and icons are served with a stable identity', async ({ page, request }) => {
    await mockBybit(page);
    await page.goto('/papertrade/');

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
    const href = await manifestLink.getAttribute('href');
    expect(href).toBeTruthy();
    const manifestUrl = new URL(href!, page.url()).href;

    const response = await request.get(manifestUrl);
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as {
      id?: string;
      scope?: string;
      start_url?: string;
      icons?: { src: string; sizes?: string; purpose?: string }[];
    };

    expect(manifest.id).toBe('/papertrade/');
    expect(manifest.scope).toBe('/papertrade/');
    expect(manifest.start_url).toBe('/papertrade/');

    const icons = manifest.icons ?? [];
    const maskable = icons.find((icon) => icon.purpose === 'maskable');
    expect(icons.length).toBeGreaterThanOrEqual(3);
    expect(maskable).toBeDefined();

    for (const icon of icons) {
      const iconUrl = new URL(icon.src, manifestUrl).href;
      const iconResponse = await request.get(iconUrl);
      expect(iconResponse.status(), `icon ${icon.src} 應可存取`).toBe(200);
    }
  });
});
