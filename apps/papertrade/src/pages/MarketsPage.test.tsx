import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketsPage } from './MarketsPage';
import { useMarketStore } from '../stores/marketStore';
import { type Ticker } from '../services/ticker';

vi.mock('../services/sparkline', () => ({
  fetchSparkline: vi.fn(() => Promise.resolve([100, 101, 102])),
}));

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 64486.1,
  price24hPcnt: 0.038264,
  highPrice24h: 65000,
  lowPrice24h: 61848,
  turnover24h: 5122660654,
  volume24h: 80648.719,
};

const ethTicker: Ticker = {
  symbol: 'ETHUSDT',
  lastPrice: 3421.55,
  price24hPcnt: -0.0212,
  highPrice24h: 3600,
  lowPrice24h: 3300,
  turnover24h: 2122660654,
  volume24h: 60648.7,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <MarketsPage />
    </MemoryRouter>,
  );
}

describe('MarketsPage', () => {
  beforeEach(() => {
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
  });

  it('lists all ten symbols', () => {
    renderPage();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('shows live price and positive badge for a ticker', () => {
    useMarketStore.getState().setTicker(btcTicker);
    renderPage();

    const row = screen.getByRole('link', { name: /BTC/ });
    expect(within(row).getByText('64,486.1')).toBeInTheDocument();
    expect(within(row).getByText('+3.83%')).toBeInTheDocument();
  });

  it('shows negative badge for falling ticker', () => {
    useMarketStore.getState().setTicker(ethTicker);
    renderPage();

    const row = screen.getByRole('link', { name: /ETH/ });
    expect(within(row).getByText('-2.12%')).toBeInTheDocument();
  });

  it('links each row to its chart page', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /BTC/ })).toHaveAttribute('href', '/chart/BTCUSDT');
  });

  it('filters symbols by search keyword', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'sol');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /SOL/ })).toBeInTheDocument();
  });

  it('filters by full name too', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'dogecoin');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'zzz');
    expect(screen.getByText('找不到符合的交易對')).toBeInTheDocument();
  });
});
