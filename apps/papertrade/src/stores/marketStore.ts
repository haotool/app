import { create } from 'zustand';
import { type MarketSymbol } from '../config/market';
import { type MarkMap } from '../engine/math';
import { type Position } from '../engine/types';
import { type Ticker } from '../services/ticker';
import { type WsStatus } from '../services/marketWs';

export type TickDirection = 'up' | 'down' | null;

export interface MarketTicker extends Ticker {
  direction: TickDirection;
  revision: number;
  // 標記價變動計數（R6-4 觀察面）：僅 markPrice 變化時遞增，供持倉卡 uPnL flash 對齊強平依據價。
  markRevision: number;
}

interface MarketState {
  tickers: Partial<Record<MarketSymbol, MarketTicker>>;
  wsStatus: WsStatus;
  setTicker: (ticker: Ticker) => void;
  patchTicker: (symbol: MarketSymbol, patch: Partial<Omit<Ticker, 'symbol'>>) => void;
  setWsStatus: (status: WsStatus) => void;
}

function resolveDirection(previous: MarketTicker | undefined, nextPrice: number): TickDirection {
  if (previous === undefined || nextPrice === previous.lastPrice) {
    return previous?.direction ?? null;
  }
  return nextPrice > previous.lastPrice ? 'up' : 'down';
}

// 持倉標記價快照 SSOT：cross 帳務（可用資金／估算強平／聚合評估）皆由此單點收集，
// 缺行情 symbol 一律不寫入（下游以 undefined 判定保守路徑）。
export function collectPositionMarks(
  tickers: Partial<Record<MarketSymbol, MarketTicker>>,
  positions: Position[],
): MarkMap {
  const marks: MarkMap = {};
  for (const position of positions) {
    const ticker = tickers[position.symbol];
    if (ticker !== undefined) marks[position.symbol] = ticker.markPrice;
  }
  return marks;
}

export const useMarketStore = create<MarketState>()((set) => ({
  tickers: {},
  wsStatus: 'idle',
  setTicker: (ticker) =>
    set((state) => {
      const previous = state.tickers[ticker.symbol];
      const changed = ticker.lastPrice !== previous?.lastPrice;
      const markChanged = ticker.markPrice !== previous?.markPrice;
      const next: MarketTicker = {
        ...ticker,
        direction: resolveDirection(previous, ticker.lastPrice),
        revision: changed ? (previous?.revision ?? 0) + 1 : (previous?.revision ?? 0),
        markRevision: markChanged
          ? (previous?.markRevision ?? 0) + 1
          : (previous?.markRevision ?? 0),
      };
      return { tickers: { ...state.tickers, [ticker.symbol]: next } };
    }),
  patchTicker: (symbol, patch) =>
    set((state) => {
      const previous = state.tickers[symbol];
      if (previous === undefined) return state;
      const nextPrice = patch.lastPrice ?? previous.lastPrice;
      const changed = nextPrice !== previous.lastPrice;
      const nextMark = patch.markPrice ?? previous.markPrice;
      const markChanged = nextMark !== previous.markPrice;
      const next: MarketTicker = {
        ...previous,
        ...patch,
        direction: resolveDirection(previous, nextPrice),
        revision: changed ? previous.revision + 1 : previous.revision,
        markRevision: markChanged ? previous.markRevision + 1 : previous.markRevision,
      };
      return { tickers: { ...state.tickers, [symbol]: next } };
    }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
}));
