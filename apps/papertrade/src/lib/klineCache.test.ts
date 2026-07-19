import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYMBOLS, TIMEFRAMES, type TimeframeId } from '../config/market';
import { type Kline } from '../services/kline';
import {
  clearKlineCache,
  getCachedKlines,
  KLINE_CACHE_MAX_KEYS,
  prefetchIdleTimeframes,
  setCachedKlines,
} from './klineCache';

function bar(time: number): Kline {
  return { time, open: 99, high: 101, low: 98, close: 100, volume: 10 };
}

describe('klineCache', () => {
  beforeEach(() => {
    clearKlineCache();
  });

  it('returns undefined on a cache miss and the stored bars on a hit', () => {
    expect(getCachedKlines('BTCUSDT', '60')).toBeUndefined();
    const bars = [bar(60), bar(120)];
    setCachedKlines('BTCUSDT', '60', bars);
    expect(getCachedKlines('BTCUSDT', '60')).toBe(bars);
    expect(getCachedKlines('BTCUSDT', '5')).toBeUndefined();
    expect(getCachedKlines('ETHUSDT', '60')).toBeUndefined();
  });

  it('round-trips 1000 candles in under 5ms', () => {
    const bars = Array.from({ length: 1000 }, (_, index) => bar(index * 60));
    const startedAt = performance.now();
    setCachedKlines('BTCUSDT', '60', bars);
    const cached = getCachedKlines('BTCUSDT', '60');
    const elapsedMs = performance.now() - startedAt;
    expect(cached).toHaveLength(1000);
    expect(elapsedMs).toBeLessThan(5);
  });

  it('evicts the least recently written key beyond capacity', () => {
    const keys: { symbol: (typeof SYMBOLS)[number]; interval: TimeframeId }[] = [];
    for (const symbol of SYMBOLS) {
      for (const timeframe of TIMEFRAMES) {
        keys.push({ symbol, interval: timeframe.id });
      }
    }
    const filler = keys.slice(0, KLINE_CACHE_MAX_KEYS);
    filler.forEach(({ symbol, interval }, index) =>
      setCachedKlines(symbol, interval, [bar(index)]),
    );

    // 重寫第一鍵刷新其新鮮度：容量滿載時應淘汰第二鍵而非第一鍵。
    const first = filler[0]!;
    const second = filler[1]!;
    setCachedKlines(first.symbol, first.interval, [bar(999)]);
    const overflow = keys[KLINE_CACHE_MAX_KEYS]!;
    setCachedKlines(overflow.symbol, overflow.interval, [bar(1000)]);

    expect(getCachedKlines(first.symbol, first.interval)).toEqual([bar(999)]);
    expect(getCachedKlines(second.symbol, second.interval)).toBeUndefined();
    expect(getCachedKlines(overflow.symbol, overflow.interval)).toEqual([bar(1000)]);
  });

  describe('prefetchIdleTimeframes', () => {
    let idleCallbacks: Map<number, () => void>;
    let idleSeq: number;

    // 每測重 stub（不 unstub）：unstubAllGlobals 會連 setupTests 的全域 stub 一併還原。
    beforeEach(() => {
      idleCallbacks = new Map();
      idleSeq = 0;
      vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => {
        idleSeq += 1;
        idleCallbacks.set(idleSeq, () => callback({} as IdleDeadline));
        return idleSeq;
      });
      vi.stubGlobal('cancelIdleCallback', (id: number) => {
        idleCallbacks.delete(id);
      });
    });

    async function flushIdleQueue(): Promise<void> {
      while (idleCallbacks.size > 0) {
        const next = idleCallbacks.entries().next().value;
        if (next === undefined) return;
        idleCallbacks.delete(next[0]);
        next[1]();
        // 以 macrotask 讓 fetcher promise 鏈（then/finally）完整結清，才輪到下一個排程。
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    it('fetches every other timeframe exactly once and writes results to cache', async () => {
      const fetcher = vi.fn((_symbol: string, interval: TimeframeId) =>
        Promise.resolve([bar(Number.parseInt(interval, 10) || 1)]),
      );
      prefetchIdleTimeframes('BTCUSDT', '60', fetcher);
      await flushIdleQueue();

      const others = TIMEFRAMES.map((timeframe) => timeframe.id).filter((id) => id !== '60');
      expect(fetcher).toHaveBeenCalledTimes(others.length);
      for (const interval of others) {
        expect(fetcher).toHaveBeenCalledWith('BTCUSDT', interval);
        expect(getCachedKlines('BTCUSDT', interval)).toHaveLength(1);
      }
      expect(getCachedKlines('BTCUSDT', '60')).toBeUndefined();
    });

    it('skips timeframes that are already cached', async () => {
      setCachedKlines('BTCUSDT', '5', [bar(5)]);
      const fetcher = vi.fn(() => Promise.resolve([bar(1)]));
      prefetchIdleTimeframes('BTCUSDT', '60', fetcher);
      await flushIdleQueue();

      expect(fetcher).not.toHaveBeenCalledWith('BTCUSDT', '5');
      expect(fetcher).toHaveBeenCalledTimes(TIMEFRAMES.length - 2);
    });

    it('runs one request at a time', async () => {
      let inflight = 0;
      let maxInflight = 0;
      const fetcher = vi.fn(async () => {
        inflight += 1;
        maxInflight = Math.max(maxInflight, inflight);
        await Promise.resolve();
        inflight -= 1;
        return [bar(1)];
      });
      prefetchIdleTimeframes('BTCUSDT', '60', fetcher);
      await flushIdleQueue();

      expect(fetcher).toHaveBeenCalledTimes(TIMEFRAMES.length - 1);
      expect(maxInflight).toBe(1);
    });

    it('keeps going silently when a prefetch fails', async () => {
      const fetcher = vi
        .fn((_symbol: string, _interval: TimeframeId) => Promise.resolve([bar(1)]))
        .mockRejectedValueOnce(new Error('boom'));
      prefetchIdleTimeframes('BTCUSDT', '60', fetcher);
      await flushIdleQueue();

      expect(fetcher).toHaveBeenCalledTimes(TIMEFRAMES.length - 1);
      const failedInterval = TIMEFRAMES.map((timeframe) => timeframe.id).find((id) => id !== '60')!;
      expect(getCachedKlines('BTCUSDT', failedInterval)).toBeUndefined();
    });

    it('stops fetching after cancellation', async () => {
      const fetcher = vi.fn(() => Promise.resolve([bar(1)]));
      const cancel = prefetchIdleTimeframes('BTCUSDT', '60', fetcher);
      cancel();
      await flushIdleQueue();

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('cancels mid-queue without issuing further requests', async () => {
      const fetcher = vi.fn(() => Promise.resolve([bar(1)]));
      const cancel = prefetchIdleTimeframes('BTCUSDT', '60', fetcher);

      // 只執行第一個 idle 排程，隨即取消：後續佇列不得再發出請求。
      const next = idleCallbacks.entries().next().value!;
      idleCallbacks.delete(next[0]);
      next[1]();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetcher).toHaveBeenCalledTimes(1);

      cancel();
      await flushIdleQueue();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });
});
