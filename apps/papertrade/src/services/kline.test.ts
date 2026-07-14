import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchKlines, mergeKline, parseKlineMessage, type Kline } from './kline';

function bar(time: number, close = 100): Kline {
  return { time, open: 99, high: 101, low: 98, close, volume: 10 };
}

describe('fetchKlines', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('parses rows and sorts them oldest first', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          retCode: 0,
          retMsg: 'OK',
          result: {
            symbol: 'BTCUSDT',
            list: [
              ['1784055600000', '64549', '64699.5', '64471.2', '64507.5', '1078.051', '69605861'],
              ['1784052000000', '64601.3', '64634.5', '64450.2', '64549', '1385.182', '89397182'],
            ],
          },
        }),
    });

    const klines = await fetchKlines('BTCUSDT', '60', 2);
    expect(klines).toEqual([
      {
        time: 1784052000,
        open: 64601.3,
        high: 64634.5,
        low: 64450.2,
        close: 64549,
        volume: 1385.182,
      },
      {
        time: 1784055600,
        open: 64549,
        high: 64699.5,
        low: 64471.2,
        close: 64507.5,
        volume: 1078.051,
      },
    ]);

    const requestedUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain('category=linear');
    expect(requestedUrl).toContain('symbol=BTCUSDT');
    expect(requestedUrl).toContain('interval=60');
    expect(requestedUrl).toContain('limit=2');
  });

  it('drops malformed rows', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          retCode: 0,
          result: {
            list: [
              ['1784052000000', '1', '2', '0.5', '1.5', '10', '15'],
              ['not-a-number', '1', '2', '0.5', '1.5', '10', '15'],
              ['1784055600000', '1'],
            ],
          },
        }),
    });

    const klines = await fetchKlines('BTCUSDT', '60', 3);
    expect(klines).toHaveLength(1);
    expect(klines[0]?.time).toBe(1784052000);
  });

  it('throws on HTTP error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchKlines('BTCUSDT', '60', 1)).rejects.toThrow('500');
  });

  it('throws on non-zero retCode', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ retCode: 10001, result: { list: [] } }),
    });
    await expect(fetchKlines('BTCUSDT', '60', 1)).rejects.toThrow('invalid');
  });
});

describe('parseKlineMessage', () => {
  it('parses realtime kline payload', () => {
    const klines = parseKlineMessage({
      topic: 'kline.1.BTCUSDT',
      type: 'snapshot',
      data: [
        {
          start: 1784058060000,
          end: 1784058119999,
          interval: '1',
          open: '64478.3',
          close: '64486.1',
          high: '64486.1',
          low: '64478.3',
          volume: '13.877',
          turnover: '894787.9401',
          confirm: false,
          timestamp: 1784058092594,
        },
      ],
    });

    expect(klines).toEqual([
      {
        time: 1784058060,
        open: 64478.3,
        high: 64486.1,
        low: 64478.3,
        close: 64486.1,
        volume: 13.877,
      },
    ]);
  });

  it('returns empty array for malformed payloads', () => {
    expect(parseKlineMessage({ data: [{ start: 'oops' }] })).toEqual([]);
    expect(parseKlineMessage(null)).toEqual([]);
    expect(parseKlineMessage('kline')).toEqual([]);
  });

  it('drops entries with non-numeric fields', () => {
    const klines = parseKlineMessage({
      data: [
        {
          start: 1784058060000,
          open: 'NaN-ish',
          close: '1',
          high: '1',
          low: '1',
          volume: '1',
          confirm: true,
        },
      ],
    });
    expect(klines).toEqual([]);
  });
});

describe('mergeKline', () => {
  it('appends a newer bar', () => {
    const bars = [bar(100), bar(160)];
    const merged = mergeKline(bars, bar(220, 105));
    expect(merged).toHaveLength(3);
    expect(merged.at(-1)?.time).toBe(220);
  });

  it('replaces the last bar when time matches', () => {
    const bars = [bar(100), bar(160, 100)];
    const merged = mergeKline(bars, bar(160, 108));
    expect(merged).toHaveLength(2);
    expect(merged.at(-1)?.close).toBe(108);
  });

  it('ignores stale bars older than the last one', () => {
    const bars = [bar(100), bar(160)];
    const merged = mergeKline(bars, bar(40));
    expect(merged).toBe(bars);
  });

  it('starts a series from empty history', () => {
    const merged = mergeKline([], bar(100));
    expect(merged).toHaveLength(1);
  });

  it('does not mutate the original array', () => {
    const bars = [bar(100)];
    mergeKline(bars, bar(160));
    expect(bars).toHaveLength(1);
  });
});
