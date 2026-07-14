import { describe, expect, it } from 'vitest';
import {
  cancelOrder,
  closePositionMarket,
  createInitialAccount,
  getAccountMetrics,
  openMarket,
  placeCloseLimit,
  placeLimitOrder,
  processTick,
  setStopLoss,
  setTakeProfit,
  setTrailingStop,
} from './engine';
import { type Account, type Position } from './types';
import { INITIAL_BALANCE_USDT } from '../config/trading';

const NOW = 1_800_000_000_000;

function openLong(account: Account, qty = 0.1, price = 60000, leverage = 10) {
  const result = openMarket(account, {
    symbol: 'BTCUSDT',
    side: 'long',
    qty,
    price,
    leverage,
    now: NOW,
  });
  if (!result.ok) throw new Error(`open failed: ${result.error}`);
  return result.account;
}

function onlyPosition(account: Account): Position {
  const position = account.positions[0];
  if (position === undefined) throw new Error('no position');
  return position;
}

describe('createInitialAccount', () => {
  it('starts with 10,000 USDT and empty books', () => {
    const account = createInitialAccount();
    expect(account.balance).toBe(INITIAL_BALANCE_USDT);
    expect(account.positions).toEqual([]);
    expect(account.orders).toEqual([]);
    expect(account.history).toEqual([]);
  });
});

describe('openMarket', () => {
  it('deducts margin plus taker fee and creates a position', () => {
    const account = openLong(createInitialAccount());
    expect(account.balance).toBeCloseTo(10000 - 600 - 3.3, 8);

    const position = onlyPosition(account);
    expect(position.symbol).toBe('BTCUSDT');
    expect(position.side).toBe('long');
    expect(position.qty).toBe(0.1);
    expect(position.entryPrice).toBe(60000);
    expect(position.margin).toBe(600);
    expect(position.leverage).toBe(10);
    expect(position.openedAt).toBe(NOW);
  });

  it('rejects when balance cannot cover margin plus fee', () => {
    const result = openMarket(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 1,
      price: 60000,
      leverage: 5,
    });
    expect(result).toEqual({ ok: false, error: 'insufficient-balance' });
  });

  it('rejects below minimum notional', () => {
    const result = openMarket(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.00001,
      price: 60000,
      leverage: 10,
    });
    expect(result).toEqual({ ok: false, error: 'below-min-notional' });
  });

  it('rejects invalid leverage and qty and price', () => {
    const account = createInitialAccount();
    const base = { symbol: 'BTCUSDT', side: 'long', qty: 0.1, price: 60000 } as const;
    expect(openMarket(account, { ...base, leverage: 0 })).toEqual({
      ok: false,
      error: 'invalid-leverage',
    });
    expect(openMarket(account, { ...base, leverage: 126 })).toEqual({
      ok: false,
      error: 'invalid-leverage',
    });
    expect(openMarket(account, { ...base, qty: 0, leverage: 10 })).toEqual({
      ok: false,
      error: 'invalid-qty',
    });
    expect(openMarket(account, { ...base, qty: 0.1, price: 0, leverage: 10 })).toEqual({
      ok: false,
      error: 'invalid-price',
    });
  });

  it('merges same-symbol same-side positions with weighted average entry', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    account = openLong(account, 0.1, 62000, 10);

    const position = onlyPosition(account);
    expect(position.qty).toBeCloseTo(0.2, 10);
    expect(position.entryPrice).toBeCloseTo(61000, 8);
    expect(position.margin).toBeCloseTo(1220, 8);
    expect(position.leverage).toBeCloseTo(10, 8);
    expect(account.positions).toHaveLength(1);
  });

  it('reduces the opposite position first', () => {
    let account = openLong(createInitialAccount(), 0.2, 61000, 10);
    const balanceBefore = account.balance;

    const result = openMarket(account, {
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 62000,
      leverage: 10,
      now: NOW,
    });
    if (!result.ok) throw new Error(result.error);
    account = result.account;

    const position = onlyPosition(account);
    expect(position.side).toBe('long');
    expect(position.qty).toBeCloseTo(0.1, 10);
    expect(position.margin).toBeCloseTo(610, 8);
    expect(account.balance).toBeCloseTo(balanceBefore + 610 + 100 - 3.41, 8);

    const trade = account.history[0];
    expect(trade?.side).toBe('long');
    expect(trade?.qty).toBeCloseTo(0.1, 10);
    expect(trade?.exitPrice).toBe(62000);
    expect(trade?.realizedPnl).toBeCloseTo(100, 8);
    expect(trade?.reason).toBe('manual');
  });

  it('flips to the opposite side when reduce qty exceeds position', () => {
    let account = openLong(createInitialAccount(), 0.1, 61000, 10);

    const result = openMarket(account, {
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.15,
      price: 62000,
      leverage: 10,
      now: NOW,
    });
    if (!result.ok) throw new Error(result.error);
    account = result.account;

    const position = onlyPosition(account);
    expect(position.side).toBe('short');
    expect(position.qty).toBeCloseTo(0.05, 10);
    expect(position.entryPrice).toBe(62000);
    expect(account.history).toHaveLength(1);
  });
});

describe('closePositionMarket', () => {
  it('closes 100% and records history with fee', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const balanceBefore = account.balance;

    const result = closePositionMarket(account, {
      positionId: onlyPosition(account).id,
      fraction: 1,
      price: 61000,
      now: NOW,
    });
    if (!result.ok) throw new Error(result.error);
    account = result.account;

    expect(account.positions).toHaveLength(0);
    const fee = 61000 * 0.1 * 0.00055;
    expect(account.balance).toBeCloseTo(balanceBefore + 600 + 100 - fee, 8);

    const trade = account.history[0];
    expect(trade?.realizedPnl).toBeCloseTo(100, 8);
    expect(trade?.fee).toBeCloseTo(fee, 8);
    expect(trade?.reason).toBe('manual');
    expect(trade?.closedAt).toBe(NOW);
  });

  it('partially closes with proportional margin release', () => {
    let account = openLong(createInitialAccount(), 0.2, 60000, 10);
    const balanceBefore = account.balance;

    const result = closePositionMarket(account, {
      positionId: onlyPosition(account).id,
      fraction: 0.25,
      price: 61000,
    });
    if (!result.ok) throw new Error(result.error);
    account = result.account;

    const position = onlyPosition(account);
    expect(position.qty).toBeCloseTo(0.15, 10);
    expect(position.margin).toBeCloseTo(900, 8);
    expect(position.entryPrice).toBe(60000);

    const fee = 61000 * 0.05 * 0.00055;
    expect(account.balance).toBeCloseTo(balanceBefore + 300 + 50 - fee, 8);
  });

  it('rejects invalid fraction or unknown position', () => {
    const account = openLong(createInitialAccount());
    const id = onlyPosition(account).id;
    expect(closePositionMarket(account, { positionId: id, fraction: 0, price: 60000 })).toEqual({
      ok: false,
      error: 'invalid-qty',
    });
    expect(closePositionMarket(account, { positionId: 'nope', fraction: 1, price: 60000 })).toEqual(
      { ok: false, error: 'not-found' },
    );
  });
});

describe('limit orders', () => {
  it('reserves margin plus maker fee on placement and refunds on cancel', () => {
    const initial = createInitialAccount();
    const result = placeLimitOrder(initial, {
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      limitPrice: 58000,
      leverage: 10,
      now: NOW,
    });
    if (!result.ok) throw new Error(result.error);

    const reserved = 580 + 5800 * 0.0002;
    expect(result.account.balance).toBeCloseTo(10000 - reserved, 8);
    expect(result.account.orders).toHaveLength(1);

    const order = result.account.orders[0];
    if (order === undefined) throw new Error('no order');
    expect(order.kind).toBe('open');
    expect(order.margin).toBeCloseTo(580, 8);
    expect(order.fee).toBeCloseTo(1.16, 8);

    const cancelled = cancelOrder(result.account, order.id);
    if (!cancelled.ok) throw new Error(cancelled.error);
    expect(cancelled.account.balance).toBeCloseTo(10000, 8);
    expect(cancelled.account.orders).toHaveLength(0);
  });

  it('rejects insufficient balance for limit reservation', () => {
    const result = placeLimitOrder(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 2,
      limitPrice: 60000,
      leverage: 10,
    });
    expect(result).toEqual({ ok: false, error: 'insufficient-balance' });
  });

  it('fills a long limit when mark drops to the limit price', () => {
    const placed = placeLimitOrder(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      limitPrice: 58000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    const holding = processTick(placed.account, 'BTCUSDT', 58100, NOW);
    expect(holding.account.orders).toHaveLength(1);
    expect(holding.events).toEqual([]);

    const filled = processTick(placed.account, 'BTCUSDT', 57900, NOW);
    expect(filled.account.orders).toHaveLength(0);
    expect(filled.account.positions).toHaveLength(1);

    const position = filled.account.positions[0];
    expect(position?.entryPrice).toBe(58000);
    expect(position?.margin).toBeCloseTo(580, 8);
    expect(filled.events).toContainEqual({
      type: 'limit-filled',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 58000,
    });
  });

  it('fills a short limit when mark rises to the limit price', () => {
    const placed = placeLimitOrder(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      limitPrice: 62000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    expect(processTick(placed.account, 'BTCUSDT', 61900, NOW).account.orders).toHaveLength(1);

    const filled = processTick(placed.account, 'BTCUSDT', 62100, NOW);
    expect(filled.account.positions[0]?.side).toBe('short');
    expect(filled.account.positions[0]?.entryPrice).toBe(62000);
  });

  it('ignores ticks of other symbols', () => {
    const placed = placeLimitOrder(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      limitPrice: 58000,
      leverage: 10,
    });
    if (!placed.ok) throw new Error(placed.error);
    const ticked = processTick(placed.account, 'ETHUSDT', 100, NOW);
    expect(ticked.account.orders).toHaveLength(1);
  });
});

describe('close limit orders', () => {
  it('fills a close limit for a long when mark rises to the limit', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const balanceBefore = account.balance;

    const placed = placeCloseLimit(account, {
      positionId: onlyPosition(account).id,
      qty: 0.1,
      limitPrice: 61000,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);
    expect(placed.account.balance).toBe(balanceBefore);

    const held = processTick(placed.account, 'BTCUSDT', 60500, NOW);
    expect(held.account.orders).toHaveLength(1);

    const filled = processTick(placed.account, 'BTCUSDT', 61000, NOW);
    account = filled.account;
    expect(account.positions).toHaveLength(0);
    expect(account.orders).toHaveLength(0);

    const fee = 61000 * 0.1 * 0.0002;
    expect(account.balance).toBeCloseTo(balanceBefore + 600 + 100 - fee, 8);
    expect(account.history[0]?.reason).toBe('manual');
    expect(account.history[0]?.fee).toBeCloseTo(fee, 8);
  });

  it('rejects close limit qty above position size', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const result = placeCloseLimit(account, {
      positionId: onlyPosition(account).id,
      qty: 0.2,
      limitPrice: 61000,
    });
    expect(result).toEqual({ ok: false, error: 'invalid-qty' });
  });

  it('drops close orders whose position disappeared', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const positionId = onlyPosition(account).id;
    const placed = placeCloseLimit(account, { positionId, qty: 0.1, limitPrice: 61000 });
    if (!placed.ok) throw new Error(placed.error);

    const closed = closePositionMarket(placed.account, { positionId, fraction: 1, price: 60500 });
    if (!closed.ok) throw new Error(closed.error);
    account = closed.account;

    const ticked = processTick(account, 'BTCUSDT', 61500, NOW);
    expect(ticked.account.orders).toHaveLength(0);
    expect(ticked.account.positions).toHaveLength(0);
    expect(ticked.account.history).toHaveLength(1);
  });
});

describe('take profit and stop loss', () => {
  it('closes a long at mark when TP is touched', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const withTp = setTakeProfit(account, onlyPosition(account).id, 61000);
    if (!withTp.ok) throw new Error(withTp.error);

    const held = processTick(withTp.account, 'BTCUSDT', 60900, NOW);
    expect(held.account.positions).toHaveLength(1);

    const triggered = processTick(withTp.account, 'BTCUSDT', 61200, NOW);
    account = triggered.account;
    expect(account.positions).toHaveLength(0);
    expect(account.history[0]?.reason).toBe('tp');
    expect(account.history[0]?.exitPrice).toBe(61200);
    expect(account.history[0]?.realizedPnl).toBeCloseTo(120, 8);
    expect(triggered.events.some((event) => event.type === 'tp')).toBe(true);
  });

  it('closes a long at mark when SL is touched', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const withSl = setStopLoss(account, onlyPosition(account).id, 59000);
    if (!withSl.ok) throw new Error(withSl.error);

    const triggered = processTick(withSl.account, 'BTCUSDT', 58800, NOW);
    expect(triggered.account.positions).toHaveLength(0);
    expect(triggered.account.history[0]?.reason).toBe('sl');
    expect(triggered.account.history[0]?.realizedPnl).toBeCloseTo(-120, 8);
  });

  it('handles short TP below entry and SL above entry', () => {
    const opened = openMarket(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!opened.ok) throw new Error(opened.error);
    let account = opened.account;
    const id = onlyPosition(account).id;

    const withTp = setTakeProfit(account, id, 59000);
    if (!withTp.ok) throw new Error(withTp.error);
    const tpHit = processTick(withTp.account, 'BTCUSDT', 58900, NOW);
    expect(tpHit.account.history[0]?.reason).toBe('tp');
    expect(tpHit.account.history[0]?.realizedPnl).toBeCloseTo(110, 8);

    const withSl = setStopLoss(account, id, 61000);
    if (!withSl.ok) throw new Error(withSl.error);
    const slHit = processTick(withSl.account, 'BTCUSDT', 61100, NOW);
    expect(slHit.account.history[0]?.reason).toBe('sl');
    account = slHit.account;
    expect(account.positions).toHaveLength(0);
  });

  it('clears TP/SL when set to null', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const id = onlyPosition(account).id;
    const withTp = setTakeProfit(account, id, 61000);
    if (!withTp.ok) throw new Error(withTp.error);
    const cleared = setTakeProfit(withTp.account, id, null);
    if (!cleared.ok) throw new Error(cleared.error);
    expect(onlyPosition(cleared.account).takeProfit).toBeNull();
  });
});

describe('trailing stop', () => {
  function withTrailing(account: Account) {
    const result = setTrailingStop(account, onlyPosition(account).id, {
      activationPrice: 61000,
      distance: 500,
    });
    if (!result.ok) throw new Error(result.error);
    return result.account;
  }

  it('activates at activation price then closes on pullback >= distance', () => {
    let account = withTrailing(openLong(createInitialAccount(), 0.1, 60000, 10));

    account = processTick(account, 'BTCUSDT', 60500, NOW).account;
    expect(onlyPosition(account).trailing?.active).toBe(false);

    account = processTick(account, 'BTCUSDT', 61000, NOW).account;
    expect(onlyPosition(account).trailing?.active).toBe(true);
    expect(onlyPosition(account).trailing?.extremePrice).toBe(61000);

    account = processTick(account, 'BTCUSDT', 61800, NOW).account;
    expect(onlyPosition(account).trailing?.extremePrice).toBe(61800);

    account = processTick(account, 'BTCUSDT', 61400, NOW).account;
    expect(account.positions).toHaveLength(1);

    const closed = processTick(account, 'BTCUSDT', 61290, NOW);
    expect(closed.account.positions).toHaveLength(0);
    expect(closed.account.history[0]?.reason).toBe('trailing');
    expect(closed.account.history[0]?.exitPrice).toBe(61290);
    expect(closed.account.history[0]?.realizedPnl).toBeCloseTo(129, 8);
    expect(closed.events.some((event) => event.type === 'trailing')).toBe(true);
  });

  it('tracks minima for shorts', () => {
    const opened = openMarket(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!opened.ok) throw new Error(opened.error);
    const withTrail = setTrailingStop(opened.account, onlyPosition(opened.account).id, {
      activationPrice: 59000,
      distance: 400,
    });
    if (!withTrail.ok) throw new Error(withTrail.error);

    let account = processTick(withTrail.account, 'BTCUSDT', 59000, NOW).account;
    account = processTick(account, 'BTCUSDT', 58000, NOW).account;
    expect(onlyPosition(account).trailing?.extremePrice).toBe(58000);

    const closed = processTick(account, 'BTCUSDT', 58400, NOW);
    expect(closed.account.positions).toHaveLength(0);
    expect(closed.account.history[0]?.reason).toBe('trailing');
    expect(closed.account.history[0]?.realizedPnl).toBeCloseTo(160, 8);
  });
});

describe('liquidation', () => {
  it('liquidates a long when mark touches the liquidation price', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const balanceAfterOpen = account.balance;

    const survived = processTick(account, 'BTCUSDT', 54301, NOW);
    expect(survived.account.positions).toHaveLength(1);

    const liquidated = processTick(account, 'BTCUSDT', 54300, NOW);
    expect(liquidated.account.positions).toHaveLength(0);
    expect(liquidated.account.balance).toBeCloseTo(balanceAfterOpen, 8);

    const trade = liquidated.account.history[0];
    expect(trade?.reason).toBe('liquidation');
    expect(trade?.realizedPnl).toBeCloseTo(-600, 8);
    expect(liquidated.events).toContainEqual({
      type: 'liquidation',
      symbol: 'BTCUSDT',
      side: 'long',
      loss: 600,
    });
  });

  it('liquidates a short when mark rises to the liquidation price', () => {
    const opened = openMarket(createInitialAccount(), {
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!opened.ok) throw new Error(opened.error);

    const liquidated = processTick(opened.account, 'BTCUSDT', 65700, NOW);
    expect(liquidated.account.positions).toHaveLength(0);
    expect(liquidated.account.history[0]?.reason).toBe('liquidation');
  });

  it('prioritizes liquidation over stop loss on the same tick', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const withSl = setStopLoss(account, onlyPosition(account).id, 54200);
    if (!withSl.ok) throw new Error(withSl.error);

    const ticked = processTick(withSl.account, 'BTCUSDT', 54000, NOW);
    expect(ticked.account.history[0]?.reason).toBe('liquidation');
  });
});

describe('getAccountMetrics', () => {
  it('computes equity = available + used margin + unrealized pnl', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const placed = placeLimitOrder(account, {
      symbol: 'ETHUSDT',
      side: 'long',
      qty: 1,
      limitPrice: 3000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);
    account = placed.account;

    const metrics = getAccountMetrics(account, { BTCUSDT: 61000 });
    expect(metrics.available).toBeCloseTo(10000 - 603.3 - 300.6, 8);
    expect(metrics.usedMargin).toBeCloseTo(600 + 300.6, 8);
    expect(metrics.totalUpnl).toBeCloseTo(100, 8);
    expect(metrics.equity).toBeCloseTo(
      metrics.available + metrics.usedMargin + metrics.totalUpnl,
      8,
    );
  });

  it('treats positions without a mark as zero upnl', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const metrics = getAccountMetrics(account, {});
    expect(metrics.totalUpnl).toBe(0);
    expect(metrics.equity).toBeCloseTo(account.balance + 600, 8);
  });
});
