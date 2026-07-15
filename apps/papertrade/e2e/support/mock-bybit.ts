import { expect, type Page, type WebSocketRoute } from '@playwright/test';

const PRICES: Record<string, number> = { BTCUSDT: 60000, ETHUSDT: 3000 };

export function priceOf(symbol: string): number {
  return PRICES[symbol] ?? 100;
}

export function tickerMessage(symbol: string, price = priceOf(symbol)): string {
  return JSON.stringify({
    topic: `tickers.${symbol}`,
    type: 'snapshot',
    data: {
      symbol,
      lastPrice: String(price),
      markPrice: String(price),
      price24hPcnt: '0.012',
      highPrice24h: String(priceOf(symbol) * 1.05),
      lowPrice24h: String(priceOf(symbol) * 0.95),
      turnover24h: '123456789',
      volume24h: '54321',
    },
  });
}

export function orderbookMessage(topic: string): string {
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

export interface MockMarket {
  // 事後推送 ticker tick，驅動引擎撮合（限價成交／TP／強平）。
  pushTicker: (symbol: string, price: number) => void;
}

export async function mockBybit(page: Page): Promise<MockMarket> {
  await page.route('**/v5/market/kline*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: klineRestBody(new URL(route.request().url())),
    });
  });

  let socket: WebSocketRoute | null = null;
  await page.routeWebSocket(/stream\.bybit\.com/, (ws) => {
    socket = ws;
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

  return {
    pushTicker: (symbol, price) => {
      socket?.send(tickerMessage(symbol, price));
    },
  };
}

export async function acknowledgeDisclaimer(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog', { name: '免責聲明' });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: '我已了解，開始模擬交易' }).click();
  await expect(dialog).toBeHidden();
}
