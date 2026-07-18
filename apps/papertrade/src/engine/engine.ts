import { type MarketSymbol } from '../config/market';
import { INITIAL_BALANCE_USDT, MAKER_FEE_RATE, TAKER_FEE_RATE } from '../config/trading';
import {
  liquidationPrice,
  notionalValue,
  orderFee,
  requiredMargin,
  roundUsdt,
  unrealizedPnl,
} from './math';
import {
  closeSlice,
  createId,
  executeOpen,
  QTY_EPSILON,
  replacePosition,
  validateOpenInput,
  validateOpenTpSl,
  type TradeError,
  type TradeResult,
} from './execution';
import {
  type Account,
  type ClosedTrade,
  type LimitOrder,
  type Position,
  type Side,
  type TradeEvent,
  type TrailingConfig,
} from './types';

export { type TradeError, type TradeResult } from './execution';

export interface OpenParams {
  symbol: MarketSymbol;
  side: Side;
  qty: number;
  price: number;
  leverage: number;
  now?: number;
  tp?: number;
  sl?: number;
}

export interface CloseParams {
  positionId: string;
  fraction: number;
  price: number;
  now?: number;
}

export interface LimitParams {
  symbol: MarketSymbol;
  side: Side;
  qty: number;
  limitPrice: number;
  leverage: number;
  now?: number;
  tp?: number;
  sl?: number;
}

export interface CloseLimitParams {
  positionId: string;
  qty: number;
  limitPrice: number;
  now?: number;
}

export interface TrailingParams {
  activationPrice: number;
  distance: number;
}

export interface AccountMetrics {
  available: number;
  usedMargin: number;
  totalUpnl: number;
  equity: number;
}

// 觸價比較的相對容差：吸收 liquidationPrice 浮點運算誤差，避免 mark 恰好等於強平價時漏觸發。
const PRICE_EPSILON_RATIO = 1e-9;

export function createInitialAccount(): Account {
  return { balance: INITIAL_BALANCE_USDT, positions: [], orders: [], history: [] };
}

// 同 symbol 同向持倉存在＝本次為加倉合併：executeOpen 沿用倉上 TP/SL，不驗證表單值以免假性拒單。
function hasSameSidePosition(account: Account, symbol: MarketSymbol, side: Side): boolean {
  return account.positions.some((position) => position.symbol === symbol && position.side === side);
}

export function openMarket(account: Account, params: OpenParams): TradeResult {
  const error =
    validateOpenInput(params.qty, params.price, params.leverage) ??
    (hasSameSidePosition(account, params.symbol, params.side)
      ? null
      : validateOpenTpSl(params.side, params.price, params.tp, params.sl));
  if (error !== null) return { ok: false, error };
  return executeOpen(account, {
    ...params,
    feeRate: TAKER_FEE_RATE,
    now: params.now ?? Date.now(),
  });
}

export type CloseTradeResult =
  | { ok: true; account: Account; trade: ClosedTrade }
  | { ok: false; error: TradeError };

export function closePositionMarket(account: Account, params: CloseParams): CloseTradeResult {
  const { positionId, fraction, price } = params;
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction > 1) {
    return { ok: false, error: 'invalid-qty' };
  }
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: 'invalid-price' };
  const position = account.positions.find((candidate) => candidate.id === positionId);
  if (position === undefined) return { ok: false, error: 'not-found' };

  const qty = fraction >= 1 ? position.qty : position.qty * fraction;
  const { account: next, trade } = closeSlice(
    account,
    position,
    qty,
    price,
    TAKER_FEE_RATE,
    'manual',
    params.now ?? Date.now(),
  );
  return { ok: true, account: next, trade };
}

export function placeLimitOrder(account: Account, params: LimitParams): TradeResult {
  const { symbol, side, qty, limitPrice, leverage } = params;
  const error =
    validateOpenInput(qty, limitPrice, leverage) ??
    (hasSameSidePosition(account, symbol, side)
      ? null
      : validateOpenTpSl(side, limitPrice, params.tp, params.sl));
  if (error !== null) return { ok: false, error };

  const notional = notionalValue(qty, limitPrice);
  const margin = roundUsdt(requiredMargin(notional, leverage));
  const fee = roundUsdt(orderFee(notional, MAKER_FEE_RATE));
  const cost = margin + fee;
  if (cost > account.balance) return { ok: false, error: 'insufficient-balance' };

  const order: LimitOrder = {
    id: createId(),
    kind: 'open',
    symbol,
    side,
    qty,
    limitPrice,
    leverage,
    margin,
    fee,
    positionId: null,
    createdAt: params.now ?? Date.now(),
    takeProfit: params.tp ?? null,
    stopLoss: params.sl ?? null,
  };
  return {
    ok: true,
    account: {
      ...account,
      balance: roundUsdt(account.balance - cost),
      orders: [...account.orders, order],
    },
  };
}

function pendingCloseQty(account: Account, positionId: string): number {
  return account.orders.reduce(
    (sum, order) =>
      order.kind === 'close' && order.positionId === positionId ? sum + order.qty : sum,
    0,
  );
}

export function placeCloseLimit(account: Account, params: CloseLimitParams): TradeResult {
  const { positionId, qty, limitPrice } = params;
  const position = account.positions.find((candidate) => candidate.id === positionId);
  if (position === undefined) return { ok: false, error: 'not-found' };
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: 'invalid-qty' };
  if (qty > position.qty - pendingCloseQty(account, positionId) + QTY_EPSILON) {
    return { ok: false, error: 'exceeds-position' };
  }
  if (!Number.isFinite(limitPrice) || limitPrice <= 0) return { ok: false, error: 'invalid-price' };

  const order: LimitOrder = {
    id: createId(),
    kind: 'close',
    symbol: position.symbol,
    side: position.side,
    qty,
    limitPrice,
    leverage: position.leverage,
    margin: 0,
    fee: 0,
    positionId,
    createdAt: params.now ?? Date.now(),
    takeProfit: null,
    stopLoss: null,
  };
  return { ok: true, account: { ...account, orders: [...account.orders, order] } };
}

export function cancelOrder(account: Account, orderId: string): TradeResult {
  const order = account.orders.find((candidate) => candidate.id === orderId);
  if (order === undefined) return { ok: false, error: 'not-found' };
  const refund = order.kind === 'open' ? order.margin + order.fee : 0;
  return {
    ok: true,
    account: {
      ...account,
      balance: roundUsdt(account.balance + refund),
      orders: account.orders.filter((candidate) => candidate.id !== orderId),
    },
  };
}

export function setTakeProfit(
  account: Account,
  positionId: string,
  price: number | null,
): TradeResult {
  return updatePosition(account, positionId, (position) => {
    if (price === null) return { ...position, takeProfit: null };
    if (!Number.isFinite(price) || price <= 0) return 'invalid-price';
    const directionValid =
      position.side === 'long' ? price > position.entryPrice : price < position.entryPrice;
    if (!directionValid) return 'invalid-tp-direction';
    return { ...position, takeProfit: price };
  });
}

export function setStopLoss(
  account: Account,
  positionId: string,
  price: number | null,
): TradeResult {
  return updatePosition(account, positionId, (position) => {
    if (price === null) return { ...position, stopLoss: null };
    if (!Number.isFinite(price) || price <= 0) return 'invalid-price';
    const directionValid =
      position.side === 'long' ? price < position.entryPrice : price > position.entryPrice;
    if (!directionValid) return 'invalid-sl-direction';
    return { ...position, stopLoss: price };
  });
}

// 原子套用 TP/SL：任一驗證失敗即整筆拒絕，不留半套設定。
export function setTakeProfitStopLoss(
  account: Account,
  positionId: string,
  takeProfit: number | null,
  stopLoss: number | null,
): TradeResult {
  const tpResult = setTakeProfit(account, positionId, takeProfit);
  if (!tpResult.ok) return tpResult;
  return setStopLoss(tpResult.account, positionId, stopLoss);
}

export function setTrailingStop(
  account: Account,
  positionId: string,
  params: TrailingParams | null,
): TradeResult {
  return updatePosition(account, positionId, (position) => {
    if (params === null) return { ...position, trailing: null };
    if (
      !Number.isFinite(params.activationPrice) ||
      params.activationPrice <= 0 ||
      !Number.isFinite(params.distance) ||
      params.distance <= 0
    ) {
      return 'invalid-price';
    }
    const trailing: TrailingConfig = {
      activationPrice: params.activationPrice,
      distance: params.distance,
      active: false,
      extremePrice: null,
    };
    return { ...position, trailing };
  });
}

function updatePosition(
  account: Account,
  positionId: string,
  updater: (position: Position) => Position | TradeError,
): TradeResult {
  const position = account.positions.find((candidate) => candidate.id === positionId);
  if (position === undefined) return { ok: false, error: 'not-found' };
  const next = updater(position);
  if (typeof next === 'string') return { ok: false, error: next };
  return { ok: true, account: { ...account, positions: replacePosition(account.positions, next) } };
}

function isLiquidated(position: Position, mark: number): boolean {
  const liq = liquidationPrice(position.side, position.entryPrice, position.leverage);
  const epsilon = liq * PRICE_EPSILON_RATIO;
  return position.side === 'long' ? mark <= liq + epsilon : mark >= liq - epsilon;
}

function isStopLossHit(position: Position, mark: number): boolean {
  if (position.stopLoss === null) return false;
  return position.side === 'long' ? mark <= position.stopLoss : mark >= position.stopLoss;
}

function isTakeProfitHit(position: Position, mark: number): boolean {
  if (position.takeProfit === null) return false;
  return position.side === 'long' ? mark >= position.takeProfit : mark <= position.takeProfit;
}

interface TrailingCheck {
  trailing: TrailingConfig;
  triggered: boolean;
}

function advanceTrailing(position: Position, mark: number): TrailingCheck | null {
  const trailing = position.trailing;
  if (trailing === null) return null;

  if (!trailing.active) {
    const activated =
      position.side === 'long'
        ? mark >= trailing.activationPrice
        : mark <= trailing.activationPrice;
    if (!activated) return { trailing, triggered: false };
    return { trailing: { ...trailing, active: true, extremePrice: mark }, triggered: false };
  }

  const previousExtreme = trailing.extremePrice ?? mark;
  const extreme =
    position.side === 'long' ? Math.max(previousExtreme, mark) : Math.min(previousExtreme, mark);
  const pullback = position.side === 'long' ? extreme - mark : mark - extreme;
  const triggered = pullback >= trailing.distance;
  // 極值未推進且未觸發時回傳原 reference，避免每 tick 產生新帳戶狀態觸發 persist。
  if (!triggered && extreme === trailing.extremePrice) return { trailing, triggered: false };
  return { trailing: { ...trailing, extremePrice: extreme }, triggered };
}

export interface TickResult {
  account: Account;
  events: TradeEvent[];
}

function processPosition(
  account: Account,
  position: Position,
  mark: number,
  now: number,
  events: TradeEvent[],
): Account {
  if (isLiquidated(position, mark)) {
    const { account: next } = closeSlice(
      account,
      position,
      position.qty,
      mark,
      TAKER_FEE_RATE,
      'liquidation',
      now,
    );
    events.push({
      type: 'liquidation',
      symbol: position.symbol,
      side: position.side,
      loss: position.margin,
    });
    return next;
  }

  if (isStopLossHit(position, mark)) {
    const { account: next, trade } = closeSlice(
      account,
      position,
      position.qty,
      mark,
      TAKER_FEE_RATE,
      'sl',
      now,
    );
    events.push({
      type: 'sl',
      symbol: position.symbol,
      side: position.side,
      pnl: trade.realizedPnl,
    });
    return next;
  }

  if (isTakeProfitHit(position, mark)) {
    const { account: next, trade } = closeSlice(
      account,
      position,
      position.qty,
      mark,
      TAKER_FEE_RATE,
      'tp',
      now,
    );
    events.push({
      type: 'tp',
      symbol: position.symbol,
      side: position.side,
      pnl: trade.realizedPnl,
    });
    return next;
  }

  const check = advanceTrailing(position, mark);
  if (check === null) return account;

  if (check.triggered) {
    const { account: next, trade } = closeSlice(
      account,
      position,
      position.qty,
      mark,
      TAKER_FEE_RATE,
      'trailing',
      now,
    );
    events.push({
      type: 'trailing',
      symbol: position.symbol,
      side: position.side,
      pnl: trade.realizedPnl,
    });
    return next;
  }

  if (check.trailing === position.trailing) return account;
  return {
    ...account,
    positions: replacePosition(account.positions, { ...position, trailing: check.trailing }),
  };
}

// 觸發後優先以 mark 成交（限價或更優）；開倉單資金不足時回退以限價成交，見 processTick。
function isOpenLimitFillable(order: LimitOrder, mark: number): boolean {
  return order.side === 'long' ? mark <= order.limitPrice : mark >= order.limitPrice;
}

function isCloseLimitFillable(order: LimitOrder, mark: number): boolean {
  return order.side === 'long' ? mark >= order.limitPrice : mark <= order.limitPrice;
}

export function processTick(
  account: Account,
  symbol: MarketSymbol,
  mark: number,
  now: number,
): TickResult {
  const events: TradeEvent[] = [];
  let current = account;

  const position = current.positions.find((candidate) => candidate.symbol === symbol);
  if (position !== undefined) {
    current = processPosition(current, position, mark, now, events);
  }

  const pendingOrders = current.orders;
  for (const order of pendingOrders) {
    if (order.symbol !== symbol) continue;
    const stillPending = current.orders.some((candidate) => candidate.id === order.id);
    if (!stillPending) continue;

    if (order.kind === 'open') {
      if (!isOpenLimitFillable(order, mark)) continue;
      const refunded: Account = {
        ...current,
        balance: roundUsdt(current.balance + order.margin + order.fee),
        orders: current.orders.filter((candidate) => candidate.id !== order.id),
      };
      const openParams = {
        symbol: order.symbol,
        side: order.side,
        qty: order.qty,
        leverage: order.leverage,
        feeRate: MAKER_FEE_RATE,
        now,
        tp: order.takeProfit ?? undefined,
        sl: order.stopLoss ?? undefined,
      };
      // 先以 mark（更優價）成交；滿倉時 short 的 mark 名目可超出按 limit 預扣的額度，
      // 回退以使用者保證的限價成交（成本恰等於預扣，帳本恆安全），避免掛單靜默滯留。
      const atMark = executeOpen(refunded, { ...openParams, price: mark });
      const filled = atMark.ok
        ? atMark
        : executeOpen(refunded, { ...openParams, price: order.limitPrice });
      if (filled.ok) {
        current = filled.account;
        events.push({
          type: 'limit-filled',
          symbol: order.symbol,
          side: order.side,
          qty: order.qty,
          price: atMark.ok ? mark : order.limitPrice,
        });
        // 回退成交可能生成/合併出已越過強平價的倉位（滿倉 short limit 遇暴漲 mark）；
        // 在處理後續訂單前以同一 mark 立即強平，並同步清除指向該倉位的 close 掛單，
        // 避免事件順序失真與孤兒掛單殘留到下一筆 ticker（review #719）。
        const settled = current.positions.find((candidate) => candidate.symbol === symbol);
        if (settled !== undefined && isLiquidated(settled, mark)) {
          current = processPosition(current, settled, mark, now, events);
          current = {
            ...current,
            orders: current.orders.filter((candidate) => candidate.positionId !== settled.id),
          };
        }
      }
      continue;
    }

    const target = current.positions.find((candidate) => candidate.id === order.positionId);
    if (target === undefined) {
      current = {
        ...current,
        orders: current.orders.filter((candidate) => candidate.id !== order.id),
      };
      continue;
    }
    if (!isCloseLimitFillable(order, mark)) continue;

    const qty = Math.min(order.qty, target.qty);
    const { account: next, trade } = closeSlice(
      current,
      target,
      qty,
      mark,
      MAKER_FEE_RATE,
      'manual',
      now,
    );
    current = {
      ...next,
      orders: next.orders.filter((candidate) => candidate.id !== order.id),
    };
    events.push({
      type: 'close-filled',
      symbol: order.symbol,
      side: order.side,
      qty,
      price: mark,
      pnl: trade.realizedPnl,
    });
  }

  return { account: current, events };
}

export function getAccountMetrics(
  account: Account,
  marks: Partial<Record<MarketSymbol, number>>,
): AccountMetrics {
  const positionMargin = account.positions.reduce((sum, position) => sum + position.margin, 0);
  const orderReserved = account.orders.reduce((sum, order) => sum + order.margin + order.fee, 0);
  const totalUpnl = account.positions.reduce((sum, position) => {
    const mark = marks[position.symbol];
    if (mark === undefined) return sum;
    return sum + unrealizedPnl(position.side, position.entryPrice, mark, position.qty);
  }, 0);

  const usedMargin = positionMargin + orderReserved;
  return {
    available: account.balance,
    usedMargin,
    totalUpnl,
    equity: account.balance + usedMargin + totalUpnl,
  };
}
