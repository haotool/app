import { describe, expect, it } from 'vitest';
import {
  cancelOrder,
  closePositionMarket,
  createInitialAccount,
  evaluateCrossMargin,
  getAccountMetrics,
  openMarket,
  placeCloseLimit,
  placeLimitOrder,
  processTick,
  setStopLoss,
  setTakeProfit,
  setTakeProfitStopLoss,
  setTrailingStop,
} from './engine';
import { liquidationPrice, roundUsdt } from './math';
import { type Account, type Position } from './types';
import { HISTORY_MAX_ENTRIES, INITIAL_BALANCE_USDT } from '../config/trading';
import { type MarketSymbol } from '../config/market';
import { parsePersistedTradeState } from '../stores/tradeStore';

const NOW = 1_800_000_000_000;

function openLong(account: Account, qty = 0.1, price = 60000, leverage = 10) {
  const result = openMarket(account, {
    marginMode: 'isolated',
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
    expect(position.openFee).toBeCloseTo(3.3, 8);
    expect(position.leverage).toBe(10);
    expect(position.openedAt).toBe(NOW);
  });

  it('rejects when balance cannot cover margin plus fee', () => {
    const result = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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
    expect(openMarket(account, { marginMode: 'isolated', ...base, leverage: 0 })).toEqual({
      ok: false,
      error: 'invalid-leverage',
    });
    expect(openMarket(account, { marginMode: 'isolated', ...base, leverage: 1001 })).toEqual({
      ok: false,
      error: 'invalid-leverage',
    });
    expect(openMarket(account, { marginMode: 'isolated', ...base, qty: 0, leverage: 10 })).toEqual({
      ok: false,
      error: 'invalid-qty',
    });
    expect(
      openMarket(account, { marginMode: 'isolated', ...base, qty: 0.1, price: 0, leverage: 10 }),
    ).toEqual({
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

  it('clamps merged derived leverage into [1, 1000] despite rounding drift', () => {
    // 兩筆同槓桿合併時 margin 各自 roundUsdt，衍生槓桿可能微幅越界（125x 時實證 125.0000002）。
    let account = openLong(createInitialAccount(), 0.0011, 60000.13, 1000);
    account = openLong(account, 0.00307, 61234.57, 1000);

    const position = onlyPosition(account);
    expect(position.leverage).toBeLessThanOrEqual(1000);
    expect(position.leverage).toBeGreaterThanOrEqual(1);
    expect(position.leverage).toBeCloseTo(1000, 3);
  });

  it('reduces the opposite position first', () => {
    let account = openLong(createInitialAccount(), 0.2, 61000, 10);
    const balanceBefore = account.balance;

    const result = openMarket(account, {
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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

describe('open with tp/sl (R4-6)', () => {
  const base = { symbol: 'BTCUSDT', qty: 0.1, leverage: 10, now: NOW } as const;

  it('applies tp and sl atomically on a market open', () => {
    const result = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 61000,
      sl: 59000,
    });
    if (!result.ok) throw new Error(result.error);
    const position = onlyPosition(result.account);
    expect(position.takeProfit).toBe(61000);
    expect(position.stopLoss).toBe(59000);
  });

  it('leaves tp/sl unset when omitted', () => {
    const result = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
    });
    if (!result.ok) throw new Error(result.error);
    expect(onlyPosition(result.account).takeProfit).toBeNull();
    expect(onlyPosition(result.account).stopLoss).toBeNull();
  });

  it('accepts tp-only and sl-only opens', () => {
    const tpOnly = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'short',
      price: 60000,
      tp: 59000,
    });
    if (!tpOnly.ok) throw new Error(tpOnly.error);
    expect(onlyPosition(tpOnly.account).takeProfit).toBe(59000);
    expect(onlyPosition(tpOnly.account).stopLoss).toBeNull();

    const slOnly = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'short',
      price: 60000,
      sl: 61000,
    });
    if (!slOnly.ok) throw new Error(slOnly.error);
    expect(onlyPosition(slOnly.account).takeProfit).toBeNull();
    expect(onlyPosition(slOnly.account).stopLoss).toBe(61000);
  });

  it('rejects wrong-direction tp/sl for both sides without mutating the account', () => {
    const account = createInitialAccount();
    expect(
      openMarket(account, {
        marginMode: 'isolated',
        ...base,
        side: 'long',
        price: 60000,
        tp: 59000,
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-tp-direction',
    });
    expect(
      openMarket(account, {
        marginMode: 'isolated',
        ...base,
        side: 'long',
        price: 60000,
        sl: 61000,
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-sl-direction',
    });
    expect(
      openMarket(account, {
        marginMode: 'isolated',
        ...base,
        side: 'short',
        price: 60000,
        tp: 61000,
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-tp-direction',
    });
    expect(
      openMarket(account, {
        marginMode: 'isolated',
        ...base,
        side: 'short',
        price: 60000,
        sl: 59000,
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-sl-direction',
    });
    expect(account.positions).toHaveLength(0);
    expect(account.balance).toBe(INITIAL_BALANCE_USDT);
  });

  it('rejects tp/sl equal to entry and non-positive values', () => {
    const account = createInitialAccount();
    expect(
      openMarket(account, {
        marginMode: 'isolated',
        ...base,
        side: 'long',
        price: 60000,
        tp: 60000,
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-tp-direction',
    });
    expect(
      openMarket(account, { marginMode: 'isolated', ...base, side: 'long', price: 60000, sl: 0 }),
    ).toEqual({
      ok: false,
      error: 'invalid-price',
    });
    expect(
      openMarket(account, {
        marginMode: 'isolated',
        ...base,
        side: 'long',
        price: 60000,
        tp: Number.NaN,
      }),
    ).toEqual({
      ok: false,
      error: 'invalid-price',
    });
  });

  it('rejects a valid tp combined with an invalid sl as one atomic order', () => {
    const result = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 61000,
      sl: 62000,
    });
    expect(result).toEqual({ ok: false, error: 'invalid-sl-direction' });
  });

  it('keeps the existing tp/sl when scaling in, ignoring form values', () => {
    const first = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 61000,
      sl: 59000,
    });
    if (!first.ok) throw new Error(first.error);

    const scaled = openMarket(first.account, {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60200,
      tp: 65000,
      sl: 58000,
    });
    if (!scaled.ok) throw new Error(scaled.error);

    const position = onlyPosition(scaled.account);
    expect(scaled.account.positions).toHaveLength(1);
    expect(position.takeProfit).toBe(61000);
    expect(position.stopLoss).toBe(59000);
  });

  it('scales in even when the form tp/sl is invalid against the new price (B1)', () => {
    const first = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 61000,
      sl: 59000,
    });
    if (!first.ok) throw new Error(first.error);

    const scaled = openMarket(first.account, {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60200,
      tp: 59000,
      sl: 62000,
    });
    if (!scaled.ok) throw new Error(scaled.error);

    const position = onlyPosition(scaled.account);
    expect(position.qty).toBeCloseTo(0.2, 10);
    expect(position.takeProfit).toBe(61000);
    expect(position.stopLoss).toBe(59000);
  });

  it('still validates tp/sl when the existing position is on the opposite side', () => {
    const first = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'short',
      price: 60000,
    });
    if (!first.ok) throw new Error(first.error);

    expect(
      openMarket(first.account, {
        marginMode: 'isolated',
        ...base,
        qty: 0.2,
        side: 'long',
        price: 60000,
        tp: 59000,
      }),
    ).toEqual({ ok: false, error: 'invalid-tp-direction' });
  });

  it('triggers a market-open tp exactly like a sheet-set tp', () => {
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 61000,
    });
    if (!opened.ok) throw new Error(opened.error);

    const triggered = processTick(opened.account, 'BTCUSDT', 61050, NOW);
    expect(triggered.account.positions).toHaveLength(0);
    expect(triggered.account.history[0]?.reason).toBe('tp');
    expect(triggered.events.some((event) => event.type === 'tp')).toBe(true);
  });

  it('validates limit tp/sl against the limit price and records them on the order', () => {
    const rejected = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      limitPrice: 58000,
      tp: 57000,
    });
    expect(rejected).toEqual({ ok: false, error: 'invalid-tp-direction' });

    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      limitPrice: 58000,
      tp: 59000,
      sl: 57000,
    });
    if (!placed.ok) throw new Error(placed.error);
    expect(placed.account.orders[0]?.takeProfit).toBe(59000);
    expect(placed.account.orders[0]?.stopLoss).toBe(57000);
  });

  it('transfers tp/sl from a filled limit order onto the new position', () => {
    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      limitPrice: 58000,
      tp: 59000,
      sl: 57000,
    });
    if (!placed.ok) throw new Error(placed.error);

    const filled = processTick(placed.account, 'BTCUSDT', 57900, NOW);
    expect(filled.account.orders).toHaveLength(0);
    const position = filled.account.positions[0];
    expect(position?.takeProfit).toBe(59000);
    expect(position?.stopLoss).toBe(57000);
  });

  it('keeps the existing position tp/sl when a limit fill merges into it', () => {
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 62000,
      sl: 58500,
    });
    if (!opened.ok) throw new Error(opened.error);

    const placed = placeLimitOrder(opened.account, {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      limitPrice: 59000,
      tp: 63000,
      sl: 58000,
    });
    if (!placed.ok) throw new Error(placed.error);

    const filled = processTick(placed.account, 'BTCUSDT', 58900, NOW);
    expect(filled.account.orders).toHaveLength(0);
    expect(filled.account.positions).toHaveLength(1);
    expect(filled.account.positions[0]?.takeProfit).toBe(62000);
    expect(filled.account.positions[0]?.stopLoss).toBe(58500);
  });

  it('places a scale-in limit order even when the form tp/sl is invalid against the limit price (B1)', () => {
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      price: 60000,
      tp: 62000,
      sl: 58500,
    });
    if (!opened.ok) throw new Error(opened.error);

    const placed = placeLimitOrder(opened.account, {
      marginMode: 'isolated',
      ...base,
      side: 'long',
      limitPrice: 59000,
      tp: 57000,
      sl: 60000,
    });
    if (!placed.ok) throw new Error(placed.error);
    expect(placed.account.orders).toHaveLength(1);

    const filled = processTick(placed.account, 'BTCUSDT', 58900, NOW);
    expect(filled.account.orders).toHaveLength(0);
    expect(filled.account.positions).toHaveLength(1);
    expect(filled.account.positions[0]?.takeProfit).toBe(62000);
    expect(filled.account.positions[0]?.stopLoss).toBe(58500);
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
    expect(trade?.openFee).toBeCloseTo(3.3, 8);
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
    expect(position.openFee).toBeCloseTo(4.95, 8);
    expect(position.entryPrice).toBe(60000);

    const fee = 61000 * 0.05 * 0.00055;
    expect(account.balance).toBeCloseTo(balanceBefore + 300 + 50 - fee, 8);
    expect(account.history[0]?.openFee).toBeCloseTo(1.65, 8);
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

  it('returns the executed trade so callers can report actual fill results', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const result = closePositionMarket(account, {
      positionId: onlyPosition(account).id,
      fraction: 1,
      price: 61000,
      now: NOW,
    });
    if (!result.ok) throw new Error(result.error);
    expect(result.trade.realizedPnl).toBeCloseTo(100, 8);
    expect(result.trade.exitPrice).toBe(61000);
    expect(result.trade.qty).toBeCloseTo(0.1, 10);
  });

  it('caps closed-trade history at HISTORY_MAX_ENTRIES keeping the newest entries', () => {
    let account = createInitialAccount();
    for (let index = 0; index < HISTORY_MAX_ENTRIES + 5; index += 1) {
      account = openLong(account, 0.001, 60000, 10);
      const closed = closePositionMarket(account, {
        positionId: onlyPosition(account).id,
        fraction: 1,
        price: 60000,
        now: NOW + index,
      });
      if (!closed.ok) throw new Error(closed.error);
      account = closed.account;
    }
    expect(account.history).toHaveLength(HISTORY_MAX_ENTRIES);
    expect(account.history[0]?.closedAt).toBe(NOW + HISTORY_MAX_ENTRIES + 4);
  });
});

describe('limit orders', () => {
  it('reserves margin plus maker fee on placement and refunds on cancel', () => {
    const initial = createInitialAccount();
    const result = placeLimitOrder(initial, {
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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

    // 限價或更優：以觸發當下 mark 成交。
    const position = filled.account.positions[0];
    expect(position?.entryPrice).toBe(57900);
    expect(position?.margin).toBeCloseTo(579, 8);
    expect(filled.events).toContainEqual({
      type: 'limit-filled',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 57900,
    });
  });

  it('fills a short limit when mark rises to the limit price', () => {
    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
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
    expect(filled.account.positions[0]?.entryPrice).toBe(62100);
  });

  it('ignores ticks of other symbols', () => {
    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
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

  it('fills a marketable open limit at the mark, not at the worse limit price', () => {
    // 買單限價 60000 高於 mark 59000：依「限價或更優」語意應以 mark 成交。
    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      limitPrice: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    const filled = processTick(placed.account, 'BTCUSDT', 59000, NOW);
    expect(filled.account.orders).toHaveLength(0);

    const position = filled.account.positions[0];
    expect(position?.entryPrice).toBe(59000);
    expect(position?.margin).toBeCloseTo(590, 8);
    expect(filled.events).toContainEqual({
      type: 'limit-filled',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 59000,
    });
  });

  it('falls back to the limit price when a full-margin short marketable limit cannot fill at mark', () => {
    // 滿倉 short：預扣以 limit 計，mark 高於 limit 使名目變大而超出預扣，
    // 必須回退以使用者保證的限價成交，不得靜默失敗讓掛單滯留。
    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 1.66,
      limitPrice: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);
    expect(placed.account.balance).toBeCloseTo(10000 - 1.66 * 6012, 8);

    const filled = processTick(placed.account, 'BTCUSDT', 63000, NOW);
    expect(filled.account.orders).toHaveLength(0);
    expect(filled.account.positions).toHaveLength(1);

    const position = filled.account.positions[0];
    expect(position?.side).toBe('short');
    expect(position?.entryPrice).toBe(60000);
    expect(position?.margin).toBeCloseTo(9960, 8);
    expect(filled.account.balance).toBeCloseTo(20.08, 8);
    expect(filled.account.balance).toBeGreaterThanOrEqual(0);
    expect(parsePersistedTradeState({ account: filled.account })).not.toBeNull();
    expect(filled.events).toContainEqual({
      type: 'limit-filled',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 1.66,
      price: 60000,
    });
  });

  it('liquidates immediately when a fallback fill opens past its liquidation price', () => {
    // 滿倉 short limit 遇暴漲 mark：回退以 60000 成交後，70000 已越過 10x 強平價，
    // 必須在同一 tick 立即強平，不得把負權益倉位留到下一筆 ticker。
    const placed = placeLimitOrder(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 1.66,
      limitPrice: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    const ticked = processTick(placed.account, 'BTCUSDT', 70000, NOW);
    expect(ticked.account.orders).toHaveLength(0);
    expect(ticked.account.positions).toHaveLength(0);
    expect(ticked.events).toContainEqual({
      type: 'limit-filled',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 1.66,
      price: 60000,
    });
    expect(ticked.events).toContainEqual(
      expect.objectContaining({ type: 'liquidation', symbol: 'BTCUSDT', side: 'short' }),
    );
    expect(ticked.account.balance).toBeGreaterThanOrEqual(0);
    expect(parsePersistedTradeState({ account: ticked.account })).not.toBeNull();
  });

  it('removes close orders tied to a position liquidated by a fallback fill in the same tick', () => {
    // 既有 2x short 掛 59000 平倉單，再滿倉 10x short fallback @60000 合併後越過強平價：
    // 同 tick 強平必須同步清除指向該倉位的 close 掛單，不留孤兒單到下一筆 ticker。
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.05,
      price: 60000,
      leverage: 2,
      now: NOW,
    });
    if (!opened.ok) throw new Error(opened.error);
    const positionId = opened.account.positions[0]?.id ?? '';

    const withClose = placeCloseLimit(opened.account, {
      positionId,
      qty: 0.05,
      limitPrice: 59000,
      now: NOW,
    });
    if (!withClose.ok) throw new Error(withClose.error);

    const placed = placeLimitOrder(withClose.account, {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 1.4,
      limitPrice: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    const ticked = processTick(placed.account, 'BTCUSDT', 70000, NOW);
    expect(ticked.account.positions).toHaveLength(0);
    expect(ticked.account.orders).toHaveLength(0);
    expect(ticked.events).toContainEqual(
      expect.objectContaining({ type: 'liquidation', symbol: 'BTCUSDT', side: 'short' }),
    );
    expect(ticked.account.balance).toBeGreaterThanOrEqual(0);
    expect(parsePersistedTradeState({ account: ticked.account })).not.toBeNull();
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
    expect(result).toEqual({ ok: false, error: 'exceeds-position' });
  });

  it('rejects a close limit when pending close orders already cover the position', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const id = onlyPosition(account).id;
    const first = placeCloseLimit(account, { positionId: id, qty: 0.06, limitPrice: 61000 });
    if (!first.ok) throw new Error(first.error);

    const second = placeCloseLimit(first.account, { positionId: id, qty: 0.06, limitPrice: 62000 });
    expect(second).toEqual({ ok: false, error: 'exceeds-position' });

    const within = placeCloseLimit(first.account, { positionId: id, qty: 0.04, limitPrice: 62000 });
    expect(within.ok).toBe(true);
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

  it('fills a marketable close limit at the mark and never drives balance negative', () => {
    // Fable 場景：滿倉開多後掛 1 USDT 平倉限價（marketable），必須以 mark 成交而非劣價。
    const account = openLong(createInitialAccount(), 1.6, 60000, 10);
    const placed = placeCloseLimit(account, {
      positionId: onlyPosition(account).id,
      qty: 1.6,
      limitPrice: 1,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    const filled = processTick(placed.account, 'BTCUSDT', 60000, NOW);
    expect(filled.account.positions).toHaveLength(0);
    expect(filled.account.orders).toHaveLength(0);
    expect(filled.account.history[0]?.exitPrice).toBe(60000);
    expect(filled.account.balance).toBeGreaterThanOrEqual(0);
    expect(filled.events).toContainEqual({
      type: 'close-filled',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 1.6,
      price: 60000,
      pnl: 0,
    });
  });

  it('fills a resting close limit at the crossing mark (limit or better)', () => {
    // 掛單價 61000，mark 跳到 61200 才觸發：成交價應為更優的 61200。
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const placed = placeCloseLimit(account, {
      positionId: onlyPosition(account).id,
      qty: 0.1,
      limitPrice: 61000,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    const filled = processTick(placed.account, 'BTCUSDT', 61200, NOW);
    expect(filled.account.positions).toHaveLength(0);
    expect(filled.account.history[0]?.exitPrice).toBe(61200);
    expect(filled.account.history[0]?.realizedPnl).toBeCloseTo(120, 8);
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
      marginMode: 'isolated',
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

  it('rejects wrong-direction TP/SL for longs', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const id = onlyPosition(account).id;
    expect(setTakeProfit(account, id, 59000)).toEqual({
      ok: false,
      error: 'invalid-tp-direction',
    });
    expect(setTakeProfit(account, id, 60000)).toEqual({
      ok: false,
      error: 'invalid-tp-direction',
    });
    expect(setStopLoss(account, id, 61000)).toEqual({ ok: false, error: 'invalid-sl-direction' });
  });

  it('applies TP and SL atomically: an invalid pair rejects without partial state', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const id = onlyPosition(account).id;

    // SL 方向錯誤：整筆拒絕，回傳 error 供呼叫端不落任何半套。
    const invalid = setTakeProfitStopLoss(account, id, 61000, 62000);
    expect(invalid).toEqual({ ok: false, error: 'invalid-sl-direction' });

    const valid = setTakeProfitStopLoss(account, id, 61000, 59000);
    if (!valid.ok) throw new Error(valid.error);
    expect(onlyPosition(valid.account).takeProfit).toBe(61000);
    expect(onlyPosition(valid.account).stopLoss).toBe(59000);

    const cleared = setTakeProfitStopLoss(valid.account, id, null, null);
    if (!cleared.ok) throw new Error(cleared.error);
    expect(onlyPosition(cleared.account).takeProfit).toBeNull();
    expect(onlyPosition(cleared.account).stopLoss).toBeNull();
  });

  it('rejects wrong-direction TP/SL for shorts', () => {
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!opened.ok) throw new Error(opened.error);
    const id = onlyPosition(opened.account).id;
    expect(setTakeProfit(opened.account, id, 61000)).toEqual({
      ok: false,
      error: 'invalid-tp-direction',
    });
    expect(setStopLoss(opened.account, id, 59000)).toEqual({
      ok: false,
      error: 'invalid-sl-direction',
    });
  });
});

describe('tp/sl partial close ratio (R5-6)', () => {
  function withTpSl(
    account: Account,
    takeProfit: number | null,
    stopLoss: number | null,
    closeRatio?: number,
  ) {
    const result = setTakeProfitStopLoss(
      account,
      onlyPosition(account).id,
      takeProfit,
      stopLoss,
      closeRatio,
    );
    if (!result.ok) throw new Error(result.error);
    return result.account;
  }

  it('defaults new positions and setTpSl to a full-close ratio of 1', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    expect(onlyPosition(account).tpSlCloseRatio).toBe(1);

    const updated = withTpSl(account, 61000, 59000);
    expect(onlyPosition(updated).tpSlCloseRatio).toBe(1);
  });

  it('closes only the configured ratio on tp and clears tp/sl on the remainder', () => {
    const account = withTpSl(openLong(createInitialAccount(), 0.1, 60000, 10), 61000, 59000, 0.5);

    const triggered = processTick(account, 'BTCUSDT', 61200, NOW);
    const trade = triggered.account.history[0];
    expect(trade?.reason).toBe('tp');
    expect(trade?.qty).toBeCloseTo(0.05, 10);
    // 盈虧按實際平倉量計：(61200-60000)×0.05。
    expect(trade?.realizedPnl).toBeCloseTo(60, 8);

    const remaining = onlyPosition(triggered.account);
    expect(remaining.qty).toBeCloseTo(0.05, 10);
    expect(remaining.margin).toBeCloseTo(300, 8);
    expect(remaining.takeProfit).toBeNull();
    expect(remaining.stopLoss).toBeNull();
    expect(remaining.tpSlCloseRatio).toBe(1);
    expect(triggered.events.some((event) => event.type === 'tp')).toBe(true);
  });

  it('does not re-trigger on the next tick after a partial tp settlement', () => {
    const account = withTpSl(openLong(createInitialAccount(), 0.1, 60000, 10), 61000, null, 0.25);

    const first = processTick(account, 'BTCUSDT', 61200, NOW);
    expect(first.account.history).toHaveLength(1);

    const second = processTick(first.account, 'BTCUSDT', 61500, NOW);
    expect(second.account.history).toHaveLength(1);
    expect(second.events).toHaveLength(0);
    expect(onlyPosition(second.account).qty).toBeCloseTo(0.075, 10);
  });

  it('closes only the configured ratio on sl for shorts', () => {
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
    });
    if (!opened.ok) throw new Error(opened.error);
    const account = withTpSl(opened.account, null, 61000, 0.75);

    const triggered = processTick(account, 'BTCUSDT', 61100, NOW);
    const trade = triggered.account.history[0];
    expect(trade?.reason).toBe('sl');
    expect(trade?.qty).toBeCloseTo(0.075, 10);
    expect(trade?.realizedPnl).toBeCloseTo(-82.5, 8);

    const remaining = onlyPosition(triggered.account);
    expect(remaining.qty).toBeCloseTo(0.025, 10);
    expect(remaining.takeProfit).toBeNull();
    expect(remaining.stopLoss).toBeNull();
  });

  it('keeps the r=1 full-close behavior identical to the legacy path', () => {
    const account = withTpSl(openLong(createInitialAccount(), 0.1, 60000, 10), 61000, null, 1);

    const triggered = processTick(account, 'BTCUSDT', 61200, NOW);
    expect(triggered.account.positions).toHaveLength(0);
    expect(triggered.account.history[0]?.reason).toBe('tp');
    expect(triggered.account.history[0]?.realizedPnl).toBeCloseTo(120, 8);
  });

  it('rejects an out-of-range close ratio without mutating the account', () => {
    const account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const id = onlyPosition(account).id;
    for (const ratio of [0, -0.5, 1.5, Number.NaN]) {
      expect(setTakeProfitStopLoss(account, id, 61000, null, ratio)).toEqual({
        ok: false,
        error: 'invalid-qty',
      });
    }
    expect(onlyPosition(account).takeProfit).toBeNull();
  });

  it('keeps the existing tp/sl and close ratio when scaling in', () => {
    const account = withTpSl(openLong(createInitialAccount(), 0.1, 60000, 10), 61000, 59000, 0.5);

    // 加倉合併沿用倉上 TP/SL 與 tpSlCloseRatio，不被本次開倉覆蓋（R4 契約延伸）。
    const added = openMarket(account, {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.05,
      price: 60500,
      leverage: 10,
      now: NOW,
      tp: 62000,
      sl: 58000,
    });
    if (!added.ok) throw new Error(added.error);

    const merged = onlyPosition(added.account);
    expect(merged.qty).toBeCloseTo(0.15, 10);
    expect(merged.takeProfit).toBe(61000);
    expect(merged.stopLoss).toBe(59000);
    expect(merged.tpSlCloseRatio).toBe(0.5);
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

  it('returns the same account reference when the extreme does not advance', () => {
    let account = withTrailing(openLong(createInitialAccount(), 0.1, 60000, 10));
    account = processTick(account, 'BTCUSDT', 61000, NOW).account;
    account = processTick(account, 'BTCUSDT', 61800, NOW).account;

    const idle = processTick(account, 'BTCUSDT', 61500, NOW);
    expect(idle.account).toBe(account);
    expect(idle.events).toEqual([]);
  });

  it('tracks minima for shorts', () => {
    const opened = openMarket(createInitialAccount(), {
      marginMode: 'isolated',
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
      marginMode: 'isolated',
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

  it('keeps a 1000x long alive at the entry price with the effective-MMR liquidation line', () => {
    // ADR-R5-03：1000x 有效 MMR = 0.5/1000，強平價 60000×(1−0.001+0.0005) ≈ 59970，開倉即強平不可能發生。
    const account = openLong(createInitialAccount(), 0.1, 60000, 1000);
    const liq = liquidationPrice('long', 60000, 1000);
    expect(liq).toBeCloseTo(59970, 8);

    const ticked = processTick(account, 'BTCUSDT', 60000, NOW);
    expect(ticked.account.positions).toHaveLength(1);
    expect(ticked.events).toEqual([]);

    const liquidated = processTick(account, 'BTCUSDT', liq, NOW);
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

  it('liquidates a 1000x position on the first tick crossing the line (delay <= 1 tick, R6-4)', () => {
    // 固定 tick 序列驅動：強平線 59970，越線前的每一筆 tick 都不得觸發、
    // 首個越線 tick 必須同幀強平，不得延遲到下一筆 ticker。
    const account = openLong(createInitialAccount(), 0.1, 60000, 1000);
    const liq = liquidationPrice('long', 60000, 1000);
    expect(liq).toBeCloseTo(59970, 8);

    const sequence = [59995, 59985, 59975, 59971];
    let current = account;
    for (const mark of sequence) {
      const ticked = processTick(current, 'BTCUSDT', mark, NOW);
      expect(ticked.account.positions).toHaveLength(1);
      expect(ticked.events).toEqual([]);
      current = ticked.account;
    }

    const crossing = processTick(current, 'BTCUSDT', 59969, NOW);
    expect(crossing.account.positions).toHaveLength(0);
    expect(crossing.events.map((event) => event.type)).toContain('liquidation');
    expect(crossing.account.history[0]?.reason).toBe('liquidation');
  });
});

describe('cross margin evaluation (R6-2, ADR-R6-02)', () => {
  function openCross(
    account: Account,
    symbol: MarketSymbol,
    qty: number,
    price: number,
    leverage: number,
  ): Account {
    const result = openMarket(account, {
      symbol,
      side: 'long',
      qty,
      price,
      leverage,
      marginMode: 'cross',
      now: NOW,
    });
    if (!result.ok) throw new Error(`open failed: ${result.error}`);
    return result.account;
  }

  it('lets openMarket draw on a provided cross available balance', () => {
    // 現金 100 不足以付 603.3；cross 可用餘額（含未實現盈利）覆蓋時放行，現金轉負。
    const poor: Account = { ...createInitialAccount(), balance: 100 };
    const rejected = openMarket(poor, {
      marginMode: 'cross',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
    });
    expect(rejected).toEqual({ ok: false, error: 'insufficient-balance' });

    const accepted = openMarket(poor, {
      marginMode: 'cross',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.1,
      price: 60000,
      leverage: 10,
      now: NOW,
      availableBalance: 700,
    });
    if (!accepted.ok) throw new Error(accepted.error);
    expect(accepted.account.balance).toBeCloseTo(100 - 603.3, 8);
  });

  it('keeps a cross position alive past its isolated liquidation price', () => {
    const account = openCross(createInitialAccount(), 'BTCUSDT', 0.1, 60000, 10);

    // 逐倉強平價 54300：cross 倉不走單倉強平，帳戶其餘資金背書。
    const ticked = processTick(account, 'BTCUSDT', 54300, NOW);
    expect(ticked.account.positions).toHaveLength(1);
    expect(ticked.events).toEqual([]);

    // 聚合檢查：marginBalance = 9396.7 + 600 − 570 = 9426.7 > MM 27.15 → 不觸發。
    const evaluated = evaluateCrossMargin(ticked.account, { BTCUSDT: 54300 }, NOW);
    expect(evaluated.account).toBe(ticked.account);
    expect(evaluated.events).toEqual([]);
  });

  it('liquidates when the aggregate margin balance falls to the maintenance margin', () => {
    // 現金僅 610：開倉後 6.7。marginBalance = 606.7 + 0.1×(m−60000)×… ≤ MM 於 m ≈ 54204 成立。
    const account = openCross(
      { ...createInitialAccount(), balance: 610 },
      'BTCUSDT',
      0.1,
      60000,
      10,
    );

    const survived = evaluateCrossMargin(account, { BTCUSDT: 54300 }, NOW);
    expect(survived.account.positions).toHaveLength(1);

    const liquidated = evaluateCrossMargin(account, { BTCUSDT: 54204 }, NOW);
    expect(liquidated.account.positions).toHaveLength(0);
    expect(liquidated.account.history[0]?.reason).toBe('liquidation');
    // cross 於 mark 全額實現：loss = |0.1 × (54204 − 60000)| = 579.6（非該倉保證金 600）。
    expect(liquidated.events).toContainEqual({
      type: 'liquidation',
      symbol: 'BTCUSDT',
      side: 'long',
      loss: 579.6,
    });
    // 帳本同步全額實現：balance = 6.7 + 600（釋放 IM）− 579.6 = 27.1。
    expect(liquidated.account.balance).toBeCloseTo(27.1, 8);
  });

  it('liquidates the worst-upnl cross position first and stops once recovered', () => {
    // 全額實現下平倉前後 marginBalance 守恆，恢復來自 MM 端下降：
    // 開倉後現金 1100；BTC uPnL −500、ETH uPnL −1000；MM = 147.5 + 145 = 292.5。
    // marginBalance = 1100 + 600 − 1500 = 200 ≤ 292.5 → 觸發；ETH 最虧先強平（實現 1000）。
    // 平後 marginBalance 仍 200 > MM_BTC 147.5 → 恢復即停，BTC 存活。
    let account = openCross(
      { ...createInitialAccount(), balance: 1733 },
      'BTCUSDT',
      0.5,
      60000,
      100,
    );
    account = openCross(account, 'ETHUSDT', 10, 3000, 100);
    expect(account.balance).toBeCloseTo(1100, 8);

    const marks = { BTCUSDT: 59000, ETHUSDT: 2900 } as const;
    const result = evaluateCrossMargin(account, marks, NOW);
    expect(result.events).toEqual([
      { type: 'liquidation', symbol: 'ETHUSDT', side: 'long', loss: 1000 },
    ]);
    expect(result.account.positions.map((position) => position.symbol)).toEqual(['BTCUSDT']);
    // 帳本全額實現：balance = 1100 + 300（釋放 ETH IM）− 1000 = 400。
    expect(result.account.balance).toBeCloseTo(400, 8);
  });

  it('cascades liquidation until the aggregate recovers or nothing remains', () => {
    let account = openCross(createInitialAccount(), 'BTCUSDT', 0.5, 60000, 100);
    account = openCross(account, 'ETHUSDT', 10, 3000, 100);

    // BTC −10000、ETH −11000：ETH 先強平後 marginBalance 仍 ≤ MM，BTC 接續強平。
    const marks = { BTCUSDT: 40000, ETHUSDT: 1900 } as const;
    const result = evaluateCrossMargin(account, marks, NOW);
    expect(result.events.map((event) => event.type === 'liquidation' && event.symbol)).toEqual([
      'ETHUSDT',
      'BTCUSDT',
    ]);
    expect(result.account.positions).toHaveLength(0);
  });

  it('fills a reserved open limit even when cash is negative from cross profit backing', () => {
    // cross 浮盈作開倉依據：現金可為負；限價單資金已於掛單時預扣，
    // 成交檢查下限為凍結額，不得因成交當下現金為負誤拒。
    const account = openCross(createInitialAccount(), 'BTCUSDT', 0.1, 60000, 10);
    const placed = placeLimitOrder(account, {
      marginMode: 'cross',
      symbol: 'ETHUSDT',
      side: 'long',
      qty: 40,
      limitPrice: 3000,
      leverage: 10,
      now: NOW,
      // 掛單靠 BTC 浮盈背書（帳戶級可用），預扣後現金轉負。
      availableBalance: 20000,
    });
    if (!placed.ok) throw new Error(placed.error);
    expect(placed.account.balance).toBeLessThan(0);

    const filled = processTick(placed.account, 'ETHUSDT', 2990, NOW);
    expect(filled.account.orders).toHaveLength(0);
    expect(filled.account.positions.map((position) => position.symbol)).toContain('ETHUSDT');
  });

  it('skips the whole round when any cross symbol lacks a mark', () => {
    let account = openCross(createInitialAccount(), 'BTCUSDT', 0.5, 60000, 100);
    account = openCross(account, 'ETHUSDT', 10, 3000, 100);

    const result = evaluateCrossMargin(account, { BTCUSDT: 40000 }, NOW);
    expect(result.account).toBe(account);
    expect(result.events).toEqual([]);
  });

  it('ignores isolated positions and clears close orders of liquidated cross positions', () => {
    let account = openLong({ ...createInitialAccount(), balance: 2000 }, 0.1, 60000, 10);
    account = openCross(account, 'ETHUSDT', 4, 3000, 100);
    const ethPosition = account.positions.find((position) => position.symbol === 'ETHUSDT');
    if (ethPosition === undefined) throw new Error('no eth position');
    const placed = placeCloseLimit(account, {
      positionId: ethPosition.id,
      qty: 1,
      limitPrice: 3500,
      now: NOW,
    });
    if (!placed.ok) throw new Error(placed.error);

    // balance = 2000 − 603.3 − 126.6 = 1270.1；ETH −8000 → marginBalance ≤ MM 觸發。
    // BTC 為 isolated：即使跌破自身強平價也不參與聚合、不被 cross 強平。
    const marks = { BTCUSDT: 50000, ETHUSDT: 1000 } as const;
    const result = evaluateCrossMargin(placed.account, marks, NOW);
    expect(result.events).toEqual([
      { type: 'liquidation', symbol: 'ETHUSDT', side: 'long', loss: 8000 },
    ]);
    expect(result.account.positions.map((position) => position.symbol)).toEqual(['BTCUSDT']);
    expect(result.account.orders).toHaveLength(0);
  });
});

describe('ledger invariant', () => {
  function ledgerLhs(account: Account): number {
    const positionMargin = account.positions.reduce((sum, position) => sum + position.margin, 0);
    const positionOpenFee = account.positions.reduce((sum, position) => sum + position.openFee, 0);
    const orderReserved = account.orders.reduce((sum, order) => sum + order.margin + order.fee, 0);
    const historyFees = account.history.reduce((sum, trade) => sum + trade.fee + trade.openFee, 0);
    const realized = account.history.reduce((sum, trade) => sum + trade.realizedPnl, 0);
    return (
      account.balance + positionMargin + positionOpenFee + orderReserved + historyFees - realized
    );
  }

  function expectInvariant(account: Account) {
    expect(roundUsdt(ledgerLhs(account))).toBe(INITIAL_BALANCE_USDT);
    // 引擎任何操作後的帳戶必須恆通過 persist schema，杜絕自產狀態觸發靜默重置。
    expect(parsePersistedTradeState({ account })).not.toBeNull();
  }

  it('holds across a deterministic mixed sequence of every operation type', () => {
    let account = createInitialAccount();
    expectInvariant(account);

    account = openLong(account, 0.1, 60000, 10);
    expectInvariant(account);

    account = openLong(account, 0.05, 62000, 25);
    expectInvariant(account);

    const reversed = openMarket(account, {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'short',
      qty: 0.08,
      price: 61500,
      leverage: 10,
      now: NOW,
    });
    if (!reversed.ok) throw new Error(reversed.error);
    account = reversed.account;
    expectInvariant(account);

    const limit = placeLimitOrder(account, {
      marginMode: 'isolated',
      symbol: 'ETHUSDT',
      side: 'long',
      qty: 0.5,
      limitPrice: 2900,
      leverage: 5,
      now: NOW,
    });
    if (!limit.ok) throw new Error(limit.error);
    account = limit.account;
    expectInvariant(account);

    account = processTick(account, 'ETHUSDT', 2890, NOW).account;
    expect(account.positions.some((position) => position.symbol === 'ETHUSDT')).toBe(true);
    expectInvariant(account);

    const ethId = account.positions.find((position) => position.symbol === 'ETHUSDT')?.id;
    if (ethId === undefined) throw new Error('no eth position');
    const closeLimit = placeCloseLimit(account, {
      positionId: ethId,
      qty: 0.2,
      limitPrice: 3050,
      now: NOW,
    });
    if (!closeLimit.ok) throw new Error(closeLimit.error);
    account = closeLimit.account;
    expectInvariant(account);

    account = processTick(account, 'ETHUSDT', 3060, NOW).account;
    expectInvariant(account);

    const btcId = account.positions.find((position) => position.symbol === 'BTCUSDT')?.id;
    if (btcId === undefined) throw new Error('no btc position');
    const withTp = setTakeProfit(account, btcId, 63000);
    if (!withTp.ok) throw new Error(withTp.error);
    const withTrailing = setTrailingStop(withTp.account, btcId, {
      activationPrice: 62500,
      distance: 300,
    });
    if (!withTrailing.ok) throw new Error(withTrailing.error);
    account = withTrailing.account;
    expectInvariant(account);

    account = processTick(account, 'BTCUSDT', 63100, NOW).account;
    expect(account.positions.some((position) => position.symbol === 'BTCUSDT')).toBe(false);
    expectInvariant(account);

    account = openLong(account, 0.1, 60000, 50);
    account = processTick(account, 'BTCUSDT', 30000, NOW).account;
    expect(account.history[0]?.reason).toBe('liquidation');
    expectInvariant(account);

    account = openLong(account, 0.2, 60000, 10);
    const partialClose = closePositionMarket(account, {
      positionId: onlyPosition(account).id,
      fraction: 0.37,
      price: 60750,
      now: NOW,
    });
    if (!partialClose.ok) throw new Error(partialClose.error);
    account = partialClose.account;
    expectInvariant(account);

    const cancelable = placeLimitOrder(account, {
      marginMode: 'isolated',
      symbol: 'BTCUSDT',
      side: 'long',
      qty: 0.05,
      limitPrice: 55000,
      leverage: 10,
      now: NOW,
    });
    if (!cancelable.ok) throw new Error(cancelable.error);
    account = cancelable.account;
    expectInvariant(account);

    const orderId = account.orders.at(-1)?.id;
    if (orderId === undefined) throw new Error('no order');
    const cancelled = cancelOrder(account, orderId);
    if (!cancelled.ok) throw new Error(cancelled.error);
    account = cancelled.account;
    expectInvariant(account);
  });

  it('holds under randomized operation sequences (property-style)', () => {
    function mulberry32(seed: number): () => number {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const symbols: MarketSymbol[] = ['BTCUSDT', 'ETHUSDT'];
    const leverages = [1, 5, 10, 25, 50, 125];

    for (let seed = 1; seed <= 5; seed += 1) {
      const rng = mulberry32(seed * 7919);
      const marks: Record<MarketSymbol, number> = {
        BTCUSDT: 60000,
        ETHUSDT: 3000,
        SOLUSDT: 150,
        XRPUSDT: 2,
        DOGEUSDT: 0.3,
        BNBUSDT: 600,
        ADAUSDT: 1,
        LTCUSDT: 100,
        LINKUSDT: 20,
        AVAXUSDT: 40,
        PPRUSDT: 0.042,
      };
      let account = createInitialAccount();

      const randomSide = () => (rng() < 0.5 ? ('long' as const) : ('short' as const));
      const randomLeverage = () => leverages[Math.floor(rng() * leverages.length)] ?? 10;
      const randomQty = (mark: number) => (50 + rng() * 2000) / mark;
      const randomPosition = (): Position | undefined =>
        account.positions[Math.floor(rng() * account.positions.length)];

      for (let step = 0; step < 300; step += 1) {
        const symbol = symbols[Math.floor(rng() * symbols.length)] ?? 'BTCUSDT';
        const mark = marks[symbol];
        const roll = rng();

        if (roll < 0.22) {
          const result = openMarket(account, {
            marginMode: 'isolated',
            symbol,
            side: randomSide(),
            qty: randomQty(mark),
            price: mark,
            leverage: randomLeverage(),
            now: NOW,
          });
          if (result.ok) account = result.account;
        } else if (roll < 0.34) {
          const result = placeLimitOrder(account, {
            marginMode: 'isolated',
            symbol,
            side: randomSide(),
            qty: randomQty(mark),
            limitPrice: mark * (0.92 + rng() * 0.16),
            leverage: randomLeverage(),
            now: NOW,
          });
          if (result.ok) account = result.account;
        } else if (roll < 0.44) {
          const position = randomPosition();
          if (position !== undefined) {
            // 涵蓋深度 marketable 平倉限價（Fable 場景一般化）：0.6–1.4 倍 mark。
            const result = placeCloseLimit(account, {
              positionId: position.id,
              qty: position.qty * (0.2 + rng() * 0.9),
              limitPrice: marks[position.symbol] * (0.6 + rng() * 0.8),
              now: NOW,
            });
            if (result.ok) account = result.account;
          }
        } else if (roll < 0.5) {
          const order = account.orders[Math.floor(rng() * account.orders.length)];
          if (order !== undefined) {
            const result = cancelOrder(account, order.id);
            if (result.ok) account = result.account;
          }
        } else if (roll < 0.58) {
          const position = randomPosition();
          if (position !== undefined) {
            const result = closePositionMarket(account, {
              positionId: position.id,
              fraction: rng(),
              price: marks[position.symbol],
              now: NOW,
            });
            if (result.ok) account = result.account;
          }
        } else if (roll < 0.68) {
          const position = randomPosition();
          if (position !== undefined) {
            const tp = setTakeProfit(
              account,
              position.id,
              position.entryPrice * (0.9 + rng() * 0.2),
            );
            if (tp.ok) account = tp.account;
            const sl = setStopLoss(account, position.id, position.entryPrice * (0.9 + rng() * 0.2));
            if (sl.ok) account = sl.account;
          }
        } else if (roll < 0.74) {
          const position = randomPosition();
          if (position !== undefined) {
            const positionMark = marks[position.symbol];
            const result = setTrailingStop(account, position.id, {
              activationPrice: positionMark * (0.97 + rng() * 0.06),
              distance: positionMark * (0.002 + rng() * 0.01),
            });
            if (result.ok) account = result.account;
          }
        } else {
          const nextMark = Math.max(mark * (0.9 + rng() * 0.2), 0.0001);
          marks[symbol] = nextMark;
          account = processTick(account, symbol, nextMark, NOW).account;
        }

        expectInvariant(account);
      }

      expect(account.history.length).toBeGreaterThan(0);
    }
  });
});

describe('getAccountMetrics', () => {
  it('computes equity = available + used margin + unrealized pnl', () => {
    let account = openLong(createInitialAccount(), 0.1, 60000, 10);
    const placed = placeLimitOrder(account, {
      marginMode: 'isolated',
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
