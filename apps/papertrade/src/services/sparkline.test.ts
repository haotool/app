import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { clearSparklineCache, fetchSparkline } from './sparkline';
import { fetchKlines, type Kline } from './kline';
import { SYMBOLS } from '../config/market';

vi.mock('./kline', () => ({
  fetchKlines: vi.fn(),
}));

const fetchKlinesMock = fetchKlines as Mock;

interface Deferred {
  promise: Promise<Kline[]>;
  resolve: (value: Kline[]) => void;
}

function deferred(): Deferred {
  let resolve!: (value: Kline[]) => void;
  const promise = new Promise<Kline[]>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function kline(close: number): Kline {
  return { time: 60, open: 1, high: 2, low: 1, close, volume: 1 };
}

describe('fetchSparkline', () => {
  beforeEach(() => {
    fetchKlinesMock.mockReset();
    clearSparklineCache();
  });

  it('caps concurrent kline fetches at the configured limit', async () => {
    const deferreds: Deferred[] = [];
    fetchKlinesMock.mockImplementation(() => {
      const entry = deferred();
      deferreds.push(entry);
      return entry.promise;
    });

    const requests = SYMBOLS.map((symbol) => fetchSparkline(symbol));
    expect(fetchKlinesMock).toHaveBeenCalledTimes(3);

    deferreds[0]?.resolve([kline(1)]);
    await requests[0];
    expect(fetchKlinesMock).toHaveBeenCalledTimes(4);

    fetchKlinesMock.mockImplementation(() => Promise.resolve([kline(2)]));
    for (const entry of [...deferreds]) {
      entry.resolve([kline(3)]);
    }
    await Promise.all(requests);
    expect(fetchKlinesMock).toHaveBeenCalledTimes(SYMBOLS.length);
  });

  it('dedupes in-flight requests for the same symbol', async () => {
    const entry = deferred();
    fetchKlinesMock.mockReturnValue(entry.promise);

    const first = fetchSparkline('BTCUSDT');
    const second = fetchSparkline('BTCUSDT');
    expect(fetchKlinesMock).toHaveBeenCalledTimes(1);

    entry.resolve([kline(42)]);
    await expect(first).resolves.toEqual([42]);
    await expect(second).resolves.toEqual([42]);
  });

  it('serves cached closes within the TTL without refetching', async () => {
    fetchKlinesMock.mockResolvedValue([kline(7)]);
    await fetchSparkline('ETHUSDT');
    await expect(fetchSparkline('ETHUSDT')).resolves.toEqual([7]);
    expect(fetchKlinesMock).toHaveBeenCalledTimes(1);
  });
});
