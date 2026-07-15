import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './routes';
import { useMarketStore } from './stores/marketStore';
import { useTradeStore } from './stores/tradeStore';
import { createInitialAccount } from './engine/engine';
import { DISCLAIMER_STORAGE_KEY } from './config/trading';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('App shell', () => {
  beforeEach(() => {
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
  });

  it('renders bottom navigation with five tabs', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: '主導覽' });
    expect(nav).toBeInTheDocument();
    for (const label of ['行情', '圖表', '交易', '資產', '設定']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('shows a page-level skeleton on the trade page before market data arrives', () => {
    useMarketStore.setState({ tickers: {}, wsStatus: 'connecting' });
    renderAt('/trade');
    expect(screen.getByLabelText('交易頁載入中')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: '下單表單' })).not.toBeInTheDocument();
  });

  it('renders the trade page with an order form once the ticker is ready', () => {
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    useMarketStore.getState().setTicker({
      symbol: 'BTCUSDT',
      lastPrice: 60000,
      markPrice: 60000,
      price24hPcnt: 0.01,
      highPrice24h: 61000,
      lowPrice24h: 59000,
      turnover24h: 1000000,
      volume24h: 500,
    });
    renderAt('/trade');
    expect(screen.getByRole('form', { name: '下單表單' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '買多' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '賣空' })).toBeInTheDocument();
  });

  it('renders the assets page with equity summary', () => {
    renderAt('/portfolio');
    expect(screen.getByText('總權益（USDT）')).toBeInTheDocument();
    expect(screen.getByText('尚無平倉紀錄')).toBeInTheDocument();
  });

  it('renders settings page with disclaimer', () => {
    renderAt('/settings');
    expect(screen.getByText(/純模擬交易工具/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置模擬資金' })).toBeInTheDocument();
  });

  it('redirects unknown paths to markets page', () => {
    renderAt('/nope');
    expect(screen.getByRole('link', { name: '行情' })).toBeInTheDocument();
  });
});

describe('DisclaimerDialog', () => {
  beforeEach(() => {
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
  });

  it('shows on first visit and remembers acknowledgement', async () => {
    window.localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    const user = userEvent.setup();
    renderAt('/');

    const dialog = screen.getByRole('alertdialog', { name: '免責聲明' });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '我已了解，開始模擬交易' }));
    expect(screen.queryByRole('alertdialog', { name: '免責聲明' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DISCLAIMER_STORAGE_KEY)).toBe('1');
  });

  it('stays hidden once acknowledged', () => {
    renderAt('/');
    expect(screen.queryByRole('alertdialog', { name: '免責聲明' })).not.toBeInTheDocument();
  });
});
