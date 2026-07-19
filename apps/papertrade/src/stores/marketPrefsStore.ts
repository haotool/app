import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import { SYMBOLS, type MarketSymbol } from '../config/market';
import { INDICATOR_IDS, type IndicatorId } from '../lib/indicators';

export const MARKET_PREFS_STORAGE_KEY = 'papertrade:market-prefs';
export const MARKET_PREFS_STORAGE_VERSION = 3;

// 缺漏欄位以 default 補值：v1（僅 favorites）、v2（無圖表分析開關）存檔可無損升級。
const persistedMarketPrefsSchema = z.object({
  favorites: z.array(z.enum(SYMBOLS)),
  indicators: z.array(z.enum(INDICATOR_IDS)).default([]),
  macd: z.boolean().default(true),
  trendLines: z.boolean().default(false),
  supportResistance: z.boolean().default(false),
});

export interface PersistedMarketPrefs {
  favorites: MarketSymbol[];
  indicators: IndicatorId[];
  macd: boolean;
  trendLines: boolean;
  supportResistance: boolean;
}

export function parsePersistedMarketPrefs(value: unknown): PersistedMarketPrefs | null {
  const parsed = persistedMarketPrefsSchema.safeParse(value);
  if (!parsed.success) return null;
  return {
    favorites: [...new Set(parsed.data.favorites)],
    indicators: [...new Set(parsed.data.indicators)],
    macd: parsed.data.macd,
    trendLines: parsed.data.trendLines,
    supportResistance: parsed.data.supportResistance,
  };
}

interface MarketPrefsState extends PersistedMarketPrefs {
  toggleFavorite: (symbol: MarketSymbol) => void;
  toggleIndicator: (id: IndicatorId) => void;
  toggleMacd: () => void;
  toggleTrendLines: () => void;
  toggleSupportResistance: () => void;
}

export const useMarketPrefsStore = create<MarketPrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      indicators: [],
      macd: true,
      trendLines: false,
      supportResistance: false,
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
      toggleMacd: () => set((state) => ({ macd: !state.macd })),
      toggleTrendLines: () => set((state) => ({ trendLines: !state.trendLines })),
      toggleSupportResistance: () =>
        set((state) => ({ supportResistance: !state.supportResistance })),
    }),
    {
      name: MARKET_PREFS_STORAGE_KEY,
      version: MARKET_PREFS_STORAGE_VERSION,
      partialize: (state) => ({
        favorites: state.favorites,
        indicators: state.indicators,
        macd: state.macd,
        trendLines: state.trendLines,
        supportResistance: state.supportResistance,
      }),
      // v1/v2 → v3：payload 原樣通過，缺漏欄位由 schema default 補值（不重置整份）。
      // 其餘版本回傳空物件哨兵使 parse 失敗，落入 merge 的安全重置路徑。
      migrate: (persisted, version) => (version === 1 || version === 2 ? persisted : {}),
      merge: (persisted, current) => {
        const parsed = parsePersistedMarketPrefs(persisted);
        if (parsed === null) return current;
        return { ...current, ...parsed };
      },
    },
  ),
);
