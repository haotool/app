import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../routes';
import { useMarketStore } from '../stores/marketStore';
import type * as klineModule from '../services/kline';

const renderCounts = { chart: 0, orderBook: 0, header: 0 };
const wsHandlers = new Map<string, (message: unknown) => void>();

vi.mock('../components/CandleChart', () => ({
  CandleChart: () => {
    renderCounts.chart += 1;
    return <div data-testid="candle-chart" />;
  },
}));

vi.mock('../components/OrderBookPanel', () => ({
  OrderBookPanel: () => {
    renderCounts.orderBook += 1;
    return <div data-testid="order-book" />;
  },
  CompactOrderBook: () => <div />,
}));

vi.mock('../services/marketFeed', () => ({
  startMarketFeed: vi.fn(() => vi.fn()),
}));

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

vi.mock('../services/kline', async (importOriginal) => {
  const original = await importOriginal<typeof klineModule>();
  return {
    ...original,
    fetchKlines: vi.fn(() =>
      Promise.resolve([{ time: 60, open: 1, high: 2, low: 1, close: 2, volume: 3 }]),
    ),
  };
});

function klineTick(start: number, close: number) {
  return {
    topic: 'kline.60.BTCUSDT',
    data: [
      {
        start,
        open: '1',
        high: '3',
        low: '1',
        close: String(close),
        volume: '5',
        confirm: false,
      },
    ],
  };
}

describe('ChartPage render isolation', () => {
  beforeEach(() => {
    renderCounts.chart = 0;
    renderCounts.orderBook = 0;
    wsHandlers.clear();
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
  });

  it('re-renders only the chart subtree on kline ticks', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/chart/BTCUSDT'] });
    render(<RouterProvider router={router} />);

    await screen.findByTestId('candle-chart');
    await act(async () => {
      await Promise.resolve();
    });

    const chartRendersBefore = renderCounts.chart;
    const orderBookRendersBefore = renderCounts.orderBook;

    act(() => {
      wsHandlers.get('kline.60.BTCUSDT')?.(klineTick(60_000, 2.5));
    });

    expect(renderCounts.chart).toBeGreaterThan(chartRendersBefore);
    expect(renderCounts.orderBook).toBe(orderBookRendersBefore);
  });
});
