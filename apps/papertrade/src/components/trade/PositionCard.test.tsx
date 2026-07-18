import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { PositionCard } from './PositionCard';
import { createInitialAccount, openMarket } from '../../engine/engine';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { type Position } from '../../engine/types';
import { type Ticker } from '../../services/ticker';

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 61000,
  markPrice: 61000,
  price24hPcnt: 0.01,
  highPrice24h: 61500,
  lowPrice24h: 59000,
  turnover24h: 1000000,
  volume24h: 500,
};

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

describe('PositionCard', () => {
  beforeEach(() => {
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
    useMarketStore.setState({ tickers: {} });
  });

  it('closes the full position at mark with a single tap and reports the realized pnl', async () => {
    const user = userEvent.setup();
    useMarketStore.getState().setTicker(btcTicker);
    const position = seedLongPosition();
    render(<PositionCard position={position} />);

    await user.click(screen.getByRole('button', { name: '平倉' }));

    const { account, toasts } = useTradeStore.getState();
    expect(account.positions).toHaveLength(0);
    expect(account.history).toHaveLength(1);
    expect(account.history[0]?.reason).toBe('manual');
    expect(account.history[0]?.exitPrice).toBe(61000);
    const toast = toasts.find((item) => item.title.includes('市價平倉完成'));
    expect(toast?.tone).toBe('long');
    expect(toast?.description).toContain('+100');
  });

  it('keeps the position and pushes a warning toast when the mark is unavailable', async () => {
    const user = userEvent.setup();
    const position = seedLongPosition();
    render(<PositionCard position={position} />);

    await user.click(screen.getByRole('button', { name: '平倉' }));

    const { account, toasts } = useTradeStore.getState();
    expect(account.positions).toHaveLength(1);
    expect(toasts.some((item) => item.tone === 'warning' && item.title === '平倉失敗')).toBe(true);
  });

  it('opens the partial close sheet from the partial button', async () => {
    const user = userEvent.setup();
    useMarketStore.getState().setTicker(btcTicker);
    const position = seedLongPosition();
    render(<PositionCard position={position} />);

    await user.click(screen.getByRole('button', { name: '部分平倉' }));
    expect(screen.getByRole('dialog', { name: '平倉' })).toBeInTheDocument();
    // 一鍵平倉不彈確認框；部分平倉沿用 CloseSheet 供比例與限價選擇。
    expect(useTradeStore.getState().account.positions).toHaveLength(1);
  });
});
