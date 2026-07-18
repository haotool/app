import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SYMBOLS } from '../../config/market';
import { parseKlineMessage } from '../../services/kline';
import { applyOrderbookMessage, EMPTY_ORDER_BOOK } from '../../services/orderbook';
import { parseTradeMessage } from '../../services/trades';
import { useMarketStore } from '../../stores/marketStore';
import { isPprSymbol, PPR_SYMBOL, PPR_TICK_INTERVAL_MS } from './config';
import type * as PprConfigModule from './config';
import {
  fetchPprKlines,
  fetchPprRecentTrades,
  fetchPprSparkline,
  pprMarketWs,
  resetPprFeed,
  startPprFeed,
} from './feed';

const { subscribeMock } = vi.hoisted(() => ({ subscribeMock: vi.fn() }));

vi.mock('../../services/marketWs', () => ({
  marketWs: {
    subscribe: subscribeMock,
    onStatus: vi.fn(() => vi.fn()),
    getStatus: vi.fn(() => 'connected'),
  },
}));

describe('isPprSymbol', () => {
  it('flags only the ppr symbol', () => {
    expect(isPprSymbol(PPR_SYMBOL)).toBe(true);
    expect(isPprSymbol('BTCUSDT')).toBe(false);
    expect(isPprSymbol('')).toBe(false);
  });
});

// 引擎（跳躍擴散＋護欄）單元測試見同目錄 engine.test.ts；本檔涵蓋 feed 同形輸出與路由。
describe('ppr feed', () => {
  beforeEach(() => {
    resetPprFeed();
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    subscribeMock.mockReset();
    subscribeMock.mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    resetPprFeed();
    vi.useRealTimers();
  });

  it('serves a coherent 1000-bar kline history for every timeframe', async () => {
    const bars = await fetchPprKlines('60', 1000);
    expect(bars).toHaveLength(1000);
    for (let index = 0; index < bars.length; index += 1) {
      const bar = bars[index]!;
      for (const value of [bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close));
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close));
      if (index > 0) {
        expect(bar.time - bars[index - 1]!.time).toBe(3600);
        expect(bar.open).toBe(bars[index - 1]!.close);
      }
    }
  });

  it('emits kline, orderbook and trade payloads that pass the real bybit parsers', () => {
    vi.useFakeTimers();
    const klineMessages: unknown[] = [];
    const bookMessages: unknown[] = [];
    const tradeMessages: unknown[] = [];
    void fetchPprKlines('60', 10);
    pprMarketWs.subscribe(`kline.60.${PPR_SYMBOL}`, (message) => klineMessages.push(message));
    pprMarketWs.subscribe(`orderbook.50.${PPR_SYMBOL}`, (message) => bookMessages.push(message));
    pprMarketWs.subscribe(`publicTrade.${PPR_SYMBOL}`, (message) => tradeMessages.push(message));

    const stop = startPprFeed();
    // 成交流為機率制輸出：推進 50 tick，涵蓋機率下確定出現成交（0.2^50 可忽略）。
    vi.advanceTimersByTime(PPR_TICK_INTERVAL_MS * 50);
    stop();

    expect(klineMessages.length).toBeGreaterThan(0);
    for (const message of klineMessages) {
      const parsed = parseKlineMessage(message);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]!.close).toBeGreaterThan(0);
    }

    expect(bookMessages.length).toBeGreaterThan(0);
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, bookMessages.at(-1)).book;
    expect(book.bids.length).toBeGreaterThanOrEqual(10);
    expect(book.asks.length).toBeGreaterThanOrEqual(10);
    expect(book.bids[0]![0]).toBeLessThan(book.asks[0]![0]);

    expect(tradeMessages.length).toBeGreaterThan(0);
    const trades = parseTradeMessage(tradeMessages[0]);
    expect(trades.length).toBeGreaterThan(0);
    for (const trade of trades) {
      expect(trade.price).toBeGreaterThan(0);
      expect(trade.size).toBeGreaterThan(0);
    }
  });

  it('writes the synthetic ticker into the shared market store', () => {
    const stop = startPprFeed();
    stop();

    const ticker = useMarketStore.getState().tickers[PPR_SYMBOL];
    expect(ticker).toBeDefined();
    expect(Number.isFinite(ticker!.lastPrice)).toBe(true);
    expect(ticker!.markPrice).toBe(ticker!.lastPrice);
    expect(Number.isFinite(ticker!.fundingRate!)).toBe(true);
  });

  it('serves recent trades and sparkline snapshots', async () => {
    const stop = startPprFeed();
    stop();
    const trades = await fetchPprRecentTrades(30);
    for (const trade of trades) {
      expect(trade.time).toBeGreaterThan(0);
      expect(['buy', 'sell']).toContain(trade.side);
    }
    const closes = await fetchPprSparkline();
    expect(closes.length).toBeGreaterThan(0);
    expect(closes.every((value) => Number.isFinite(value))).toBe(true);
  });
});

describe('market feed routing', () => {
  beforeEach(() => {
    resetPprFeed();
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    subscribeMock.mockReset();
    subscribeMock.mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    resetPprFeed();
  });

  it('never subscribes the ppr symbol on the real bybit ws', async () => {
    const { startMarketFeed } = await import('../../services/marketFeed');
    const stop = startMarketFeed();
    stop();

    const topics = subscribeMock.mock.calls.map((call) => String(call[0]));
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some((topic) => topic.includes(PPR_SYMBOL))).toBe(false);
    for (const symbol of SYMBOLS.filter((entry) => !isPprSymbol(entry))) {
      expect(topics).toContain(`tickers.${symbol}`);
    }
  });

  it('starts the local ppr feed alongside the real feed', async () => {
    const { startMarketFeed } = await import('../../services/marketFeed');
    const stop = startMarketFeed();
    stop();

    expect(useMarketStore.getState().tickers[PPR_SYMBOL]).toBeDefined();
  });
});

describe('PPR_ENABLED flag off', () => {
  afterEach(() => {
    vi.doUnmock('./config');
    vi.resetModules();
  });

  it('hides the ppr symbol from the visible market list', async () => {
    vi.resetModules();
    vi.doMock('./config', async (importOriginal) => {
      const actual = await importOriginal<typeof PprConfigModule>();
      return { ...actual, PPR_ENABLED: false };
    });
    const { filterSymbolsByQuery } = await import('../../lib/symbolSearch');
    const visible = filterSymbolsByQuery('');
    expect(visible).not.toContain(PPR_SYMBOL);
    expect(visible).toContain('BTCUSDT');
  });
});
