import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useKlines } from './useKlines';
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

  function emitStatus(status: Parameters<StatusHandler>[0]) {
    statusHandlers.forEach((handler) => handler(status));
  }

  beforeEach(() => {
    topicHandlers = new Map();
    stopSpies = [];
    statusHandlers = new Set();
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
});
