import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TpSlSheet } from './TpSlSheet';
import { createInitialAccount, openMarket } from '../../engine/engine';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { type Position } from '../../engine/types';
import { type Ticker } from '../../services/ticker';

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

// 10x 多單 0.1 BTC @ 60000：保證金 600，+50% ROE 對應觸發價 63000。
function seedLongPosition(): Position {
  const opened = openMarket(createInitialAccount(), {
    symbol: 'BTCUSDT',
    side: 'long',
    qty: 0.1,
    price: 60000,
    leverage: 10,
  });
  if (!opened.ok) throw new Error(opened.error);
  useTradeStore.setState({ account: opened.account, toasts: [] });
  const position = opened.account.positions[0];
  if (position === undefined) throw new Error('no position');
  return position;
}

function renderSheet(position: Position) {
  return render(<TpSlSheet open position={position} onClose={vi.fn()} />);
}

describe('TpSlSheet', () => {
  beforeEach(() => {
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
    useMarketStore.setState({ tickers: {} });
    useMarketStore.getState().setTicker(btcTicker);
  });

  it('converts a roe input into the matching price and pnl (three-way sync)', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    renderSheet(position);

    const tpTabs = screen.getByRole('tablist', { name: '止盈輸入模式' });
    await user.click(screen.getAllByRole('tab', { name: '收益率%' })[0]!);
    expect(tpTabs).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: '止盈收益率（%）' }), '50');
    expect(screen.getByText(/觸發價 63,000\.0/)).toBeInTheDocument();
    expect(screen.getByText(/預估損益 \+300 USDT（ROE \+50\.00%）/)).toBeInTheDocument();

    // 切回價格 chip：輸入框應回填換算後的觸發價。
    await user.click(screen.getAllByRole('tab', { name: '價格' })[0]!);
    expect(screen.getByRole('textbox', { name: '止盈價格（USDT）' })).toHaveValue('63000');

    // 切到收益額 chip：輸入框應回填 +300。
    await user.click(screen.getAllByRole('tab', { name: '收益額' })[0]!);
    expect(screen.getByRole('textbox', { name: '止盈收益額（USDT）' })).toHaveValue('300');
  });

  it('writes back all values from the roe quick-set slider', () => {
    const position = seedLongPosition();
    renderSheet(position);

    fireEvent.change(screen.getByRole('slider', { name: '止盈收益率快設' }), {
      target: { value: '50' },
    });
    expect(screen.getByRole('textbox', { name: '止盈價格（USDT）' })).toHaveValue('63000');
    expect(screen.getByText(/預估損益 \+300 USDT/)).toBeInTheDocument();
  });

  it('submits a partial-scope tp/sl with the selected close ratio', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    renderSheet(position);

    await user.click(screen.getByRole('tab', { name: '部分' }));
    await user.click(screen.getByRole('button', { name: '50%' }));
    await user.type(screen.getByRole('textbox', { name: '止盈價格（USDT）' }), '61000');
    await user.click(screen.getByRole('button', { name: '確認' }));

    const updated = useTradeStore.getState().account.positions[0];
    expect(updated?.takeProfit).toBe(61000);
    expect(updated?.stopLoss).toBeNull();
    expect(updated?.tpSlCloseRatio).toBe(0.5);
  });

  it('scales the pnl preview with the partial close ratio', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    renderSheet(position);

    await user.type(screen.getByRole('textbox', { name: '止盈價格（USDT）' }), '63000');
    expect(screen.getByText(/預估損益 \+300 USDT（ROE \+50\.00%）/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '部分' }));
    await user.click(screen.getByRole('button', { name: '50%' }));
    // 同觸發價下，平一半數量的預估損益減半、ROE 不變。
    expect(screen.getByText(/預估損益 \+150 USDT（ROE \+50\.00%）/)).toBeInTheDocument();
  });

  it('blocks a wrong-direction tp with an inline error and a disabled submit', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    renderSheet(position);

    await user.type(screen.getByRole('textbox', { name: '止盈價格（USDT）' }), '59000');
    expect(screen.getByRole('alert')).toHaveTextContent('止盈價須優於開倉價（多單高於、空單低於）');
    expect(screen.getByRole('button', { name: '確認' })).toBeDisabled();

    const untouched = useTradeStore.getState().account.positions[0];
    expect(untouched?.takeProfit).toBeNull();
  });

  it('blocks a dead-zone sl beyond the liquidation price (issue 781)', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    renderSheet(position);

    // 10x 多單 @60000 強平 54300：SL 54000 落在死區，強平必先觸發。
    await user.type(screen.getByRole('textbox', { name: '止損價格（USDT）' }), '54000');
    expect(screen.getByRole('alert')).toHaveTextContent(/已越過強平價 54,300/);
    expect(screen.getByRole('button', { name: '確認' })).toBeDisabled();

    const untouched = useTradeStore.getState().account.positions[0];
    expect(untouched?.stopLoss).toBeNull();
  });

  it('accepts an sl between the liquidation price and the entry', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    renderSheet(position);

    await user.type(screen.getByRole('textbox', { name: '止損價格（USDT）' }), '55000');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '確認' }));

    const updated = useTradeStore.getState().account.positions[0];
    expect(updated?.stopLoss).toBe(55000);
  });

  it('clears an existing tp/sl by submitting empty inputs', async () => {
    const user = userEvent.setup();
    seedLongPosition();
    const withTpSl = useTradeStore
      .getState()
      .setPositionTpSl(useTradeStore.getState().account.positions[0]?.id ?? '', 61000, 59000);
    expect(withTpSl.ok).toBe(true);
    const position = useTradeStore.getState().account.positions[0];
    if (position === undefined) throw new Error('no position');
    renderSheet(position);

    await user.clear(screen.getByRole('textbox', { name: '止盈價格（USDT）' }));
    await user.clear(screen.getByRole('textbox', { name: '止損價格（USDT）' }));
    await user.click(screen.getByRole('button', { name: '確認' }));

    const cleared = useTradeStore.getState().account.positions[0];
    expect(cleared?.takeProfit).toBeNull();
    expect(cleared?.stopLoss).toBeNull();
  });
});
