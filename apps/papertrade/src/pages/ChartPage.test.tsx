import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { routes } from '../routes';
import { useKlines } from '../hooks/useKlines';
import { useMarketStore } from '../stores/marketStore';
import { useMarketPrefsStore } from '../stores/marketPrefsStore';
import { type Ticker } from '../services/ticker';
// 預載 lazy 路由模組：避免高負載並行時 chunk transform 吃掉 findBy timeout。
import './ChartPage';

const { retryMock } = vi.hoisted(() => ({ retryMock: vi.fn() }));

vi.mock('../hooks/useKlines', () => ({
  useKlines: vi.fn(() => ({
    bars: [],
    status: 'ready',
    seriesKey: 'BTCUSDT:60',
    retry: retryMock,
  })),
}));

vi.mock('../components/CandleChart', () => ({
  CandleChart: ({
    seriesKey,
    indicators,
    showMacd,
    showTrendLines,
    showSupportResistance,
  }: {
    seriesKey: string;
    indicators: string[];
    showMacd: boolean;
    showTrendLines: boolean;
    showSupportResistance: boolean;
  }) => (
    <div data-testid="candle-chart">
      {`${seriesKey}|${indicators.join(',')}|macd:${showMacd}|trend:${showTrendLines}|sr:${showSupportResistance}`}
    </div>
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
  fundingRate: 0.0001,
  nextFundingTime: Date.now() + 2 * 3_600_000,
  openInterestValue: 32824881841.75,
};

function renderChart(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('ChartPage', () => {
  beforeEach(() => {
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    useMarketPrefsStore.setState({
      favorites: [],
      indicators: [],
      macd: true,
      trendLines: false,
      supportResistance: false,
    });
    useKlinesMock.mockClear();
    useKlinesMock.mockReturnValue({
      bars: [],
      status: 'ready',
      seriesKey: 'BTCUSDT:60',
      retry: retryMock,
    });
    retryMock.mockClear();
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

  it('pads the page root with the top safe-area (R6-1)', async () => {
    useMarketStore.getState().setTicker(btcTicker);
    const { container } = renderChart('/chart/BTCUSDT');

    await screen.findByRole('heading', { name: /BTC/ });
    expect(container.querySelector('section')).toHaveClass('pt-[var(--sat)]');
  });

  it('shows funding rate with direction color, countdown and open interest', async () => {
    useMarketStore.getState().setTicker(btcTicker);
    renderChart('/chart/BTCUSDT');

    await screen.findByRole('heading', { name: /BTC/ });
    expect(screen.getByText('資金費率')).toBeInTheDocument();
    expect(screen.getByText('+0.0100%')).toHaveClass('text-long');
    expect(screen.getByText(/^\d+:\d{2}:\d{2}$|^\d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByText('持倉量')).toBeInTheDocument();
    expect(screen.getByText('32.82B')).toBeInTheDocument();
  });

  it('orders stats with funding rate and open interest first', async () => {
    useMarketStore.getState().setTicker(btcTicker);
    renderChart('/chart/BTCUSDT');

    await screen.findByRole('heading', { name: /BTC/ });
    const labels = screen.getAllByRole('term').map((node) => node.textContent);
    expect(labels).toEqual(['資金費率', '持倉量', '24h高', '24h低', '24h額']);
  });

  it('colors negative funding rates with the short tone', async () => {
    useMarketStore.getState().setTicker({ ...btcTicker, fundingRate: -0.005 });
    renderChart('/chart/BTCUSDT');

    await screen.findByRole('heading', { name: /BTC/ });
    expect(screen.getByText('-0.5000%')).toHaveClass('text-short');
  });

  it('falls back to placeholders when funding fields are missing', async () => {
    useMarketStore.getState().setTicker({
      ...btcTicker,
      fundingRate: undefined,
      nextFundingTime: undefined,
      openInterestValue: undefined,
    });
    renderChart('/chart/BTCUSDT');

    await screen.findByRole('heading', { name: /BTC/ });
    expect(screen.getByText('--:--:--')).toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: '做多' })).toHaveAttribute(
      'href',
      '/trade?symbol=BTCUSDT&side=long',
    );
    expect(screen.getByRole('link', { name: '做空' })).toHaveAttribute(
      'href',
      '/trade?symbol=BTCUSDT&side=short',
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

  it('switches to the depth tab and subscribes to the orderbook feed', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    await user.click(await screen.findByRole('tab', { name: '深度' }));
    expect(screen.getByRole('tab', { name: '深度' })).toHaveAttribute('aria-selected', 'true');
    expect(subscribeMock).toHaveBeenCalledWith('orderbook.50.BTCUSDT', expect.any(Function));
    expect(screen.getByLabelText('深度圖載入中')).toBeInTheDocument();
  });

  it('scrolls the panel back into view when its top is outside the viewport on tab switch', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    const tablist = await screen.findByRole('tablist', { name: '市場資訊' });
    const section = tablist.closest('section')!;
    const scrollSpy = vi.fn();
    section.scrollIntoView = scrollSpy;
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: -120 } as DOMRect);

    await user.click(within(tablist).getByRole('tab', { name: '最新成交' }));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('uses instant scrolling under prefers-reduced-motion', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    const tablist = await screen.findByRole('tablist', { name: '市場資訊' });
    const section = tablist.closest('section')!;
    const scrollSpy = vi.fn();
    section.scrollIntoView = scrollSpy;
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: -120 } as DOMRect);
    (window.matchMedia as Mock).mockImplementationOnce((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await user.click(within(tablist).getByRole('tab', { name: '最新成交' }));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('keeps the viewport still when the panel top is already visible', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    const tablist = await screen.findByRole('tablist', { name: '市場資訊' });
    const section = tablist.closest('section')!;
    const scrollSpy = vi.fn();
    section.scrollIntoView = scrollSpy;

    await user.click(within(tablist).getByRole('tab', { name: '最新成交' }));
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('stops the depth orderbook subscription when switching to the trades tab', async () => {
    const user = userEvent.setup();
    const stops: Mock[] = [];
    subscribeMock.mockImplementation(() => {
      const stop = vi.fn();
      stops.push(stop);
      return stop;
    });
    renderChart('/chart/BTCUSDT');

    // 進深度分頁後，最後一筆訂閱即深度圖的 orderbook feed（訂單簿面板已先卸載）。
    await user.click(await screen.findByRole('tab', { name: '深度' }));
    expect(subscribeMock).toHaveBeenLastCalledWith('orderbook.50.BTCUSDT', expect.any(Function));
    const depthStop = stops.at(-1);
    expect(depthStop).toBeDefined();
    expect(depthStop).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: '最新成交' }));
    expect(depthStop).toHaveBeenCalledTimes(1);
  });

  it('toggles indicator overlays via chips and persists the selection', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    const group = await screen.findByRole('group', { name: '均線指標' });
    const ma7 = within(group).getByRole('button', { name: 'MA7' });
    expect(ma7).toHaveAttribute('aria-pressed', 'false');
    expect(ma7).toHaveClass('min-h-11');
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('BTCUSDT:60|');

    await user.click(ma7);
    expect(ma7).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('BTCUSDT:60|ma7');
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ma7']);

    await user.click(within(group).getByRole('button', { name: 'EMA12' }));
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('BTCUSDT:60|ma7,ema12');

    await user.click(ma7);
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('BTCUSDT:60|ema12');
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ema12']);
  });

  it('enables MACD by default and passes the analysis switches to the chart', async () => {
    renderChart('/chart/BTCUSDT');

    const group = await screen.findByRole('group', { name: '圖表分析' });
    expect(within(group).getByRole('button', { name: 'MACD' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(group).getByRole('button', { name: '趨勢線' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(within(group).getByRole('button', { name: '支撐阻力' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('macd:true|trend:false|sr:false');
  });

  it('toggles the analysis switches via chips and persists them to the store', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    const group = await screen.findByRole('group', { name: '圖表分析' });
    await user.click(within(group).getByRole('button', { name: 'MACD' }));
    await user.click(within(group).getByRole('button', { name: '趨勢線' }));
    await user.click(within(group).getByRole('button', { name: '支撐阻力' }));

    expect(screen.getByTestId('candle-chart')).toHaveTextContent('macd:false|trend:true|sr:true');
    expect(useMarketPrefsStore.getState().macd).toBe(false);
    expect(useMarketPrefsStore.getState().trendLines).toBe(true);
    expect(useMarketPrefsStore.getState().supportResistance).toBe(true);

    await user.click(within(group).getByRole('button', { name: 'MACD' }));
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('macd:true|trend:true|sr:true');
  });

  it('keeps the analysis chips at the 44px touch target minimum', async () => {
    renderChart('/chart/BTCUSDT');
    const group = await screen.findByRole('group', { name: '圖表分析' });
    for (const name of ['MACD', '趨勢線', '支撐阻力']) {
      expect(within(group).getByRole('button', { name })).toHaveClass('min-h-11', 'min-w-11');
    }
  });

  it('keeps the persisted indicators applied after a symbol switch', async () => {
    const user = userEvent.setup();
    useMarketPrefsStore.setState({ favorites: [], indicators: ['ma25'] });
    useMarketStore.getState().setTicker(btcTicker);
    renderChart('/chart/BTCUSDT');

    expect(await screen.findByTestId('candle-chart')).toHaveTextContent('BTCUSDT:60|ma25');

    await user.click(screen.getByRole('button', { name: /切換交易對，目前為 BTC\/USDT/ }));
    const sheet = screen.getByRole('dialog', { name: '選擇交易對' });
    await user.click(within(sheet).getByRole('button', { name: /ETH\/USDT/ }));

    await screen.findByRole('heading', { name: /ETH/ });
    const group = screen.getByRole('group', { name: '均線指標' });
    expect(within(group).getByRole('button', { name: 'MA25' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('candle-chart')).toHaveTextContent('|ma25');
  });

  it('switches symbol via the pair sheet and keeps the current timeframe', async () => {
    const user = userEvent.setup();
    useMarketStore.getState().setTicker(btcTicker);
    renderChart('/chart/BTCUSDT');

    await user.click(await screen.findByRole('tab', { name: '5m' }));
    expect(useKlinesMock).toHaveBeenLastCalledWith('BTCUSDT', '5');

    await user.click(screen.getByRole('button', { name: /切換交易對，目前為 BTC\/USDT/ }));
    const sheet = screen.getByRole('dialog', { name: '選擇交易對' });
    await user.click(within(sheet).getByRole('button', { name: /ETH\/USDT/ }));

    expect(await screen.findByRole('heading', { name: /ETH/ })).toBeInTheDocument();
    expect(useKlinesMock).toHaveBeenLastCalledWith('ETHUSDT', '5');
    expect(screen.getByRole('tab', { name: '5m' })).toHaveAttribute('aria-selected', 'true');
  });

  it('filters the pair sheet list with the search box', async () => {
    const user = userEvent.setup();
    renderChart('/chart/BTCUSDT');

    await user.click(await screen.findByRole('button', { name: /切換交易對/ }));
    const sheet = screen.getByRole('dialog', { name: '選擇交易對' });
    await user.type(within(sheet).getByRole('searchbox', { name: '搜尋交易對' }), 'sol');

    expect(within(sheet).getAllByRole('listitem')).toHaveLength(1);
    expect(within(sheet).getByRole('button', { name: /SOL\/USDT/ })).toBeInTheDocument();
  });

  it('shows error state with a retry button when history fails', async () => {
    const user = userEvent.setup();
    useKlinesMock.mockReturnValue({
      bars: [],
      status: 'error',
      seriesKey: 'BTCUSDT:60',
      retry: retryMock,
    });
    renderChart('/chart/BTCUSDT');
    expect(await screen.findByText(/載入失敗/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '重試' }));
    expect(retryMock).toHaveBeenCalledTimes(1);
  });
});
