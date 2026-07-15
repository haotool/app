import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';
import { SYMBOLS, type MarketSymbol } from '../config/market';

export const MARKET_PREFS_STORAGE_KEY = 'papertrade:market-prefs';
export const MARKET_PREFS_STORAGE_VERSION = 1;

const persistedMarketPrefsSchema = z.object({
  favorites: z.array(z.enum(SYMBOLS)),
});

export interface PersistedMarketPrefs {
  favorites: MarketSymbol[];
}

export function parsePersistedMarketPrefs(value: unknown): PersistedMarketPrefs | null {
  const parsed = persistedMarketPrefsSchema.safeParse(value);
  if (!parsed.success) return null;
  return { favorites: [...new Set(parsed.data.favorites)] };
}

interface MarketPrefsState {
  favorites: MarketSymbol[];
  toggleFavorite: (symbol: MarketSymbol) => void;
}

export const useMarketPrefsStore = create<MarketPrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      toggleFavorite: (symbol) =>
        set((state) => ({
          favorites: state.favorites.includes(symbol)
            ? state.favorites.filter((item) => item !== symbol)
            : [...state.favorites, symbol],
        })),
    }),
    {
      name: MARKET_PREFS_STORAGE_KEY,
      version: MARKET_PREFS_STORAGE_VERSION,
      partialize: (state) => ({ favorites: state.favorites }),
      // 版本不符回傳空物件哨兵使 parse 失敗，落入 merge 的安全重置路徑。
      migrate: () => ({}),
      merge: (persisted, current) => {
        const parsed = parsePersistedMarketPrefs(persisted);
        if (parsed === null) return current;
        return { ...current, favorites: parsed.favorites };
      },
    },
  ),
);
