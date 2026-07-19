import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../routes';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { createInitialAccount } from '../engine/engine';
import { DAILY_EQUITY_STORAGE_KEY, localDateKey } from '../lib/dailyEquity';
import { type Ticker } from '../services/ticker';

vi.mock('../services/marketWs', () => ({
  marketWs: {
    subscribe: vi.fn(() => vi.fn()),
    onStatus: vi.fn(() => vi.fn()),
    getStatus: vi.fn(() => 'connected'),
  },
}));

vi.mock('../services/marketFeed', () => ({
  startMarketFeed: vi.fn(() => vi.fn()),
}));

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 61000,
  markPrice: 61000,
  price24hPcnt: 0.01,
  highPrice24h: 62000,
  lowPrice24h: 59000,
  turnover24h: 1000000,
  volume24h: 500,
};

function renderAssets() {
  const router = createMemoryRouter(routes, { initialEntries: ['/portfolio'] });
  return render(<RouterProvider router={router} />);
}

describe('AssetsPage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(DAILY_EQUITY_STORAGE_KEY);
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    useMarketStore.getState().setTicker(btcTicker);
  });

  it('shows live equity composed of available, margin and upnl', () => {
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    renderAssets();

    expect(screen.getByText('9,396.7')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('+100')).toBeInTheDocument();
    expect(screen.getByText('10,096.7')).toBeInTheDocument();
  });

  it('shows the daily change against the stored local-day baseline', () => {
    window.localStorage.setItem(
      DAILY_EQUITY_STORAGE_KEY,
      JSON.stringify({ date: localDateKey(new Date()), equity: 10000 }),
    );
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    renderAssets();

    // equity 10096.7 vs 起始 10000 → +96.7（+0.97%）。
    expect(screen.getByText(/今日變化 \+96\.7（\+0\.97%）/)).toBeInTheDocument();
  });

  it('starts the day at zero change when no baseline exists yet', () => {
    renderAssets();
    // 近零 guard：零變化不帶符號，不得顯示「+0」／「−0.00%」。
    expect(screen.getByText(/今日變化 0\.00（0\.00%）/)).toBeInTheDocument();
    expect(window.localStorage.getItem(DAILY_EQUITY_STORAGE_KEY)).toContain(
      localDateKey(new Date()),
    );
  });

  it('lists closed trades with fee and reason', () => {
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    const positionId = useTradeStore.getState().account.positions[0]?.id;
    if (positionId === undefined) throw new Error('no position');
    useTradeStore.getState().closeMarketOrder({ positionId, fraction: 1, price: 61000 });

    renderAssets();
    const historySection = screen.getByRole('region', { name: '平倉歷史' });
    expect(within(historySection).getByText('+100')).toBeInTheDocument();
    expect(historySection).toHaveTextContent('手動');
    expect(historySection).toHaveTextContent(/手續費 6\.655/);
  });

  it('shows practice stats derived from closed trades', () => {
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    const positionId = useTradeStore.getState().account.positions[0]?.id;
    if (positionId === undefined) throw new Error('no position');
    useTradeStore.getState().closeMarketOrder({ positionId, fraction: 1, price: 61000 });

    renderAssets();
    const statsSection = screen.getByRole('region', { name: '練習統計' });
    expect(within(statsSection).getByText('100.0%')).toBeInTheDocument();
    expect(within(statsSection).getByText('∞')).toBeInTheDocument();
    expect(within(statsSection).getAllByText('+100')).toHaveLength(2);
    expect(statsSection).toHaveTextContent(/總手續費6\.65/);
    expect(statsSection).toHaveTextContent(/\+100 \/ --/);
  });

  it('shows the stats empty state without closed trades', () => {
    renderAssets();
    expect(screen.getByText('尚無統計資料')).toBeInTheDocument();
  });

  it('resets the account after confirmation', async () => {
    const user = userEvent.setup();
    useTradeStore.getState().openMarketOrder({
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    renderAssets();

    await user.click(screen.getByRole('button', { name: '重置模擬資金' }));
    await user.click(screen.getByRole('button', { name: '確認重置' }));

    const { account } = useTradeStore.getState();
    expect(account.balance).toBe(10000);
    expect(account.positions).toEqual([]);
    expect(screen.getByText('尚無平倉紀錄')).toBeInTheDocument();
  });
});
