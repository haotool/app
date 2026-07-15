import { type MarketSymbol } from '../config/market';
import { MIN_ORDER_NOTIONAL_USDT } from '../config/trading';
import {
  averageEntryPrice,
  isValidLeverage,
  notionalValue,
  orderFee,
  requiredMargin,
  roundUsdt,
  unrealizedPnl,
} from './math';
import {
  type Account,
  type ClosedTrade,
  type CloseReason,
  type Position,
  type Side,
} from './types';

export type TradeError =
  | 'invalid-leverage'
  | 'invalid-qty'
  | 'invalid-price'
  | 'below-min-notional'
  | 'insufficient-balance'
  | 'exceeds-position'
  | 'invalid-tp-direction'
  | 'invalid-sl-direction'
  | 'not-found';

export type TradeResult = { ok: true; account: Account } | { ok: false; error: TradeError };

export const QTY_EPSILON = 1e-9;

export function createId(): string {
  return crypto.randomUUID();
}

export function validateOpenInput(qty: number, price: number, leverage: number): TradeError | null {
  if (!isValidLeverage(leverage)) return 'invalid-leverage';
  if (!Number.isFinite(qty) || qty <= 0) return 'invalid-qty';
  if (!Number.isFinite(price) || price <= 0) return 'invalid-price';
  if (notionalValue(qty, price) < MIN_ORDER_NOTIONAL_USDT) return 'below-min-notional';
  return null;
}

export function replacePosition(positions: Position[], next: Position): Position[] {
  return positions.map((position) => (position.id === next.id ? next : position));
}

function removePosition(positions: Position[], id: string): Position[] {
  return positions.filter((position) => position.id !== id);
}

export interface CloseSliceResult {
  account: Account;
  trade: ClosedTrade;
}

export function closeSlice(
  account: Account,
  position: Position,
  qty: number,
  exitPrice: number,
  feeRate: number,
  reason: CloseReason,
  now: number,
): CloseSliceResult {
  // 殘餘量低於容差視為全平，避免保證金與手續費殘屑脫離帳本。
  const isFullClose = position.qty - qty <= QTY_EPSILON;
  const fraction = isFullClose ? 1 : qty / position.qty;
  const releasedMargin = roundUsdt(position.margin * fraction);
  const releasedOpenFee = roundUsdt(position.openFee * fraction);
  const isLiquidation = reason === 'liquidation';
  const pnl = isLiquidation
    ? -releasedMargin
    : roundUsdt(unrealizedPnl(position.side, position.entryPrice, exitPrice, qty));
  const fee = isLiquidation ? 0 : roundUsdt(orderFee(notionalValue(qty, exitPrice), feeRate));

  const trade: ClosedTrade = {
    id: createId(),
    symbol: position.symbol,
    side: position.side,
    qty,
    entryPrice: position.entryPrice,
    exitPrice,
    realizedPnl: pnl,
    fee,
    openFee: releasedOpenFee,
    reason,
    closedAt: now,
  };

  const positions = isFullClose
    ? removePosition(account.positions, position.id)
    : replacePosition(account.positions, {
        ...position,
        qty: position.qty - qty,
        margin: roundUsdt(position.margin - releasedMargin),
        openFee: roundUsdt(position.openFee - releasedOpenFee),
      });

  return {
    account: {
      ...account,
      balance: roundUsdt(account.balance + releasedMargin + pnl - fee),
      positions,
      history: [trade, ...account.history],
    },
    trade,
  };
}

export interface ExecuteOpenParams {
  symbol: MarketSymbol;
  side: Side;
  qty: number;
  price: number;
  leverage: number;
  feeRate: number;
  now: number;
}

export function executeOpen(account: Account, params: ExecuteOpenParams): TradeResult {
  const { symbol, side, qty, price, leverage, feeRate, now } = params;
  const existing = account.positions.find((position) => position.symbol === symbol);

  if (existing !== undefined && existing.side !== side) {
    const reduceQty = Math.min(qty, existing.qty);
    const reduced = closeSlice(account, existing, reduceQty, price, feeRate, 'manual', now).account;
    const remainderQty = qty - reduceQty;
    if (remainderQty <= QTY_EPSILON) return { ok: true, account: reduced };
    return executeOpen(reduced, { ...params, qty: remainderQty });
  }

  const notional = notionalValue(qty, price);
  const margin = roundUsdt(requiredMargin(notional, leverage));
  const fee = roundUsdt(orderFee(notional, feeRate));
  const cost = margin + fee;
  if (cost > account.balance) return { ok: false, error: 'insufficient-balance' };

  if (existing !== undefined) {
    const mergedQty = existing.qty + qty;
    const mergedEntry = averageEntryPrice(existing.qty, existing.entryPrice, qty, price);
    const mergedMargin = roundUsdt(existing.margin + margin);
    const merged: Position = {
      ...existing,
      qty: mergedQty,
      entryPrice: mergedEntry,
      margin: mergedMargin,
      openFee: roundUsdt(existing.openFee + fee),
      leverage: notionalValue(mergedQty, mergedEntry) / mergedMargin,
    };
    return {
      ok: true,
      account: {
        ...account,
        balance: roundUsdt(account.balance - cost),
        positions: replacePosition(account.positions, merged),
      },
    };
  }

  const position: Position = {
    id: createId(),
    symbol,
    side,
    qty,
    entryPrice: price,
    margin,
    openFee: fee,
    leverage,
    openedAt: now,
    takeProfit: null,
    stopLoss: null,
    trailing: null,
  };
  return {
    ok: true,
    account: {
      ...account,
      balance: roundUsdt(account.balance - cost),
      positions: [...account.positions, position],
    },
  };
}
