import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PairSelectorSheet } from './PairSelectorSheet';
import { useMarketStore } from '../../stores/marketStore';
import { type Ticker } from '../../services/ticker';

const rowRenderCounts = new Map<string, number>();

vi.mock('../CoinBadge', () => ({
  CoinBadge: ({ symbol }: { symbol: string }) => {
    rowRenderCounts.set(symbol, (rowRenderCounts.get(symbol) ?? 0) + 1);
    return <span data-testid={`coin-badge-${symbol}`} />;
  },
}));

function ticker(symbol: Ticker['symbol'], lastPrice: number): Ticker {
  return {
    symbol,
    lastPrice,
    markPrice: lastPrice,
    price24hPcnt: 0.01,
    highPrice24h: lastPrice * 1.05,
    lowPrice24h: lastPrice * 0.95,
    turnover24h: 1_000_000,
    volume24h: 500,
  };
}

describe('PairSelectorSheet', () => {
  beforeEach(() => {
    rowRenderCounts.clear();
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
    act(() => {
      useMarketStore.getState().setTicker(ticker('BTCUSDT', 64_000));
      useMarketStore.getState().setTicker(ticker('ETHUSDT', 3_000));
    });
  });

  it('lists pairs with live price and change badge', () => {
    render(<PairSelectorSheet open selected="BTCUSDT" onClose={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText('64,000.0')).toBeInTheDocument();
    expect(screen.getByText('3,000.0')).toBeInTheDocument();
  });

  it('selects a pair and closes the sheet', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<PairSelectorSheet open selected="BTCUSDT" onClose={onClose} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /ETH/ }));
    expect(onSelect).toHaveBeenCalledWith('ETHUSDT');
    expect(onClose).toHaveBeenCalled();
  });

  it('re-renders only the ticked symbol row on a single ticker update', () => {
    render(<PairSelectorSheet open selected="BTCUSDT" onClose={vi.fn()} onSelect={vi.fn()} />);

    const btcRendersBefore = rowRenderCounts.get('BTCUSDT') ?? 0;
    const ethRendersBefore = rowRenderCounts.get('ETHUSDT') ?? 0;

    act(() => {
      useMarketStore.getState().setTicker(ticker('BTCUSDT', 64_100));
    });

    expect(rowRenderCounts.get('BTCUSDT')).toBeGreaterThan(btcRendersBefore);
    expect(rowRenderCounts.get('ETHUSDT')).toBe(ethRendersBefore);
  });
});
