import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../routes';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { createInitialAccount } from '../engine/engine';
import { type Ticker } from '../services/ticker';

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

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 60000,
  markPrice: 60000,
  price24hPcnt: 0.01,
  highPrice24h: 61000,
  lowPrice24h: 59000,
  turnover24h: 1000000,
  volume24h: 500,
  fundingRate: -0.0002,
  nextFundingTime: Date.now() + 3_600_000,
};

const ethTicker: Ticker = {
  symbol: 'ETHUSDT',
  lastPrice: 3000,
  markPrice: 3000,
  price24hPcnt: -0.02,
  highPrice24h: 3100,
  lowPrice24h: 2900,
  turnover24h: 500000,
  volume24h: 400,
};

function renderTrade(path = '/trade') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('TradePage', () => {
  beforeEach(() => {
    wsHandlers.clear();
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    useMarketStore.getState().setTicker(btcTicker);
    useMarketStore.getState().setTicker(ethTicker);
  });

  it('preselects the pair from the query string', () => {
    renderTrade('/trade?symbol=ETHUSDT');
    expect(
      screen.getByRole('button', { name: /切換交易對，目前為 ETH\/USDT/ }),
    ).toBeInTheDocument();
  });

  it('syncs the symbol to the query string when switching pairs', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, { initialEntries: ['/trade?symbol=BTCUSDT'] });
    render(<RouterProvider router={router} />);

    await user.click(screen.getByRole('button', { name: /切換交易對，目前為 BTC\/USDT/ }));
    await user.click(screen.getByRole('button', { name: /^ETH/ }));

    expect(router.state.location.search).toBe('?symbol=ETHUSDT');
    expect(
      screen.getByRole('button', { name: /切換交易對，目前為 ETH\/USDT/ }),
    ).toBeInTheDocument();
  });

  it('shows the funding rate with direction color and a countdown', () => {
    renderTrade('/trade?symbol=BTCUSDT');
    expect(screen.getByText('資金費率')).toBeInTheDocument();
    expect(screen.getByText('-0.0200%')).toHaveClass('text-short');
    expect(screen.getByText(/^\d+:\d{2}:\d{2}$|^\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('emphasizes the CTA-preselected side and dims the other', () => {
    renderTrade('/trade?symbol=BTCUSDT&side=short');
    expect(screen.getByRole('button', { name: '買多' })).toHaveClass('opacity-55');
    expect(screen.getByRole('button', { name: '賣空' })).not.toHaveClass('opacity-55');
  });

  it('keeps both side buttons at full emphasis without a side param', () => {
    renderTrade('/trade?symbol=BTCUSDT');
    expect(screen.getByRole('button', { name: '買多' })).not.toHaveClass('opacity-55');
    expect(screen.getByRole('button', { name: '賣空' })).not.toHaveClass('opacity-55');
  });

  it('places a market long order and shows the position card', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '買多' }));

    const { account } = useTradeStore.getState();
    expect(account.positions).toHaveLength(1);
    expect(account.positions[0]?.qty).toBeCloseTo(0.1, 10);
    expect(screen.getByText('目前持倉', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('強平價')).toBeInTheDocument();
  });

  it('shows an inline error when amount is missing', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '買多' }));
    expect(screen.getByRole('alert')).toHaveTextContent('請輸入有效的數量');
    expect(useTradeStore.getState().account.positions).toHaveLength(0);
  });

  it('shows an inline error when balance is insufficient', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '200000');
    await user.click(screen.getByRole('button', { name: '賣空' }));
    expect(screen.getByRole('alert')).toHaveTextContent('可用餘額不足');
  });

  it('adjusts leverage through the sheet', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: /調整槓桿/ }));
    await user.click(screen.getByRole('button', { name: '25x' }));
    await user.click(screen.getByRole('button', { name: '確認' }));

    expect(screen.getByRole('button', { name: /調整槓桿，目前 25 倍/ })).toBeInTheDocument();
  });

  it('places a limit order and cancels it from the order list', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('tab', { name: '限價' }));
    await user.type(screen.getByRole('textbox', { name: '限價（USDT）' }), '58000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '5800');
    await user.click(screen.getByRole('button', { name: '買多' }));

    expect(useTradeStore.getState().account.orders).toHaveLength(1);
    const orderList = screen.getByRole('region', { name: '目前掛單' });
    expect(within(orderList).getByText(/58,000/)).toBeInTheDocument();

    await user.click(within(orderList).getByRole('button', { name: '撤單' }));
    expect(useTradeStore.getState().account.orders).toHaveLength(0);
    expect(useTradeStore.getState().account.balance).toBeCloseTo(10000, 8);
  });

  it('fills the limit price from the order book', async () => {
    const user = userEvent.setup();
    renderTrade();

    act(() => {
      wsHandlers.get('orderbook.50.BTCUSDT')?.({
        type: 'snapshot',
        data: {
          b: [['59900', '1.5']],
          a: [['60100', '2']],
          u: 100,
        },
      });
    });

    await user.click(screen.getByRole('button', { name: /59,900/ }));
    expect(screen.getByRole('tab', { name: '限價' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('59900');
  });

  it('anchors the mid price row between asks and bids and fills the limit price on tap', async () => {
    const user = userEvent.setup();
    renderTrade();

    act(() => {
      wsHandlers.get('orderbook.50.BTCUSDT')?.({
        type: 'snapshot',
        data: {
          b: [['59900', '1.5']],
          a: [['60100', '2']],
          u: 100,
        },
      });
    });

    const bookButtons = within(screen.getByRole('region', { name: '訂單簿' })).getAllByRole(
      'button',
    );
    const labels = bookButtons.map((button) => button.textContent ?? '');
    const askIndex = labels.findIndex((label) => label.includes('60,100'));
    const midIndex = labels.findIndex((label) => label.includes('標記'));
    const bidIndex = labels.findIndex((label) => label.includes('59,900'));
    expect(askIndex).toBeGreaterThanOrEqual(0);
    expect(askIndex).toBeLessThan(midIndex);
    expect(midIndex).toBeLessThan(bidIndex);

    await user.click(screen.getByRole('button', { name: /以最新價 60,000\.0 帶入限價/ }));
    expect(screen.getByRole('tab', { name: '限價' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('60000');
  });

  it('writes the amount from the percent slider', () => {
    renderTrade();

    const slider = screen.getByRole('slider', { name: '數量比例' });
    fireEvent.change(slider, { target: { value: '25' } });

    const input = screen.getByRole('textbox', { name: '數量（USDT）' });
    expect(input).not.toHaveValue('');
    const notional = Number((input as HTMLInputElement).value);
    expect(notional).toBeGreaterThan(20000);
    expect(notional).toBeLessThan(25000);
    expect(slider).toHaveValue('25');
    expect(slider).toHaveAttribute('aria-valuetext', '25%');
  });

  it('reflects manual amount input on the slider position', async () => {
    const user = userEvent.setup();
    renderTrade();

    // maxNotional ≈ 99453：一半金額應顯示 50%。
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '49726');
    const slider = screen.getByRole('slider', { name: '數量比例' });
    expect(slider).toHaveValue('50');
    expect(slider).toHaveAttribute('aria-valuetext', '50%');
  });

  it('clamps the slider at 100% for oversized manual amounts', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '200000');
    expect(screen.getByRole('slider', { name: '數量比例' })).toHaveValue('100');
  });

  it('clears the amount when the slider is dragged back to 0', () => {
    renderTrade();

    const slider = screen.getByRole('slider', { name: '數量比例' });
    fireEvent.change(slider, { target: { value: '50' } });
    fireEvent.change(slider, { target: { value: '0' } });
    expect(screen.getByRole('textbox', { name: '數量（USDT）' })).toHaveValue('');
  });

  it('disables the slider in limit mode until a limit price is entered', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('tab', { name: '限價' }));
    const slider = screen.getByRole('slider', { name: '數量比例' });
    expect(slider).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: '限價（USDT）' }), '58000');
    expect(slider).toBeEnabled();
  });

  it('opens a position deterministically via the 100% slider on a fresh account', async () => {
    const user = userEvent.setup();
    renderTrade();

    fireEvent.change(screen.getByRole('slider', { name: '數量比例' }), {
      target: { value: '100' },
    });
    await user.click(screen.getByRole('button', { name: '買多' }));

    const { account } = useTradeStore.getState();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(account.positions).toHaveLength(1);
    expect(account.balance).toBeGreaterThanOrEqual(0);
  });

  it('sets take profit from the position card sheet', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '買多' }));

    await user.click(screen.getByRole('button', { name: '止盈止損' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '61000');
    await user.click(screen.getByRole('button', { name: '確認' }));

    expect(useTradeStore.getState().account.positions[0]?.takeProfit).toBe(61000);
    expect(screen.getByText(/止盈 61,000/)).toBeInTheDocument();
  });

  it('closes the position via the close sheet', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '買多' }));
    await user.click(screen.getByRole('button', { name: '平倉' }));
    await user.click(screen.getByRole('button', { name: '確認平倉' }));

    const { account } = useTradeStore.getState();
    expect(account.positions).toHaveLength(0);
    expect(account.history).toHaveLength(1);
    expect(account.history[0]?.reason).toBe('manual');
    expect(screen.getByText('尚無持倉')).toBeInTheDocument();
  });

  it('reports the engine-realized pnl in the close toast, not the preview value', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '買多' }));

    act(() => {
      useMarketStore.getState().setTicker({ ...btcTicker, lastPrice: 61000, markPrice: 61000 });
    });

    await user.click(screen.getByRole('button', { name: '平倉' }));
    await user.click(screen.getByRole('button', { name: '確認平倉' }));

    const closeToast = useTradeStore
      .getState()
      .toasts.find((toast) => toast.title.includes('市價平倉成功'));
    expect(closeToast?.description).toBe('+100 USDT');

    const trade = useTradeStore.getState().account.history[0];
    expect(trade?.realizedPnl).toBeCloseTo(100, 8);
  });
});
