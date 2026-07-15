import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecentTrades } from './useRecentTrades';
import { type PublicTrade } from '../services/trades';
import type * as TradesModule from '../services/trades';

const { fetchRecentTradesMock, subscribeMock } = vi.hoisted(() => ({
  fetchRecentTradesMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock('../services/marketWs', () => ({
  marketWs: { subscribe: subscribeMock, onStatus: vi.fn(() => vi.fn()), getStatus: vi.fn() },
}));

vi.mock('../services/trades', async (importOriginal) => {
  const actual = await importOriginal<typeof TradesModule>();
  return { ...actual, fetchRecentTrades: fetchRecentTradesMock };
});

function trade(id: string, time: number): PublicTrade {
  return { id, time, side: 'buy', price: 100, size: 1 };
}

function wsTradePayload(id: string, time: number) {
  return {
    topic: 'publicTrade.BTCUSDT',
    data: [{ i: id, T: time, S: 'Buy', p: '100', v: '1' }],
  };
}

describe('useRecentTrades', () => {
  let topicHandlers: Map<string, (message: unknown) => void>;

  beforeEach(() => {
    topicHandlers = new Map();
    subscribeMock.mockReset();
    subscribeMock.mockImplementation((topic: string, handler: (message: unknown) => void) => {
      topicHandlers.set(topic, handler);
      return vi.fn();
    });
    fetchRecentTradesMock.mockReset();
  });

  it('backfills from REST so the list is populated before any live trade', async () => {
    fetchRecentTradesMock.mockResolvedValue([trade('h1', 200), trade('h2', 100)]);

    const { result } = renderHook(() => useRecentTrades('BTCUSDT'));
    expect(result.current).toEqual([]);

    await waitFor(() => {
      expect(result.current.map((item) => item.id)).toEqual(['h1', 'h2']);
    });
    expect(fetchRecentTradesMock).toHaveBeenCalledWith('BTCUSDT', expect.any(Number));
  });

  it('keeps live trades ahead of backfill and dedupes overlapping ids', async () => {
    let resolveFetch: (trades: PublicTrade[]) => void = () => {};
    fetchRecentTradesMock.mockImplementation(
      () =>
        new Promise<PublicTrade[]>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = renderHook(() => useRecentTrades('BTCUSDT'));
    act(() => {
      topicHandlers.get('publicTrade.BTCUSDT')?.(wsTradePayload('live1', 300));
    });
    expect(result.current.map((item) => item.id)).toEqual(['live1']);

    await act(async () => {
      resolveFetch([trade('live1', 300), trade('h1', 200)]);
      await Promise.resolve();
    });
    expect(result.current.map((item) => item.id)).toEqual(['live1', 'h1']);
  });

  it('keeps accumulating live trades when the backfill fails', async () => {
    fetchRecentTradesMock.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useRecentTrades('BTCUSDT'));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      topicHandlers.get('publicTrade.BTCUSDT')?.(wsTradePayload('live1', 300));
    });
    expect(result.current.map((item) => item.id)).toEqual(['live1']);
  });
});
