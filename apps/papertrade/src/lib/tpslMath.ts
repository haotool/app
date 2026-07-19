import { type Side } from '../engine/types';

// R5-6 止盈止損三向換算（觸發價↔收益率↔收益額）純函式，UI 為薄殼。
// 收益率基準＝所選平倉量對應的保證金（margin × closeRatio），與引擎 roePercent 口徑一致。

export interface TpSlBasis {
  side: Side;
  entryPrice: number;
  // 所選平倉數量（position.qty × closeRatio）。
  closeQty: number;
  // 所選平倉量對應保證金（position.margin × closeRatio）。
  closeMargin: number;
}

function direction(side: Side): number {
  return side === 'long' ? 1 : -1;
}

export function pnlAtPrice(basis: TpSlBasis, price: number): number {
  return direction(basis.side) * (price - basis.entryPrice) * basis.closeQty;
}

export function roeAtPrice(basis: TpSlBasis, price: number): number {
  return roeFromPnl(basis, pnlAtPrice(basis, price));
}

export function priceFromPnl(basis: TpSlBasis, pnl: number): number {
  if (basis.closeQty <= 0) return Number.NaN;
  return basis.entryPrice + (direction(basis.side) * pnl) / basis.closeQty;
}

export function priceFromRoe(basis: TpSlBasis, roe: number): number {
  return priceFromPnl(basis, pnlFromRoe(basis, roe));
}

export function pnlFromRoe(basis: TpSlBasis, roe: number): number {
  return (roe / 100) * basis.closeMargin;
}

export function roeFromPnl(basis: TpSlBasis, pnl: number): number {
  if (basis.closeMargin <= 0) return 0;
  return (pnl / basis.closeMargin) * 100;
}
