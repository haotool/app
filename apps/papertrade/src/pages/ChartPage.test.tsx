import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { routes } from '../routes';
import { useKlines } from '../hooks/useKlines';
import { useMarketStore } from '../stores/marketStore';
import { type Ticker } from '../services/ticker';

vi.mock('../hooks/useKlines', () => ({
  useKlines: vi.fn(() => ({ bars: [], status: 'ready', seriesKey: 'BTCUSDT:60' })),
}));

vi.mock('../components/CandleChart', () => ({
  CandleChart: ({ seriesKey }: { seriesKey: string }) => (
    <div data-testid="candle-chart">{seriesKey}</div>
  ),
}));

vi.mock('../services/marketFeed', () => ({
  startMarketFeed: vi.fn(() => vi.fn()),
}));

const { subscribeMock } = vi.hoisted(() => ({ subscribeMock: vi.fn() }));

vi.mock('../services/marketWs', () => ({
  marketWs: {
    subscribe: subscribeMock,
    onStatus: vi.fn(() => vi.fn()),
    getStatus: vi.fn(() => 'connected'),
  },
}));

const useKlinesMock = useKlines as Mock;

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

function renderChart(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('ChartPage', () => {
  beforeEach(() => {
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    useKlinesMock.mockClear();
    subscribeMock.mockClear();
    subscribeMock.mockImplementation(() => vi.fn());
  });

  it('shows symbol header with live price and stats', async () => {
    useMarketStore.getState().setTicker(btcTicker);
    renderChart('/chart/BTCUSDT');

    expect(await screen.findByRole('heading', { name: /BTC/ })).toBeInTheDocument();
    expect(screen.getByText('64,486.1')).toBeInTheDocument();
    expect(screen.getByText('+3.83%')).toBeInTheDocument();
    expect(screen.getByText('65,000.0')).toBeInTheDocument();
  });

  it('requests klines with default timeframe', async () => {
    renderChart('/chart/BTCUSDT');
    await screen.findByRole('heading', { name: /BTC/ });
    expect(useKlinesMock).toHaveBeenCalledWith('BTCUSDT', '60');
  });

  it('switches timeframe via chips', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    await user.click(await screen.findByRole('tab', { name: '5m' }));
    expect(useKlinesMock).toHaveBeenLastCalledWith('BTCUSDT', '5');
    expect(screen.getByRole('tab', { name: '5m' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps timeframe chips at the 44px touch target minimum', async () => {
    renderChart('/chart/BTCUSDT');
    const tablist = await screen.findByRole('tablist', { name: '時間框架' });
    const chips = within(tablist).getAllByRole('tab');
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(chip).toHaveClass('min-h-11');
    }
  });

  it('redirects invalid symbols back to markets', async () => {
    renderChart('/chart/NOPEUSDT');
    expect(await screen.findByRole('searchbox', { name: '搜尋交易對' })).toBeInTheDocument();
  });

  it('redirects bare /chart to the default symbol', async () => {
    renderChart('/chart');
    await screen.findByRole('heading', { name: /BTC/ });
    expect(useKlinesMock).toHaveBeenCalledWith('BTCUSDT', '60');
  });

  it('renders order book tab and buy/sell CTAs preselecting the pair', async () => {
    renderChart('/chart/BTCUSDT');
    const tablist = await screen.findByRole('tablist', { name: '市場資訊' });
    expect(within(tablist).getByRole('tab', { name: '訂單簿' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('link', { name: '買多' })).toHaveAttribute(
      'href',
      '/trade?symbol=BTCUSDT',
    );
    expect(screen.getByRole('link', { name: '賣空' })).toHaveAttribute(
      'href',
      '/trade?symbol=BTCUSDT',
    );
  });

  it('switches to the recent trades tab and subscribes to publicTrade', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    await user.click(await screen.findByRole('tab', { name: '最新成交' }));
    expect(screen.getByRole('tab', { name: '最新成交' })).toHaveAttribute('aria-selected', 'true');
    expect(subscribeMock).toHaveBeenCalledWith('publicTrade.BTCUSDT', expect.any(Function));
    expect(screen.getByLabelText('最新成交載入中')).toBeInTheDocument();
  });

  it('shows error state when history fails', async () => {
    useKlinesMock.mockReturnValue({ bars: [], status: 'error', seriesKey: 'BTCUSDT:60' });
    renderChart('/chart/BTCUSDT');
    expect(await screen.findByText(/載入失敗/)).toBeInTheDocument();
  });
});
