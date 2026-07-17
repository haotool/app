import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import { SYMBOLS, type MarketSymbol } from '../config/market';
import { INDICATOR_IDS, type IndicatorId } from '../lib/indicators';

export const MARKET_PREFS_STORAGE_KEY = 'papertrade:market-prefs';
export const MARKET_PREFS_STORAGE_VERSION = 2;

// indicators 以 default 補值：v1 存檔（僅 favorites）可無損升級。
const persistedMarketPrefsSchema = z.object({
  favorites: z.array(z.enum(SYMBOLS)),
  indicators: z.array(z.enum(INDICATOR_IDS)).default([]),
});

export interface PersistedMarketPrefs {
  favorites: MarketSymbol[];
  indicators: IndicatorId[];
}

export function parsePersistedMarketPrefs(value: unknown): PersistedMarketPrefs | null {
  const parsed = persistedMarketPrefsSchema.safeParse(value);
  if (!parsed.success) return null;
  return {
    favorites: [...new Set(parsed.data.favorites)],
    indicators: [...new Set(parsed.data.indicators)],
  };
}

interface MarketPrefsState {
  favorites: MarketSymbol[];
  indicators: IndicatorId[];
  toggleFavorite: (symbol: MarketSymbol) => void;
  toggleIndicator: (id: IndicatorId) => void;
}

export const useMarketPrefsStore = create<MarketPrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      indicators: [],
      toggleFavorite: (symbol) =>
        set((state) => ({
          favorites: state.favorites.includes(symbol)
            ? state.favorites.filter((item) => item !== symbol)
            : [...state.favorites, symbol],
        })),
      toggleIndicator: (id) =>
        set((state) => ({
          indicators: state.indicators.includes(id)
            ? state.indicators.filter((item) => item !== id)
            : [...state.indicators, id],
        })),
    }),
    {
      name: MARKET_PREFS_STORAGE_KEY,
      version: MARKET_PREFS_STORAGE_VERSION,
      partialize: (state) => ({ favorites: state.favorites, indicators: state.indicators }),
      // v1 → v2：payload 原樣通過，缺漏欄位由 schema default 補值。
      // 其餘版本回傳空物件哨兵使 parse 失敗，落入 merge 的安全重置路徑。
      migrate: (persisted, version) => (version === 1 ? persisted : {}),
      merge: (persisted, current) => {
        const parsed = parsePersistedMarketPrefs(persisted);
        if (parsed === null) return current;
        return { ...current, favorites: parsed.favorites, indicators: parsed.indicators };
      },
    },
  ),
);
