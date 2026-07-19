import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../routes';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { createInitialAccount, openMarket } from '../engine/engine';
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

  it('shows the funding rate/countdown right-aligned below the pills', () => {
    renderTrade('/trade?symbol=BTCUSDT');
    const label = screen.getByText('資金費率/倒數');
    expect(label.parentElement).toHaveClass('ml-auto');
    expect(screen.getByText('-0.0200%')).toHaveClass('text-short');
    expect(screen.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('extends the sticky header into the top safe-area (R6-1)', () => {
    const { container } = renderTrade('/trade?symbol=BTCUSDT');
    expect(container.querySelector('div.sticky')).toHaveClass('top-0', 'pt-[var(--sat)]');
  });

  it('emphasizes the CTA-preselected side and dims the other', () => {
    renderTrade('/trade?symbol=BTCUSDT&side=short');
    expect(screen.getByRole('button', { name: '做多' })).toHaveClass('opacity-55');
    expect(screen.getByRole('button', { name: '做空' })).not.toHaveClass('opacity-55');
  });

  it('keeps both side buttons at full emphasis without a side param', () => {
    renderTrade('/trade?symbol=BTCUSDT');
    expect(screen.getByRole('button', { name: '做多' })).not.toHaveClass('opacity-55');
    expect(screen.getByRole('button', { name: '做空' })).not.toHaveClass('opacity-55');
  });

  it('places a market long order and shows the position card', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    const { account } = useTradeStore.getState();
    expect(account.positions).toHaveLength(1);
    expect(account.positions[0]?.qty).toBeCloseTo(0.1, 10);
    expect(screen.getByRole('region', { name: '持倉' })).toBeInTheDocument();
    expect(screen.getByText('強平價')).toBeInTheDocument();
  });

  it('stacks the positions and open orders blocks with slim empty captions', () => {
    renderTrade();

    const positionSection = screen.getByRole('region', { name: '持倉' });
    const orderSection = screen.getByRole('region', { name: '當前委託' });
    expect(within(positionSection).getByText('尚無持倉')).toBeInTheDocument();
    expect(within(orderSection).getByText('尚無委託')).toBeInTheDocument();
    // 堆疊順序：持倉區在委託區之前。
    expect(
      positionSection.compareDocumentPosition(orderSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows an inline error when amount is missing', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '做多' }));
    expect(screen.getByRole('alert')).toHaveTextContent('請輸入有效的數量');
    expect(useTradeStore.getState().account.positions).toHaveLength(0);
  });

  it('shows an inline error when balance is insufficient', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '200000');
    await user.click(screen.getByRole('button', { name: '做空' }));
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
    await user.click(screen.getByRole('button', { name: '做多' }));

    expect(useTradeStore.getState().account.orders).toHaveLength(1);
    const orderList = screen.getByRole('region', { name: '當前委託' });
    expect(within(orderList).getByText(/58,000/)).toBeInTheDocument();

    await user.click(within(orderList).getByRole('button', { name: '撤單' }));
    expect(useTradeStore.getState().account.orders).toHaveLength(0);
    expect(useTradeStore.getState().account.balance).toBeCloseTo(10000, 8);
  });

  it('rejects a limit order priced outside the mark price band', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('tab', { name: '限價' }));
    await user.type(screen.getByRole('textbox', { name: '限價（USDT）' }), '0.0001');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    expect(screen.getByRole('alert')).toHaveTextContent('限價需在標記價 ±50% 範圍內');
    expect(useTradeStore.getState().account.orders).toHaveLength(0);
    expect(useTradeStore.getState().account.positions).toHaveLength(0);
  });

  it('accepts limit orders exactly at the mark price band boundaries', async () => {
    const user = userEvent.setup();
    renderTrade();

    // mark 60000：下界 30000（做多掛低）與上界 90000（做空掛高）均應放行。
    await user.click(screen.getByRole('tab', { name: '限價' }));
    await user.type(screen.getByRole('textbox', { name: '限價（USDT）' }), '30000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));
    expect(useTradeStore.getState().account.orders).toHaveLength(1);

    await user.clear(screen.getByRole('textbox', { name: '限價（USDT）' }));
    await user.type(screen.getByRole('textbox', { name: '限價（USDT）' }), '90000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做空' }));
    expect(useTradeStore.getState().account.orders).toHaveLength(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: '做多' }));

    const { account } = useTradeStore.getState();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(account.positions).toHaveLength(1);
    expect(account.balance).toBeGreaterThanOrEqual(0);
  });

  it('fills best bid and best ask via the limit quick buttons', async () => {
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

    await user.click(screen.getByRole('tab', { name: '限價' }));
    await user.click(screen.getByRole('button', { name: '帶入買1價' }));
    expect(screen.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('59900');

    await user.click(screen.getByRole('button', { name: '帶入賣1價' }));
    expect(screen.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('60100');
  });

  it('previews margin and taker fee for the entered amount', async () => {
    const user = userEvent.setup();
    renderTrade();

    expect(screen.getByText('保證金')).toBeInTheDocument();
    const feeTerm = screen.getByText('預估手續費（Taker）');
    expect(feeTerm).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    // 6000/10 = 600 保證金；6000×0.00055 = 3.3 taker 手續費。
    expect(screen.getByText('≈ 600 USDT')).toBeInTheDocument();
    expect(screen.getByText('≈ 3.3 USDT')).toBeInTheDocument();
  });

  it('shows placeholders for margin and fee when the amount is empty and maker fee in limit mode', async () => {
    const user = userEvent.setup();
    renderTrade();

    const dl = screen.getByText('保證金').closest('dl');
    expect(dl).not.toBeNull();
    expect(within(dl as HTMLElement).getAllByText('--').length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole('tab', { name: '限價' }));
    expect(screen.getByText('預估手續費（Maker）')).toBeInTheDocument();
  });

  it('switches the margin mode from the header pill sheet (R6-2)', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '保證金模式：逐倉，點擊切換' }));
    const sheet = screen.getByRole('dialog', { name: '保證金模式' });
    expect(within(sheet).getByRole('radio', { name: '逐倉' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await user.click(within(sheet).getByRole('radio', { name: '全倉' }));
    expect(within(sheet).getByText(/全部全倉持倉共享帳戶可用資金/)).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: '關閉' }));

    // pill 文案跟隨選定值；只影響之後新開倉。
    expect(screen.getByRole('button', { name: '保證金模式：全倉，點擊切換' })).toBeInTheDocument();
  });

  it('opens a cross position after selecting the cross margin mode', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '保證金模式：逐倉，點擊切換' }));
    await user.click(screen.getByRole('radio', { name: '全倉' }));
    await user.click(screen.getByRole('button', { name: '關閉' }));

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    const position = useTradeStore.getState().account.positions[0];
    expect(position?.marginMode).toBe('cross');
    // 持倉卡 chip 顯示模式×槓桿。
    expect(screen.getByText(/全倉 10x/)).toBeInTheDocument();
  });

  it('renders the tp/sl section collapsed by default and expands on toggle', async () => {
    const user = userEvent.setup();
    renderTrade();

    const toggle = screen.getByRole('button', { name: '止盈/止損（選填）' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: /止盈價/ })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox', { name: /止盈價/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /止損價/ })).toBeInTheDocument();
  });

  it('clears entered tp/sl on collapse so collapsed values never attach', async () => {
    const user = userEvent.setup();
    renderTrade();

    const toggle = screen.getByRole('button', { name: '止盈/止損（選填）' });
    await user.click(toggle);
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '61000');
    await user.type(screen.getByRole('textbox', { name: /止損價/ }), '59000');
    await user.click(toggle);

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));
    expect(useTradeStore.getState().account.positions[0]?.takeProfit).toBeNull();
    expect(useTradeStore.getState().account.positions[0]?.stopLoss).toBeNull();

    await user.click(toggle);
    expect(screen.getByRole('textbox', { name: /止盈價/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /止損價/ })).toHaveValue('');
  });

  it('resets the amount and tp/sl inputs with their expansion when switching pairs', async () => {
    const user = userEvent.setup();
    renderTrade('/trade?symbol=BTCUSDT');

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '65000');
    await user.type(screen.getByRole('textbox', { name: /止損價/ }), '55000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');

    await user.click(screen.getByRole('button', { name: /切換交易對，目前為 BTC\/USDT/ }));
    await user.click(screen.getByRole('button', { name: /^ETH/ }));

    const toggle = screen.getByRole('button', { name: '止盈/止損（選填）' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: /止盈價/ })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '數量（USDT）' })).toHaveValue('');

    await user.click(toggle);
    expect(screen.getByRole('textbox', { name: /止盈價/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /止損價/ })).toHaveValue('');
  });

  it('opens a market order with tp/sl applied and shown on the position card', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '61000');
    await user.type(screen.getByRole('textbox', { name: /止損價/ }), '59000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    const position = useTradeStore.getState().account.positions[0];
    expect(position?.takeProfit).toBe(61000);
    expect(position?.stopLoss).toBe(59000);
    expect(screen.getByText(/止盈 61,000/)).toBeInTheDocument();
    expect(screen.getByText(/止損 59,000/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an inline error for a wrong-direction tp and keeps the account unchanged', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '59000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    expect(screen.getByRole('alert')).toHaveTextContent('止盈價須優於開倉價（多單高於、空單低於）');
    expect(useTradeStore.getState().account.positions).toHaveLength(0);
    expect(useTradeStore.getState().account.balance).toBe(10000);
  });

  it('shows an inline error for a non-numeric tp input', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), 'abc');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    expect(screen.getByRole('alert')).toHaveTextContent('止盈價須為大於 0 的數字');
  });

  it('attaches tp/sl to a placed limit order', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('tab', { name: '限價' }));
    await user.type(screen.getByRole('textbox', { name: '限價（USDT）' }), '58000');
    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '59000');
    await user.type(screen.getByRole('textbox', { name: /止損價/ }), '57000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '5800');
    await user.click(screen.getByRole('button', { name: '做多' }));

    const order = useTradeStore.getState().account.orders[0];
    expect(order?.takeProfit).toBe(59000);
    expect(order?.stopLoss).toBe(57000);
  });

  it('shows the scale-in hint and submits without form tp/sl for a same-side add', async () => {
    const user = userEvent.setup();
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      tp: 61000,
      sl: 59000,
    });
    if (!opened.ok) throw new Error(opened.error);
    useTradeStore.setState({ account: opened.account });
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    expect(
      screen.getByText('同向加倉（做多）沿用持倉現有止盈止損，本欄不生效；請由持倉卡調整'),
    ).toBeInTheDocument();

    // 相對現價非法的 TP（多單 TP 低於現價）也不得阻擋加倉。
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '59000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const position = useTradeStore.getState().account.positions[0];
    expect(position?.qty).toBeCloseTo(0.2, 10);
    expect(position?.takeProfit).toBe(61000);
    expect(position?.stopLoss).toBe(59000);
  });

  it('binds the scale-in hint wording to the held short side', async () => {
    const user = userEvent.setup();
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    if (!opened.ok) throw new Error(opened.error);
    useTradeStore.setState({ account: opened.account });
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    expect(
      screen.getByText('同向加倉（做空）沿用持倉現有止盈止損，本欄不生效；請由持倉卡調整'),
    ).toBeInTheDocument();
  });

  it('re-validates form tp/sl when submitting the opposite side of the held position', async () => {
    const user = userEvent.setup();
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
    });
    if (!opened.ok) throw new Error(opened.error);
    useTradeStore.setState({ account: opened.account });
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '61000');
    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做空' }));

    expect(screen.getByRole('alert')).toHaveTextContent('止盈價須優於開倉價（多單高於、空單低於）');
  });

  it('shows the limit-fill tp/sl caption only in limit mode without a hint on a fresh account', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    expect(screen.queryByText(/沿用持倉現有止盈止損/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('限價更優成交後，請以實際開倉價檢視止盈止損'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '限價' }));
    expect(screen.getByText('限價更優成交後，請以實際開倉價檢視止盈止損')).toBeInTheDocument();
  });

  it('opens via the 100% slider combined with tp/sl without rejection', async () => {
    const user = userEvent.setup();
    renderTrade();

    fireEvent.change(screen.getByRole('slider', { name: '數量比例' }), {
      target: { value: '100' },
    });
    await user.click(screen.getByRole('button', { name: '止盈/止損（選填）' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '61000');
    await user.type(screen.getByRole('textbox', { name: /止損價/ }), '59000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    const position = useTradeStore.getState().account.positions[0];
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(position?.takeProfit).toBe(61000);
    expect(position?.stopLoss).toBe(59000);
  });

  it('sets take profit from the position card sheet', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    await user.click(screen.getByRole('button', { name: '止盈止損' }));
    await user.type(screen.getByRole('textbox', { name: /止盈價/ }), '61000');
    await user.click(screen.getByRole('button', { name: '確認' }));

    expect(useTradeStore.getState().account.positions[0]?.takeProfit).toBe(61000);
    expect(screen.getByText(/止盈 61,000/)).toBeInTheDocument();
  });

  it('closes the full position with the one-tap close button, no confirmation sheet', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));
    await user.click(screen.getByRole('button', { name: '市價全平' }));

    const { account } = useTradeStore.getState();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(account.positions).toHaveLength(0);
    expect(account.history).toHaveLength(1);
    expect(account.history[0]?.reason).toBe('manual');
    expect(screen.getByText('尚無持倉')).toBeInTheDocument();
  });

  it('closes via the partial close sheet from the partial button', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));
    await user.click(screen.getByRole('button', { name: '部分平倉' }));
    await user.click(screen.getByRole('button', { name: '確認平倉' }));

    const { account } = useTradeStore.getState();
    expect(account.positions).toHaveLength(0);
    expect(account.history).toHaveLength(1);
    expect(account.history[0]?.reason).toBe('manual');
  });

  it('reports the engine-realized pnl in the close toast, not the preview value', async () => {
    const user = userEvent.setup();
    renderTrade();

    await user.type(screen.getByRole('textbox', { name: '數量（USDT）' }), '6000');
    await user.click(screen.getByRole('button', { name: '做多' }));

    act(() => {
      useMarketStore.getState().setTicker({ ...btcTicker, lastPrice: 61000, markPrice: 61000 });
    });

    await user.click(screen.getByRole('button', { name: '市價全平' }));

    const closeToast = useTradeStore
      .getState()
      .toasts.find((toast) => toast.title.includes('市價平倉完成'));
    expect(closeToast?.description).toBe('+100 USDT');

    const trade = useTradeStore.getState().account.history[0];
    expect(trade?.realizedPnl).toBeCloseTo(100, 8);
  });
});
