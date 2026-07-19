import { type MarketSymbol } from '../config/market';

export type Side = 'long' | 'short';

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
