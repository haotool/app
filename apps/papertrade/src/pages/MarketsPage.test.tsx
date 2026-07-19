import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketsPage } from './MarketsPage';
import { SYMBOLS } from '../config/market';
import { useMarketStore } from '../stores/marketStore';
import { useMarketPrefsStore } from '../stores/marketPrefsStore';
import { type Ticker } from '../services/ticker';

vi.mock('../services/sparkline', () => ({
  fetchSparkline: vi.fn(() => Promise.resolve([100, 101, 102])),
}));

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 64486.1,
  markPrice: 64486.1,
  price24hPcnt: 0.038264,
  highPrice24h: 65000,
  lowPrice24h: 61848,
  turnover24h: 5122660654,
  volume24h: 80648.719,
};

const ethTicker: Ticker = {
  symbol: 'ETHUSDT',
  lastPrice: 3421.55,
  markPrice: 3421.55,
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
    useMarketPrefsStore.setState({ favorites: [] });
  });

  it('lists every visible symbol', () => {
    renderPage();
    expect(screen.getAllByRole('listitem')).toHaveLength(SYMBOLS.length);
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
    expect(within(row).getByText('−2.12%')).toBeInTheDocument();
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

  it('shows empty state with a clear-search action when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'zzz');
    expect(screen.getByText('找不到符合的交易對')).toBeInTheDocument();

    const clearCta = screen.getAllByRole('button', { name: '清除搜尋' }).at(-1);
    expect(clearCta).toBeDefined();
    if (clearCta === undefined) throw new Error('missing clear cta');
    await user.click(clearCta);
    expect(screen.getAllByRole('listitem')).toHaveLength(SYMBOLS.length);
  });

  it('toggles a favorite from the row star button', async () => {
    const user = userEvent.setup();
    renderPage();

    const star = screen.getByRole('button', { name: '加入自選 BTC/USDT' });
    expect(star).toHaveAttribute('aria-pressed', 'false');

    await user.click(star);
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT']);
    const active = screen.getByRole('button', { name: '移除自選 BTC/USDT' });
    expect(active).toHaveAttribute('aria-pressed', 'true');

    await user.click(active);
    expect(useMarketPrefsStore.getState().favorites).toEqual([]);
  });

  it('filters the list to favorites on the 自選 tab', async () => {
    const user = userEvent.setup();
    useMarketPrefsStore.setState({ favorites: ['ETHUSDT', 'SOLUSDT'] });
    renderPage();

    await user.click(screen.getByRole('tab', { name: '自選' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /ETH/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SOL/ })).toBeInTheDocument();
  });

  it('searches within favorites on the 自選 tab', async () => {
    const user = userEvent.setup();
    useMarketPrefsStore.setState({ favorites: ['ETHUSDT', 'SOLUSDT'] });
    renderPage();

    await user.click(screen.getByRole('tab', { name: '自選' }));
    await user.type(screen.getByRole('searchbox', { name: '搜尋交易對' }), 'sol');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /SOL/ })).toBeInTheDocument();
  });

  it('shows the watchlist empty state with the design copy', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: '自選' }));
    expect(screen.getByText('輕點星號加入自選')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '全部' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(SYMBOLS.length);
  });
});
