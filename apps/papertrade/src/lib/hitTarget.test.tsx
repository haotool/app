import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../routes';
// 預載 lazy 路由模組：避免高負載並行時 chunk transform 吃掉 findBy timeout。
import '../pages/ChartPage';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { createInitialAccount, openMarket, placeLimitOrder } from '../engine/engine';
import { type Account } from '../engine/types';
import { type Ticker } from '../services/ticker';
import { findHitTargetViolations } from './hitTarget';

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

vi.mock('../services/marketFeed', () => ({
  startMarketFeed: vi.fn(() => vi.fn()),
}));

vi.mock('../services/sparkline', () => ({
  fetchSparkline: vi.fn(() => Promise.resolve([100, 101, 102])),
}));

vi.mock('../hooks/useKlines', () => ({
  useKlines: vi.fn(() => ({ bars: [], status: 'ready', seriesKey: 'BTCUSDT:60' })),
}));

vi.mock('../components/CandleChart', () => ({
  CandleChart: ({ seriesKey }: { seriesKey: string }) => (
    <div data-testid="candle-chart">{seriesKey}</div>
  ),
}));

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 60000,
  markPrice: 60000,
  price24hPcnt: 0.01,
  highPrice24h: 61000,
  lowPrice24h: 59000,
  turnover24h: 1000000,
  volume24h: 500,
};

function seededAccount(): Account {
  const opened = openMarket(createInitialAccount(), {
    symbol: 'BTCUSDT',
    side: 'long',
    qty: 0.1,
    price: 60000,
    leverage: 10,
  });
  if (!opened.ok) throw new Error(opened.error);
  const placed = placeLimitOrder(opened.account, {
    symbol: 'BTCUSDT',
    side: 'long',
    qty: 0.05,
    limitPrice: 58000,
    leverage: 10,
  });
  if (!placed.ok) throw new Error(placed.error);
  return placed.account;
}

function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

function expectNoViolations() {
  expect(findHitTargetViolations(document.body)).toEqual([]);
}

function feedOrderbook() {
  act(() => {
    wsHandlers.get('orderbook.50.BTCUSDT')?.({
      type: 'snapshot',
      data: {
        b: [
          ['59900', '1.5'],
          ['59800', '2'],
        ],
        a: [
          ['60100', '2'],
          ['60200', '1'],
        ],
        u: 100,
      },
    });
  });
}

describe('data-dense-row 顯式豁免', () => {
  it('skips undersized buttons inside a dense-row scope', () => {
    render(
      <ol>
        <li>
          <button type="button" data-dense-row className="h-8 w-full">
            59,900
          </button>
        </li>
        <li>
          <button type="button" className="relative h-8 w-full" data-dense-row>
            60,100
          </button>
        </li>
      </ol>,
    );
    expect(findHitTargetViolations(document.body)).toEqual([]);
  });

  it('skips undersized buttons whose ancestor carries the dense-row scope', () => {
    render(
      <ol data-dense-row>
        <li>
          <button type="button" className="h-8 w-full">
            59,900
          </button>
        </li>
      </ol>,
    );
    expect(findHitTargetViolations(document.body)).toEqual([]);
  });

  it('still reports undersized buttons without the exemption attribute', () => {
    render(
      <button type="button" className="h-8 w-full">
        59,900
      </button>,
    );
    expect(findHitTargetViolations(document.body)).toHaveLength(1);
  });
});

describe('44px 觸控目標防回歸掃蕩', () => {
  beforeEach(() => {
    wsHandlers.clear();
    useTradeStore.setState({ account: seededAccount(), toasts: [] });
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    useMarketStore.getState().setTicker(btcTicker);
  });

  it('markets page has no undersized interactive elements', () => {
    renderRoute('/');
    expectNoViolations();
  });

  it('chart page including tabs and CTAs passes', async () => {
    renderRoute('/chart/BTCUSDT');
    await screen.findByRole('heading', { name: /BTC/ });
    expectNoViolations();
  });

  it('trade page with order book, order list and position card passes', () => {
    renderRoute('/trade');
    feedOrderbook();
    expectNoViolations();
  });

  it('trade page with an active toast passes', () => {
    renderRoute('/trade');
    act(() => {
      useTradeStore.getState().pushToast({ tone: 'long', title: '市價做多已成交' });
    });
    expect(screen.getByRole('button', { name: '關閉通知' })).toBeInTheDocument();
    expectNoViolations();
  });

  it('trade page limit mode, tp/sl fold and margin sheet pass', async () => {
    const user = userEvent.setup();
    renderRoute('/trade');
    feedOrderbook();

    await user.click(screen.getByRole('tab', { name: '限價' }));
    expect(screen.getByRole('button', { name: '帶入買1價' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '帶入賣1價' })).toBeInTheDocument();
    expectNoViolations();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    expect(screen.getByRole('textbox', { name: /止盈價/ })).toBeInTheDocument();
    expectNoViolations();

    await user.click(screen.getByRole('button', { name: '保證金模式說明：逐倉' }));
    expect(screen.getByRole('dialog', { name: '保證金模式' })).toBeInTheDocument();
    expectNoViolations();
  });

  it('pair selector and leverage sheets pass', async () => {
    const user = userEvent.setup();
    renderRoute('/trade');

    await user.click(screen.getByRole('button', { name: /切換交易對/ }));
    expectNoViolations();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: /調整槓桿/ }));
    expectNoViolations();
  });

  it('pair selector with a non-empty query (clear button rendered) passes', async () => {
    const user = userEvent.setup();
    renderRoute('/trade');

    await user.click(screen.getByRole('button', { name: /切換交易對/ }));
    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'btc');
    expect(screen.getByRole('button', { name: '清除搜尋' })).toBeInTheDocument();
    expectNoViolations();
  });

  it('markets page with a non-empty query (clear button rendered) passes', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'btc');
    expect(screen.getByRole('button', { name: '清除搜尋' })).toBeInTheDocument();
    expectNoViolations();
  });

  it('tp/sl, trailing and close sheets pass', async () => {
    const user = userEvent.setup();
    renderRoute('/trade');

    await user.click(screen.getByRole('button', { name: '止盈止損' }));
    expectNoViolations();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: '追蹤' }));
    expectNoViolations();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: '部分平倉' }));
    await user.click(screen.getByRole('tab', { name: '限價平倉' }));
    expectNoViolations();
  });

  it('assets page with history and reset confirmation passes', async () => {
    const user = userEvent.setup();
    const positionId = useTradeStore.getState().account.positions[0]?.id;
    if (positionId === undefined) throw new Error('no position');
    useTradeStore.getState().closeMarketOrder({ positionId, fraction: 0.5, price: 61000 });

    renderRoute('/portfolio');
    expectNoViolations();

    await user.click(screen.getByRole('button', { name: '重置模擬資金' }));
    expectNoViolations();
  });

  it('settings page passes', () => {
    renderRoute('/settings');
    expectNoViolations();
  });
});
