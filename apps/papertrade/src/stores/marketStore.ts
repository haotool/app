import { create } from 'zustand';
import { type MarketSymbol } from '../config/market';
import { type Ticker } from '../services/ticker';
import { type WsStatus } from '../services/marketWs';

export type TickDirection = 'up' | 'down' | null;

export interface MarketTicker extends Ticker {
  direction: TickDirection;
  revision: number;
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

export const useMarketStore = create<MarketState>()((set) => ({
  tickers: {},
  wsStatus: 'idle',
  setTicker: (ticker) =>
    set((state) => {
      const previous = state.tickers[ticker.symbol];
      const changed = ticker.lastPrice !== previous?.lastPrice;
      const next: MarketTicker = {
        ...ticker,
        direction: resolveDirection(previous, ticker.lastPrice),
        revision: changed ? (previous?.revision ?? 0) + 1 : (previous?.revision ?? 0),
      };
      return { tickers: { ...state.tickers, [ticker.symbol]: next } };
    }),
  patchTicker: (symbol, patch) =>
    set((state) => {
      const previous = state.tickers[symbol];
      if (previous === undefined) return state;
      const nextPrice = patch.lastPrice ?? previous.lastPrice;
      const changed = nextPrice !== previous.lastPrice;
      const next: MarketTicker = {
        ...previous,
        ...patch,
        direction: resolveDirection(previous, nextPrice),
        revision: changed ? previous.revision + 1 : previous.revision,
      };
      return { tickers: { ...state.tickers, [symbol]: next } };
    }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
}));
