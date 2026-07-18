import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompactOrderBook } from './OrderBookPanel';
import { useMarketStore } from '../stores/marketStore';

const wsHandlers = new Map<string, (message: unknown) => void>();

vi.mock('../services/marketWs', () => ({
  marketWs: {
    subscribe: vi.fn((topic: string, handler: (message: unknown) => void) => {
      wsHandlers.set(topic, handler);
      return vi.fn();
    }),
    onStatus: vi.fn(() => vi.fn()),
    getStatus: vi.fn(() => 'connected'),
  },
}));

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  observed: Element[] = [];
  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this);
  }
  observe(target: Element): void {
    this.observed.push(target);
  }
  unobserve(): void {}
  disconnect(): void {}
  resize(height: number): void {
    this.callback(
      [{ contentRect: { height } }] as unknown as ResizeObserverEntry[],
      this as unknown as ResizeObserver,
    );
  }
}

const realResizeObserver = global.ResizeObserver;

function pushSnapshot(sideLevels: number) {
  act(() => {
    wsHandlers.get('orderbook.50.BTCUSDT')?.({
      type: 'snapshot',
      data: {
        b: Array.from({ length: sideLevels }, (_, index) => [String(59900 - index * 10), '1.5']),
        a: Array.from({ length: sideLevels }, (_, index) => [String(60100 + index * 10), '2']),
        u: 100,
      },
    });
  });
}

function countLevelRows(): number {
  return within(screen.getByRole('region', { name: '訂單簿' })).getAllByRole('button').length;
}

describe('CompactOrderBook 檔數自適應', () => {
  beforeEach(() => {
    wsHandlers.clear();
    ResizeObserverMock.instances = [];
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    useMarketStore.setState({ tickers: {} });
  });

  afterEach(() => {
    global.ResizeObserver = realResizeObserver;
  });

  it('observes the container during the loading skeleton so the measured height applies to late data', () => {
    render(<CompactOrderBook symbol="BTCUSDT" levels={6} />);
    expect(screen.getByLabelText('訂單簿載入中')).toBeInTheDocument();

    const observer = ResizeObserverMock.instances.at(-1);
    expect(observer).toBeDefined();
    expect(observer?.observed).toHaveLength(1);

    act(() => observer?.resize(412));
    pushSnapshot(6);

    // fitSideLevels(412, 6) = 3 → 單側 3 檔。
    expect(countLevelRows()).toBe(6);
  });

  it('re-fits the visible levels when the container height changes', () => {
    render(<CompactOrderBook symbol="BTCUSDT" levels={6} />);
    pushSnapshot(6);
    expect(countLevelRows()).toBe(12);

    const observer = ResizeObserverMock.instances.at(-1);
    act(() => observer?.resize(412));
    expect(countLevelRows()).toBe(6);

    act(() => observer?.resize(2000));
    expect(countLevelRows()).toBe(12);
  });
});
