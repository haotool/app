import { create } from 'zustand';
import { type MarketSymbol } from '../config/market';
import { type Ticker } from '../services/ticker';
import { type WsStatus } from '../services/marketWs';

interface MarketState {
  tickers: Partial<Record<MarketSymbol, Ticker>>;
  wsStatus: WsStatus;
  setTicker: (ticker: Ticker) => void;
  patchTicker: (symbol: MarketSymbol, patch: Partial<Omit<Ticker, 'symbol'>>) => void;
  setWsStatus: (status: WsStatus) => void;
}

export const useMarketStore = create<MarketState>()((set) => ({
  tickers: {},
  wsStatus: 'idle',
  setTicker: (ticker) =>
    set((state) => ({
      tickers: { ...state.tickers, [ticker.symbol]: ticker },
    })),
  patchTicker: (symbol, patch) =>
    set((state) => {
      const previous = state.tickers[symbol];
      if (previous === undefined) return state;
      return {
        tickers: { ...state.tickers, [symbol]: { ...previous, ...patch } },
      };
    }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
}));
