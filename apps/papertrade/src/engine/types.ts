import { type MarketSymbol } from '../config/market';

export type Side = 'long' | 'short';

// 保證金模式（R6-2，per-position 快照制）：isolated＝逐倉獨立強平；cross＝全倉聚合強平。
export type MarginMode = 'isolated' | 'cross';

export type CloseReason = 'manual' | 'tp' | 'sl' | 'trailing' | 'liquidation';

export interface TrailingConfig {
  activationPrice: number;
  distance: number;
  active: boolean;
  extremePrice: number | null;
}

export interface Position {
  id: string;
  symbol: MarketSymbol;
  side: Side;
  qty: number;
  entryPrice: number;
  margin: number;
  openFee: number;
  leverage: number;
  marginMode: MarginMode;
  openedAt: number;
  takeProfit: number | null;
  stopLoss: number | null;
  // TP/SL 觸發時平倉的數量比例（0<r≤1）；1＝全平（R5-6 部分止盈止損）。
  tpSlCloseRatio: number;
  trailing: TrailingConfig | null;
}

export type OrderKind = 'open' | 'close';

export interface LimitOrder {
  id: string;
  kind: OrderKind;
  symbol: MarketSymbol;
  side: Side;
  qty: number;
  limitPrice: number;
  leverage: number;
  marginMode: MarginMode;
  margin: number;
  fee: number;
  positionId: string | null;
  createdAt: number;
  takeProfit: number | null;
  stopLoss: number | null;
}

export interface ClosedTrade {
  id: string;
  symbol: MarketSymbol;
  side: Side;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  fee: number;
  openFee: number;
  reason: CloseReason;
  closedAt: number;
}

export interface Account {
  balance: number;
  positions: Position[];
  orders: LimitOrder[];
  history: ClosedTrade[];
}

export type TradeEvent =
  | { type: 'limit-filled'; symbol: MarketSymbol; side: Side; qty: number; price: number }
  | {
      type: 'close-filled';
      symbol: MarketSymbol;
      side: Side;
      qty: number;
      price: number;
      pnl: number;
    }
  | { type: 'tp'; symbol: MarketSymbol; side: Side; pnl: number }
  | { type: 'sl'; symbol: MarketSymbol; side: Side; pnl: number }
  | { type: 'trailing'; symbol: MarketSymbol; side: Side; pnl: number }
  | { type: 'liquidation'; symbol: MarketSymbol; side: Side; loss: number };
