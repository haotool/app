import { describe, expect, it } from 'vitest';
import { closeSlice } from '../engine/execution';
import { type Account, type ClosedTrade, type Position } from '../engine/types';
import { computePracticeStats } from './practiceStats';

function trade(overrides: Partial<ClosedTrade>): ClosedTrade {
  return {
    id: 't1',
    symbol: 'BTCUSDT',
    side: 'long',
    qty: 0.1,
    entryPrice: 60000,
    exitPrice: 61000,
    realizedPnl: 100,
    fee: 3.355,
    openFee: 3.3,
    reason: 'manual',
    closedAt: 0,
    ...overrides,
  };
}

describe('computePracticeStats', () => {
  it('returns the empty baseline when there is no history', () => {
    expect(computePracticeStats([])).toEqual({
      totalTrades: 0,
      winRate: 0,
      totalPnl: 0,
      totalFees: 0,
      maxWin: null,
      maxLoss: null,
      profitFactor: null,
    });
  });

  it('aggregates mixed wins and losses', () => {
    const stats = computePracticeStats([
      trade({ id: 'a', realizedPnl: 100 }),
      trade({ id: 'b', realizedPnl: -40, reason: 'sl' }),
      trade({ id: 'c', realizedPnl: 250, reason: 'tp' }),
      trade({ id: 'd', realizedPnl: -160 }),
    ]);

    expect(stats.totalTrades).toBe(4);
    expect(stats.winRate).toBeCloseTo(0.5);
    expect(stats.totalPnl).toBeCloseTo(150);
    expect(stats.totalFees).toBeCloseTo((3.3 + 3.355) * 4);
    expect(stats.maxWin).toBe(250);
    expect(stats.maxLoss).toBe(-160);
    expect(stats.profitFactor).toBeCloseTo(350 / 200);
  });

  it('treats break-even trades as non-wins', () => {
    const stats = computePracticeStats([
      trade({ id: 'a', realizedPnl: 0 }),
      trade({ id: 'b', realizedPnl: 100 }),
    ]);

    expect(stats.winRate).toBeCloseTo(0.5);
    expect(stats.maxLoss).toBeNull();
  });

  it('reports an infinite profit factor when there are wins but no losses', () => {
    const stats = computePracticeStats([trade({ id: 'a', realizedPnl: 100 })]);
    expect(stats.profitFactor).toBe(Infinity);
  });

  it('leaves the profit factor undefined when every trade breaks even', () => {
    const stats = computePracticeStats([trade({ id: 'a', realizedPnl: 0 })]);
    expect(stats.profitFactor).toBeNull();
  });

  it('aggregates engine-produced partial close and liquidation slices', () => {
    const position: Position = {
      id: 'p1',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.2,
      entryPrice: 60000,
      margin: 1200,
      openFee: 12,
      leverage: 10,
      marginMode: 'isolated',
      openedAt: 0,
      takeProfit: null,
      stopLoss: null,
      tpSlCloseRatio: 1,
      trailing: null,
    };
    const account: Account = { balance: 10000, positions: [position], orders: [], history: [] };

    const partial = closeSlice(account, position, 0.1, 61000, 0.0006, 'manual', 1);
    const remaining = partial.account.positions[0];
    if (remaining === undefined) throw new Error('expected remaining position');
    const liquidated = closeSlice(
      partial.account,
      remaining,
      remaining.qty,
      54000,
      0.0006,
      'liquidation',
      2,
    );

    const stats = computePracticeStats(liquidated.account.history);

    expect(stats.totalTrades).toBe(2);
    expect(stats.winRate).toBeCloseTo(0.5);
    expect(stats.totalPnl).toBeCloseTo(100 - 600);
    expect(stats.totalFees).toBeCloseTo(12 + 3.66);
    expect(stats.maxWin).toBeCloseTo(100);
    expect(stats.maxLoss).toBeCloseTo(-600);
    expect(stats.profitFactor).toBeCloseTo(100 / 600);
  });
});
