import { LEVERAGE_MAX, LEVERAGE_MIN, MAINTENANCE_MARGIN_RATE } from '../config/trading';
import { type Side } from './types';

export function roundUsdt(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

export function notionalValue(qty: number, price: number): number {
  return qty * price;
}

export function requiredMargin(notional: number, leverage: number): number {
  return notional / leverage;
}

export function orderFee(notional: number, feeRate: number): number {
  return notional * feeRate;
}

export function unrealizedPnl(side: Side, entryPrice: number, markPrice: number, qty: number) {
  return side === 'long' ? (markPrice - entryPrice) * qty : (entryPrice - markPrice) * qty;
}

export function roePercent(pnl: number, margin: number): number {
  if (margin <= 0) return 0;
  return (pnl / margin) * 100;
}

export function liquidationPrice(side: Side, entryPrice: number, leverage: number): number {
  return side === 'long'
    ? entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE)
    : entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE);
}

export function averageEntryPrice(
  qtyA: number,
  priceA: number,
  qtyB: number,
  priceB: number,
): number {
  return (qtyA * priceA + qtyB * priceB) / (qtyA + qtyB);
}

export function isValidLeverage(leverage: number): boolean {
  return Number.isFinite(leverage) && leverage >= LEVERAGE_MIN && leverage <= LEVERAGE_MAX;
}

// 合併倉位的衍生槓桿因 margin 捨入可能微幅越界，夾回合法域以維持 persist schema 恆成立。
export function clampLeverage(leverage: number): number {
  return Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, leverage));
}
