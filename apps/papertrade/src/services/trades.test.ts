import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  backfillTrades,
  fetchRecentTrades,
  mergeTrades,
  parseTradeMessage,
  type PublicTrade,
} from './trades';

const message = {
  topic: 'publicTrade.BTCUSDT',
  type: 'snapshot',
  data: [
    { i: 'a1', T: 1700000000000, S: 'Buy', p: '64486.10', v: '0.005', s: 'BTCUSDT' },
    { i: 'a2', T: 1700000000100, S: 'Sell', p: '64486.00', v: '0.120', s: 'BTCUSDT' },
  ],
};

describe('parseTradeMessage', () => {
  it('parses buy and sell trades', () => {
    const trades = parseTradeMessage(message);
    expect(trades).toEqual<PublicTrade[]>([
      { id: 'a1', time: 1700000000000, side: 'buy', price: 64486.1, size: 0.005 },
      { id: 'a2', time: 1700000000100, side: 'sell', price: 64486, size: 0.12 },
    ]);
  });

  it('returns empty array for malformed payloads', () => {
    expect(parseTradeMessage(null)).toEqual([]);
    expect(parseTradeMessage({ data: [{ i: 'x' }] })).toEqual([]);
  });

  it('drops rows with non-numeric price or size', () => {
    const trades = parseTradeMessage({
      data: [
        { i: 'ok', T: 1, S: 'Buy', p: '100', v: '1' },
        { i: 'bad', T: 2, S: 'Sell', p: 'oops', v: '1' },
      ],
    });
    expect(trades).toHaveLength(1);
    expect(trades[0]?.id).toBe('ok');
  });
});

describe('mergeTrades', () => {
  const existing: PublicTrade[] = [{ id: 'old', time: 1, side: 'buy', price: 100, size: 1 }];

  it('prepends incoming trades newest first', () => {
    const incoming = parseTradeMessage(message);
    const merged = mergeTrades(existing, incoming, 10);
    expect(merged.map((trade) => trade.id)).toEqual(['a2', 'a1', 'old']);
  });

  it('caps the list at the limit', () => {
    const incoming = parseTradeMessage(message);
    const merged = mergeTrades(existing, incoming, 2);
    expect(merged).toHaveLength(2);
    expect(merged.map((trade) => trade.id)).toEqual(['a2', 'a1']);
  });

  it('returns the same reference when nothing arrives', () => {
    expect(mergeTrades(existing, [], 10)).toBe(existing);
  });

  it('dedupes by id when the WS repeats trades already backfilled from REST', () => {
    // REST-first 競態：REST 回填先落地，WS 隨後推送同 execId。
    const restFilled: PublicTrade[] = [
      { id: 'e1', time: 300, side: 'buy', price: 101, size: 1 },
      { id: 'e2', time: 200, side: 'sell', price: 100, size: 2 },
    ];
    const incoming = parseTradeMessage({
      data: [{ i: 'e1', T: 300, S: 'Buy', p: '101', v: '1' }],
    });

    const merged = mergeTrades(restFilled, incoming, 10);
    expect(merged.map((trade) => trade.id)).toEqual(['e1', 'e2']);
  });

  it('keeps the incoming version of a duplicated id and caps at the limit', () => {
    const restFilled: PublicTrade[] = [
      { id: 'e1', time: 300, side: 'buy', price: 101, size: 1 },
      { id: 'e2', time: 200, side: 'sell', price: 100, size: 2 },
      { id: 'e3', time: 100, side: 'buy', price: 99, size: 3 },
    ];
    const incoming: PublicTrade[] = [{ id: 'e2', time: 200, side: 'sell', price: 100.5, size: 9 }];

    const merged = mergeTrades(restFilled, incoming, 2);
    expect(merged.map((trade) => trade.id)).toEqual(['e2', 'e1']);
    expect(merged[0]?.size).toBe(9);
  });
});

describe('backfillTrades', () => {
  const wsAccumulated: PublicTrade[] = [
    { id: 'w2', time: 400, side: 'sell', price: 101, size: 2 },
    { id: 'w1', time: 300, side: 'buy', price: 100, size: 1 },
  ];

  it('appends history after live trades and dedupes by id', () => {
    const history: PublicTrade[] = [
      { id: 'w1', time: 300, side: 'buy', price: 100, size: 1 },
      { id: 'h1', time: 200, side: 'sell', price: 99, size: 3 },
      { id: 'h2', time: 100, side: 'buy', price: 98, size: 4 },
    ];
    const merged = backfillTrades(wsAccumulated, history, 10);
    expect(merged.map((trade) => trade.id)).toEqual(['w2', 'w1', 'h1', 'h2']);
  });

  it('caps the merged list at the limit', () => {
    const history: PublicTrade[] = [
      { id: 'h1', time: 200, side: 'sell', price: 99, size: 3 },
      { id: 'h2', time: 100, side: 'buy', price: 98, size: 4 },
    ];
    expect(backfillTrades(wsAccumulated, history, 3)).toHaveLength(3);
  });
});

describe('fetchRecentTrades', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(body: unknown, ok = true) {
    const fetchMock = vi.fn<(input: string | URL) => Promise<unknown>>(() =>
      Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) }),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('fetches and parses recent trades newest first', async () => {
    const fetchMock = stubFetch({
      retCode: 0,
      result: {
        list: [
          { execId: 'e1', price: '64000.5', size: '0.01', side: 'Buy', time: '1700000000200' },
          { execId: 'e2', price: '64000.0', size: '0.20', side: 'Sell', time: '1700000000100' },
        ],
      },
    });

    const trades = await fetchRecentTrades('BTCUSDT', 30);
    expect(trades).toEqual<PublicTrade[]>([
      { id: 'e1', time: 1700000000200, side: 'buy', price: 64000.5, size: 0.01 },
      { id: 'e2', time: 1700000000100, side: 'sell', price: 64000, size: 0.2 },
    ]);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/v5/market/recent-trade?');
    expect(url).toContain('category=linear');
    expect(url).toContain('symbol=BTCUSDT');
    expect(url).toContain('limit=30');
  });

  it('throws on non-ok response', async () => {
    stubFetch({}, false);
    await expect(fetchRecentTrades('BTCUSDT', 30)).rejects.toThrow();
  });

  it('throws on invalid payload or retCode', async () => {
    stubFetch({ retCode: 10001, result: { list: [] } });
    await expect(fetchRecentTrades('BTCUSDT', 30)).rejects.toThrow();
  });

  it('drops rows with non-numeric fields', async () => {
    stubFetch({
      retCode: 0,
      result: {
        list: [
          { execId: 'ok', price: '100', size: '1', side: 'Buy', time: '1700000000000' },
          { execId: 'bad', price: 'oops', size: '1', side: 'Sell', time: '1700000000001' },
        ],
      },
    });
    const trades = await fetchRecentTrades('BTCUSDT', 30);
    expect(trades.map((trade) => trade.id)).toEqual(['ok']);
  });
});
