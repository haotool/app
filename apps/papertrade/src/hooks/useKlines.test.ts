import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useKlines, type KlineStatus } from './useKlines';
import { clearKlineCache } from '../lib/klineCache';
import { type MarketSymbol, type TimeframeId } from '../config/market';
import { type Kline } from '../services/kline';
import type * as KlineModule from '../services/kline';

const { fetchKlinesMock, subscribeMock, onStatusMock, getStatusMock } = vi.hoisted(() => ({
  fetchKlinesMock: vi.fn(),
  subscribeMock: vi.fn(),
  onStatusMock: vi.fn(),
  getStatusMock: vi.fn(),
}));

vi.mock('../services/marketWs', () => ({
  marketWs: { subscribe: subscribeMock, onStatus: onStatusMock, getStatus: getStatusMock },
}));

vi.mock('../services/kline', async (importOriginal) => {
  const actual = await importOriginal<typeof KlineModule>();
  return { ...actual, fetchKlines: fetchKlinesMock };
});

function bar(time: number, close = 100): Kline {
  return { time, open: 99, high: 101, low: 98, close, volume: 10 };
}

function wsKlinePayload(startSec: number, close: number) {
  return {
    topic: 'kline.60.BTCUSDT',
    data: [
      {
        start: startSec * 1000,
        open: '99',
        high: '101',
        low: '98',
        close: String(close),
        volume: '10',
        confirm: false,
      },
    ],
  };
}

type StatusHandler = (status: 'idle' | 'connecting' | 'connected' | 'reconnecting') => void;

describe('useKlines', () => {
  let topicHandlers: Map<string, (message: unknown) => void>;
  let stopSpies: Mock[];
  let statusHandlers: Set<StatusHandler>;
  let idleCallbacks: Map<number, () => void>;
  let idleSeq: number;

  function emitStatus(status: Parameters<StatusHandler>[0]) {
    statusHandlers.forEach((handler) => handler(status));
  }

  async function flushIdleQueue(): Promise<void> {
    while (idleCallbacks.size > 0) {
      const next = idleCallbacks.entries().next().value;
      if (next === undefined) return;
      idleCallbacks.delete(next[0]);
      await act(async () => {
        next[1]();
        // 以 macrotask 讓 fetch promise 鏈完整結清，才輪到下一個排程。
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }
  }

  beforeEach(() => {
    clearKlineCache();
    topicHandlers = new Map();
    stopSpies = [];
    statusHandlers = new Set();
    // 攔截 idle 排程：prefetch 只在測試顯式 flush 時執行，避免背景請求污染計數。
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
    subscribeMock.mockReset();
    subscribeMock.mockImplementation((topic: string, handler: (message: unknown) => void) => {
      topicHandlers.set(topic, handler);
      const stop = vi.fn();
      stopSpies.push(stop);
      return stop;
    });
    onStatusMock.mockReset();
    onStatusMock.mockImplementation((handler: StatusHandler) => {
      statusHandlers.add(handler);
      handler('connected');
      return () => statusHandlers.delete(handler);
    });
    getStatusMock.mockReset();
    getStatusMock.mockReturnValue('connected');
    fetchKlinesMock.mockReset();
  });

  it('loads history and flips status to ready', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60), bar(120)]);
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.bars).toHaveLength(2);
    expect(result.current.seriesKey).toBe('BTCUSDT:60');
    expect(fetchKlinesMock).toHaveBeenCalledWith('BTCUSDT', '60', 1000);
    expect(subscribeMock).toHaveBeenCalledWith('kline.60.BTCUSDT', expect.any(Function));
  });

  it('ignores realtime bars until history is loaded', async () => {
    let resolveHistory: (bars: Kline[]) => void = () => undefined;
    fetchKlinesMock.mockImplementation(
      () =>
        new Promise<Kline[]>((resolve) => {
          resolveHistory = resolve;
        }),
    );
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));

    act(() => {
      topicHandlers.get('kline.60.BTCUSDT')?.(wsKlinePayload(180, 105));
    });
    expect(result.current.bars).toHaveLength(0);

    await act(async () => {
      resolveHistory([bar(60), bar(120)]);
      await Promise.resolve();
    });
    expect(result.current.bars).toHaveLength(2);
  });

  it('merges realtime updates into loaded history', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60), bar(120, 100)]);
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => {
      topicHandlers.get('kline.60.BTCUSDT')?.(wsKlinePayload(120, 108));
    });
    expect(result.current.bars).toHaveLength(2);
    expect(result.current.bars.at(-1)?.close).toBe(108);

    act(() => {
      topicHandlers.get('kline.60.BTCUSDT')?.(wsKlinePayload(180, 110));
    });
    expect(result.current.bars).toHaveLength(3);
    expect(result.current.bars.at(-1)?.time).toBe(180);
  });

  it('resubscribes and reloads when interval changes', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60)]);
    const { result, rerender } = renderHook(
      ({ interval }: { interval: '60' | '5' }) => useKlines('BTCUSDT', interval),
      { initialProps: { interval: '60' as '60' | '5' } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    rerender({ interval: '5' });
    expect(stopSpies[0]).toHaveBeenCalledTimes(1);
    expect(subscribeMock).toHaveBeenLastCalledWith('kline.5.BTCUSDT', expect.any(Function));
    expect(fetchKlinesMock).toHaveBeenLastCalledWith('BTCUSDT', '5', 1000);
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('stops subscription on unmount', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60)]);
    const { unmount, result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    unmount();
    expect(stopSpies[0]).toHaveBeenCalledTimes(1);
  });

  it('flips status to error when history request fails', async () => {
    fetchKlinesMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.bars).toHaveLength(0);
  });

  it('refetches history after a reconnect and backfills the gap', async () => {
    fetchKlinesMock.mockResolvedValueOnce([bar(60), bar(120, 100)]);
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(fetchKlinesMock).toHaveBeenCalledTimes(1);

    // 斷線期間漏掉 time=180：重連後應重抓 REST 並回補，序列無空洞。
    fetchKlinesMock.mockResolvedValueOnce([bar(120, 101), bar(180, 105), bar(240, 106)]);
    await act(async () => {
      emitStatus('reconnecting');
      emitStatus('connected');
      await Promise.resolve();
    });

    expect(fetchKlinesMock).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(result.current.bars.map((candle) => candle.time)).toEqual([60, 120, 180, 240]),
    );
    expect(result.current.bars[1]?.close).toBe(101);
  });

  it('does not refetch while the connection stays healthy', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60)]);
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      emitStatus('connected');
      await Promise.resolve();
    });
    expect(fetchKlinesMock).toHaveBeenCalledTimes(1);
  });

  it('recovers from the error state via retry', async () => {
    fetchKlinesMock.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    fetchKlinesMock.mockResolvedValueOnce([bar(60)]);
    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.bars).toHaveLength(1);
  });

  it('serves cached bars with no loading state when returning to a visited timeframe', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60), bar(120)]);
    const statusLog: KlineStatus[] = [];
    const { result, rerender } = renderHook(
      ({ interval }: { interval: TimeframeId }) => {
        const feed = useKlines('BTCUSDT', interval);
        statusLog.push(feed.status);
        return feed;
      },
      { initialProps: { interval: '60' as TimeframeId } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    rerender({ interval: '5' });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    fetchKlinesMock.mockClear();
    statusLog.length = 0;
    rerender({ interval: '60' });

    // 快取命中：切回瞬間即為 ready 且帶完整序列，全程無任何 loading 渲染。
    expect(result.current.status).toBe('ready');
    expect(result.current.bars).toHaveLength(2);
    expect(statusLog).not.toContain('loading');

    // 背景 revalidate 恰好一次。
    await waitFor(() => expect(fetchKlinesMock).toHaveBeenCalledTimes(1));
    expect(fetchKlinesMock).toHaveBeenCalledWith('BTCUSDT', '60', 1000);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(statusLog).not.toContain('loading');
  });

  it('silently refreshes cached bars from the background revalidate', async () => {
    fetchKlinesMock.mockResolvedValueOnce([bar(60), bar(120, 100)]);
    const { result, rerender } = renderHook(
      ({ interval }: { interval: TimeframeId }) => useKlines('BTCUSDT', interval),
      { initialProps: { interval: '60' as TimeframeId } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    fetchKlinesMock.mockResolvedValueOnce([bar(60)]);
    rerender({ interval: '5' });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    // 切回 60：revalidate 取得更新後的序列，靜默套用並回寫快取。
    fetchKlinesMock.mockResolvedValueOnce([bar(60), bar(120, 101), bar(180, 105)]);
    rerender({ interval: '60' });
    expect(result.current.bars.at(-1)?.time).toBe(120);
    await waitFor(() => expect(result.current.bars.at(-1)?.time).toBe(180));
    expect(result.current.bars[1]?.close).toBe(101);
  });

  it('keeps the kline cache fresh from realtime updates', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60), bar(120, 100)]);
    const { result, rerender } = renderHook(
      ({ interval }: { interval: TimeframeId }) => useKlines('BTCUSDT', interval),
      { initialProps: { interval: '60' as TimeframeId } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => {
      topicHandlers.get('kline.60.BTCUSDT')?.(wsKlinePayload(180, 110));
    });
    expect(result.current.bars).toHaveLength(3);

    // 切走再切回：快取序列須含 WS 寫入的最新 bar，非陳舊的 REST 快照。
    fetchKlinesMock.mockClear();
    fetchKlinesMock.mockImplementation(() => new Promise<Kline[]>(() => undefined));
    rerender({ interval: '5' });
    rerender({ interval: '60' });
    expect(result.current.status).toBe('ready');
    expect(result.current.bars).toHaveLength(3);
    expect(result.current.bars.at(-1)?.time).toBe(180);
  });

  it('prefetches the remaining timeframes once after the current one loads', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60)]);
    const { result } = renderHook(() => useKlines('BTCUSDT', '60'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(fetchKlinesMock).toHaveBeenCalledTimes(1);

    await flushIdleQueue();

    // 其餘 6 個 TF 各被預抓一次（含當前共 7 次），且不重抓當前 TF。
    expect(fetchKlinesMock).toHaveBeenCalledTimes(7);
    const prefetchedIntervals = fetchKlinesMock.mock.calls.slice(1).map((call) => call[1]);
    expect([...prefetchedIntervals].sort()).toEqual(['1', '15', '240', '5', 'D', 'W']);

    // 預抓結果已入快取：切換任一 TF 立即 ready。
    fetchKlinesMock.mockClear();
    const { result: nextResult } = renderHook(() => useKlines('BTCUSDT', '15'));
    expect(nextResult.current.status).toBe('ready');
  });

  it('cancels pending prefetch when the symbol changes', async () => {
    fetchKlinesMock.mockResolvedValue([bar(60)]);
    const { result, rerender } = renderHook(
      ({ symbol }: { symbol: MarketSymbol }) => useKlines(symbol, '60'),
      { initialProps: { symbol: 'BTCUSDT' as MarketSymbol } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    // BTC 預抓尚未執行即切換 symbol：佇列必須整批取消。
    rerender({ symbol: 'ETHUSDT' });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await flushIdleQueue();

    const btcPrefetches = fetchKlinesMock.mock.calls.filter(
      (call) => call[0] === 'BTCUSDT' && call[1] !== '60',
    );
    expect(btcPrefetches).toHaveLength(0);
    const ethPrefetches = fetchKlinesMock.mock.calls.filter(
      (call) => call[0] === 'ETHUSDT' && call[1] !== '60',
    );
    expect(ethPrefetches).toHaveLength(6);
  });
});
