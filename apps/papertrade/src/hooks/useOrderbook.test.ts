import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useOrderbook } from './useOrderbook';
import { type MarketSymbol } from '../config/market';

const { subscribeMock } = vi.hoisted(() => ({ subscribeMock: vi.fn() }));

vi.mock('../services/marketWs', () => ({
  marketWs: {
    subscribe: subscribeMock,
    onStatus: vi.fn(() => vi.fn()),
    getStatus: vi.fn(() => 'connected'),
  },
}));

interface Subscription {
  topic: string;
  handler: (message: unknown) => void;
  stop: Mock;
}

const subscriptions: Subscription[] = [];

function snapshot(u: number) {
  return {
    type: 'snapshot',
    data: { s: 'BTCUSDT', b: [['64000', '1']], a: [['64001', '2']], u },
  };
}

function delta(u: number) {
  return { type: 'delta', data: { s: 'BTCUSDT', b: [['64000', '3']], a: [], u } };
}

describe('useOrderbook', () => {
  beforeEach(() => {
    subscriptions.length = 0;
    subscribeMock.mockReset();
    subscribeMock.mockImplementation((topic: string, handler: (message: unknown) => void) => {
      const stop = vi.fn();
      subscriptions.push({ topic, handler, stop });
      return stop;
    });
  });

  it('applies snapshot and consecutive deltas', () => {
    const { result } = renderHook(() => useOrderbook('BTCUSDT'));
    expect(subscriptions[0]?.topic).toBe('orderbook.50.BTCUSDT');

    act(() => subscriptions[0]?.handler(snapshot(100)));
    expect(result.current.bids).toEqual([[64000, 1]]);

    act(() => subscriptions[0]?.handler(delta(101)));
    expect(result.current.bids).toEqual([[64000, 3]]);
  });

  it('resubscribes the topic after a sequence gap', () => {
    const { result } = renderHook(() => useOrderbook('BTCUSDT'));

    act(() => subscriptions[0]?.handler(snapshot(100)));
    act(() => subscriptions[0]?.handler(delta(105)));

    expect(result.current.bids).toEqual([]);
    expect(subscriptions[0]?.stop).toHaveBeenCalledTimes(1);
    expect(subscribeMock).toHaveBeenCalledTimes(2);

    act(() => subscriptions[1]?.handler(snapshot(200)));
    expect(result.current.bids).toEqual([[64000, 1]]);
  });

  it('resets the book when the symbol changes', () => {
    const { result, rerender } = renderHook(({ symbol }) => useOrderbook(symbol), {
      initialProps: { symbol: 'BTCUSDT' as MarketSymbol },
    });
    act(() => subscriptions[0]?.handler(snapshot(100)));
    expect(result.current.bids).toHaveLength(1);

    rerender({ symbol: 'ETHUSDT' });
    expect(result.current.bids).toEqual([]);
    expect(subscriptions[0]?.stop).toHaveBeenCalledTimes(1);
    expect(subscriptions[1]?.topic).toBe('orderbook.50.ETHUSDT');
  });
});
