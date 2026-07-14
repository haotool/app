import { test, expect, type Page } from '@playwright/test';

const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'BNBUSDT',
  'ADAUSDT',
  'LTCUSDT',
  'LINKUSDT',
  'AVAXUSDT',
];

const PRICES: Record<string, number> = { BTCUSDT: 60000, ETHUSDT: 3000 };

function priceOf(symbol: string): number {
  return PRICES[symbol] ?? 100;
}

function tickerMessage(symbol: string) {
  const price = String(priceOf(symbol));
  return JSON.stringify({
    topic: `tickers.${symbol}`,
    type: 'snapshot',
    data: {
      symbol,
      lastPrice: price,
      markPrice: price,
      price24hPcnt: '0.012',
      highPrice24h: String(priceOf(symbol) * 1.05),
      lowPrice24h: String(priceOf(symbol) * 0.95),
      turnover24h: '123456789',
      volume24h: '54321',
    },
  });
}

function orderbookMessage(topic: string) {
  const symbol = topic.split('.').at(-1) ?? 'BTCUSDT';
  const mid = priceOf(symbol);
  return JSON.stringify({
    topic,
    type: 'snapshot',
    data: {
      s: symbol,
      b: [
        [String(mid * 0.999), '1.5'],
        [String(mid * 0.998), '2.5'],
      ],
      a: [
        [String(mid * 1.001), '1.2'],
        [String(mid * 1.002), '3.1'],
      ],
      u: 100,
    },
  });
}

function klineRestBody(url: URL): string {
  const symbol = url.searchParams.get('symbol') ?? 'BTCUSDT';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '200'), 200);
  const close = priceOf(symbol);
  const now = Math.floor(Date.now() / 60_000) * 60_000;
  const list = Array.from({ length: limit }, (_, index) => {
    const start = now - index * 60_000;
    return [
      String(start),
      String(close * 0.99),
      String(close * 1.01),
      String(close * 0.98),
      String(close),
      '12.5',
      '750000',
    ];
  });
  return JSON.stringify({ retCode: 0, retMsg: 'OK', result: { category: 'linear', symbol, list } });
}

async function mockBybit(page: Page) {
  await page.route('**/v5/market/kline*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: klineRestBody(new URL(route.request().url())),
    });
  });

  await page.routeWebSocket(/stream\.bybit\.com/, (ws) => {
    ws.onMessage((message) => {
      const parsed = JSON.parse(String(message)) as { op?: string; args?: string[] };
      if (parsed.op === 'ping') {
        ws.send(JSON.stringify({ op: 'pong' }));
        return;
      }
      if (parsed.op !== 'subscribe') return;
      for (const topic of parsed.args ?? []) {
        if (topic.startsWith('tickers.')) {
          ws.send(tickerMessage(topic.slice('tickers.'.length)));
        } else if (topic.startsWith('orderbook.')) {
          ws.send(orderbookMessage(topic));
        }
      }
    });
  });
}

async function acknowledgeDisclaimer(page: Page) {
  const dialog = page.getByRole('alertdialog', { name: '免責聲明' });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: '我已了解，開始模擬交易' }).click();
  await expect(dialog).toBeHidden();
}

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
    await expect(page).toHaveURL(/\/papertrade\/trade\?symbol=BTCUSDT$/);

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
