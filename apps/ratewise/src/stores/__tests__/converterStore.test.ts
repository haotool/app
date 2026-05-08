// @vitest-environment jsdom

/**
 * converterStore 單元測試
 *
 * 涵蓋：
 * - toggleFavorite、reorderFavorites、setMode
 * - 簡化後的 isFavorite(code) 簽名
 * - swapCurrencies
 * - localStorage 舊 key 遷移邏輯
 * - hydrate 後的 schema 驗證與狀態修復
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CurrencyCode } from '../../features/ratewise/types';
import { useConverterStore } from '../converterStore';

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _store: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── Store reset helper ────────────────────────────────────────────────────────
const resetStore = () => {
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'JPY',
    mode: 'single',
    rateType: 'spot',
    rateSource: 'bank',
    favorites: ['JPY', 'KRW', 'VND', 'THB', 'HKD', 'USD'],
    history: [],
  });
};

// ─────────────────────────────────────────────────────────────────────────────

describe('converterStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    resetStore();
  });

  // ── setFromCurrency / setToCurrency ──────────────────────────────────────
  describe('setFromCurrency / setToCurrency', () => {
    it('updates fromCurrency', () => {
      useConverterStore.getState().setFromCurrency('USD');
      expect(useConverterStore.getState().fromCurrency).toBe('USD');
    });

    it('updates toCurrency', () => {
      useConverterStore.getState().setToCurrency('EUR');
      expect(useConverterStore.getState().toCurrency).toBe('EUR');
    });
  });

  // ── setMode ──────────────────────────────────────────────────────────────
  describe('setMode', () => {
    it('switches mode to multi', () => {
      useConverterStore.getState().setMode('multi');
      expect(useConverterStore.getState().mode).toBe('multi');
    });

    it('switches mode back to single', () => {
      useConverterStore.getState().setMode('multi');
      useConverterStore.getState().setMode('single');
      expect(useConverterStore.getState().mode).toBe('single');
    });
  });

  // ── setRateType / setRateSource ──────────────────────────────────────────
  describe('setRateType / setRateSource', () => {
    it('setRateType 直接更新 rateType', () => {
      useConverterStore.getState().setRateType('cash');
      expect(useConverterStore.getState().rateType).toBe('cash');
    });

    it('rateSource=exchange-shop 時，直接 setRateType("spot") 也必須維持 cash', () => {
      useConverterStore.setState({ rateType: 'cash', rateSource: 'exchange-shop' });
      useConverterStore.getState().setRateType('spot');

      const state = useConverterStore.getState();
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('setRateSource("exchange-shop") 自動同步 rateType=cash（SSOT 不變式）', () => {
      // 起始 rateType=spot，切到換錢所必須同步成 cash，避免 single/multi page 各自再寫一份 effect
      useConverterStore.setState({ rateType: 'spot', rateSource: 'bank' });
      useConverterStore.getState().setRateSource('exchange-shop');
      const state = useConverterStore.getState();
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('setRateSource("bank") 不應重置 rateType（保留使用者偏好）', () => {
      useConverterStore.setState({ rateType: 'cash', rateSource: 'exchange-shop' });
      useConverterStore.getState().setRateSource('bank');
      const state = useConverterStore.getState();
      expect(state.rateSource).toBe('bank');
      // bank 模式同時支援 spot / cash，使用者刻意設的 cash 必須保留
      expect(state.rateType).toBe('cash');
    });
  });

  // ── swapCurrencies ───────────────────────────────────────────────────────
  describe('swapCurrencies', () => {
    it('swaps fromCurrency and toCurrency', () => {
      useConverterStore.setState({ fromCurrency: 'TWD', toCurrency: 'USD' });
      useConverterStore.getState().swapCurrencies();
      const { fromCurrency, toCurrency } = useConverterStore.getState();
      expect(fromCurrency).toBe('USD');
      expect(toCurrency).toBe('TWD');
    });
  });

  // ── toggleFavorite ───────────────────────────────────────────────────────
  describe('toggleFavorite', () => {
    it('adds a new currency to favorites', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD'] });
      useConverterStore.getState().toggleFavorite('EUR');
      expect(useConverterStore.getState().favorites).toContain('EUR');
    });

    it('removes an existing currency from favorites', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD', 'EUR'] });
      useConverterStore.getState().toggleFavorite('USD');
      expect(useConverterStore.getState().favorites).not.toContain('USD');
    });

    it('does not duplicate a currency already in favorites', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD'] });
      useConverterStore.getState().toggleFavorite('USD');
      const { favorites } = useConverterStore.getState();
      expect(favorites.filter((c) => c === 'USD')).toHaveLength(0);
    });

    it('preserves order of other favorites when removing', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD', 'EUR'] });
      useConverterStore.getState().toggleFavorite('USD');
      expect(useConverterStore.getState().favorites).toEqual(['JPY', 'EUR']);
    });

    // TWD 永久收藏保護
    it('is a no-op when called with TWD — TWD cannot be toggled off', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD'] });
      useConverterStore.getState().toggleFavorite('TWD');
      expect(useConverterStore.getState().favorites).not.toContain('TWD');
    });

    it('remains a complete no-op even if TWD is somehow in favorites array', () => {
      useConverterStore.setState({ favorites: ['TWD', 'JPY'] });
      const before = useConverterStore.getState().favorites;
      useConverterStore.getState().toggleFavorite('TWD');
      // toggleFavorite('TWD') 是完全 no-op：不移除、不新增，狀態不變
      expect(useConverterStore.getState().favorites).toEqual(before);
      expect(useConverterStore.getState().favorites).toContain('JPY');
    });
  });

  // ── TWD 永久收藏（基準幣） ────────────────────────────────────────────────
  describe('TWD as permanent base currency', () => {
    it('never appears in favorites array after reorderFavorites', () => {
      useConverterStore.getState().reorderFavorites(['TWD', 'JPY', 'USD']);
      expect(useConverterStore.getState().favorites).not.toContain('TWD');
    });

    it('__validateAndSanitize removes TWD if corrupted into favorites', () => {
      useConverterStore.setState({ favorites: ['TWD', 'JPY', 'USD'] });
      useConverterStore.getState().__validateAndSanitize();
      const { favorites } = useConverterStore.getState();
      expect(favorites).not.toContain('TWD');
      expect(favorites).toContain('JPY');
      expect(favorites).toContain('USD');
    });
  });

  // ── reorderFavorites ─────────────────────────────────────────────────────
  describe('reorderFavorites', () => {
    it('replaces favorites with the given order', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD', 'EUR'] });
      useConverterStore.getState().reorderFavorites(['EUR', 'JPY', 'USD']);
      expect(useConverterStore.getState().favorites).toEqual(['EUR', 'JPY', 'USD']);
    });

    it('allows setting an empty favorites list', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD'] });
      useConverterStore.getState().reorderFavorites([]);
      expect(useConverterStore.getState().favorites).toEqual([]);
    });
  });

  // ── isFavorite ───────────────────────────────────────────────────────────
  describe('isFavorite', () => {
    it('returns true when code is in favorites', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD'] });
      expect(useConverterStore.getState().isFavorite('JPY')).toBe(true);
    });

    it('returns false when code is not in favorites', () => {
      useConverterStore.setState({ favorites: ['JPY', 'USD'] });
      expect(useConverterStore.getState().isFavorite('EUR')).toBe(false);
    });
  });

  // ── localStorage migration ───────────────────────────────────────────────
  describe('legacy localStorage migration', () => {
    it('reads fromCurrency from legacy key when ratewise-converter is absent', () => {
      // Simulate old-format storage (no ratewise-converter key yet)
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          fromCurrency: 'USD',
          toCurrency: 'KRW',
          currencyConverterMode: 'multi',
          favorites: JSON.stringify(['USD', 'EUR']),
        };
        return legacyStore[key] ?? null;
      });

      // Reset store to defaults then trigger migration manually
      resetStore();
      // Migration is triggered by onRehydrateStorage — call the exported helper
      useConverterStore.getState().__migrateFromLegacy?.();

      // After migration, store should reflect legacy values
      const state = useConverterStore.getState();
      expect(state.fromCurrency).toBe('USD');
      expect(state.toCurrency).toBe('KRW');
      expect(state.mode).toBe('multi');
      expect(state.favorites).toEqual(['USD', 'EUR']);
    });

    it('does not overwrite existing ratewise-converter data', () => {
      // Simulate already-migrated user (ratewise-converter key exists)
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'ratewise-converter') return JSON.stringify({ state: { fromCurrency: 'EUR' } });
        if (key === 'fromCurrency') return 'JPY'; // stale legacy key
        return null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      // Store should keep the reset state (not overwrite with legacy JPY)
      expect(useConverterStore.getState().fromCurrency).toBe('TWD');
    });

    it('removes legacy keys after migration', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          fromCurrency: 'USD',
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fromCurrency');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('toCurrency');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('currencyConverterMode');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('favorites');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rateType');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rateSource');
    });

    it('rateType / rateSource 即使 ratewise-converter 已存在仍要遷移（新加入欄位）', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          // 模擬已有舊版 store 但未含 rateType/rateSource（v2.7.1+ 持久化結構）
          'ratewise-converter': JSON.stringify({
            state: { fromCurrency: 'USD', toCurrency: 'JPY' },
          }),
          rateType: 'cash',
          rateSource: 'exchange-shop',
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      const state = useConverterStore.getState();
      expect(state.rateType).toBe('cash');
      expect(state.rateSource).toBe('exchange-shop');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rateType');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rateSource');
    });

    it('legacy key 只有 exchange-shop 時，遷移後也必須自動收斂成 cash', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          'ratewise-converter': JSON.stringify({
            state: { fromCurrency: 'USD', toCurrency: 'JPY' },
          }),
          rateSource: 'exchange-shop',
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      const state = useConverterStore.getState();
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('rateType 為非合法值時不寫入 patch（保留 store 預設）', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          rateType: 'invalid_value',
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      // 非 spot/cash 不應寫入 store，保留 reset 後的 'spot'
      expect(useConverterStore.getState().rateType).toBe('spot');
    });

    it('使用者刻意清空收藏（[]）時，遷移後應保留空收藏而非恢復預設值', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          favorites: JSON.stringify([]),
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      // 使用者的空收藏必須被尊重，不應回復為預設值
      expect(useConverterStore.getState().favorites).toEqual([]);
    });

    it('舊版 favorites 含無效代碼時，過濾後仍寫入空陣列（尊重使用者曾自訂收藏的意圖）', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          favorites: JSON.stringify(['INVALID_CODE', 'NOT_A_CURRENCY']),
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      // 所有代碼無效時過濾結果為 []，仍應遷移為空而非預設
      expect(useConverterStore.getState().favorites).toEqual([]);
    });

    it('舊版 favorites 含有效與無效混合代碼時，僅保留有效代碼', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          favorites: JSON.stringify(['JPY', 'INVALID_CODE', 'USD']),
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      expect(useConverterStore.getState().favorites).toEqual(['JPY', 'USD']);
    });
  });

  // ── hydrated state schema validation ─────────────────────────────────────
  describe('hydrated state schema validation (__validateAndSanitize)', () => {
    it('過濾 favorites 中不合法的貨幣代碼（舊 CurrencyPair 物件格式）', () => {
      // 模擬舊版 favorites 為 CurrencyPair[]（物件陣列）被 hydrate 進 store
      useConverterStore.setState({
        favorites: [{ from: 'USD', to: 'JPY' }, 'JPY'] as unknown as CurrencyCode[],
      });

      useConverterStore.getState().__validateAndSanitize?.();

      // 物件型別無效，應被過濾；'JPY' 為合法代碼，應保留
      expect(useConverterStore.getState().favorites).toEqual(['JPY']);
    });

    it('favorites 含純無效字串代碼時，過濾後為空陣列', () => {
      useConverterStore.setState({
        favorites: ['NOT_A_CODE', 'INVALID'] as unknown as CurrencyCode[],
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().favorites).toEqual([]);
    });

    it('favorites 為非陣列型別時，重置為預設收藏', () => {
      useConverterStore.setState({
        favorites: 'corrupted' as unknown as CurrencyCode[],
      });

      useConverterStore.getState().__validateAndSanitize?.();

      // 非陣列無法修復，回退預設值
      const { favorites } = useConverterStore.getState();
      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeGreaterThan(0);
    });

    it('fromCurrency 為非有效代碼時，重置為 DEFAULT_FROM_CURRENCY', () => {
      useConverterStore.setState({
        fromCurrency: 'INVALID' as unknown as CurrencyCode,
      });

      useConverterStore.getState().__validateAndSanitize?.();

      // 不合法代碼應重置為預設值（TWD）
      expect(useConverterStore.getState().fromCurrency).toBe('TWD');
    });

    it('toCurrency 為非有效代碼時，重置為 DEFAULT_TO_CURRENCY', () => {
      useConverterStore.setState({
        toCurrency: 'BROKEN' as unknown as CurrencyCode,
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().toCurrency).toBe('JPY');
    });

    it('mode 為非法值時，重置為 single', () => {
      useConverterStore.setState({
        mode: 'invalid_mode' as unknown as 'single' | 'multi',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().mode).toBe('single');
    });

    it('rateType 為非法值時，重置為 spot', () => {
      useConverterStore.setState({
        rateType: 'broken' as unknown as 'spot' | 'cash',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().rateType).toBe('spot');
    });

    it('rateSource 為非法值時，重置為 bank', () => {
      useConverterStore.setState({
        rateSource: 'unknown_source' as unknown as 'bank' | 'exchange-shop',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().rateSource).toBe('bank');
    });

    it('exchange-shop 與 spot 的非法組合會被修正回 cash', () => {
      useConverterStore.setState({
        rateType: 'spot',
        rateSource: 'exchange-shop',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      const state = useConverterStore.getState();
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('所有欄位合法時，不修改 store 狀態', () => {
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'JPY',
        mode: 'multi',
        favorites: ['USD', 'EUR'],
      });

      useConverterStore.getState().__validateAndSanitize?.();

      const state = useConverterStore.getState();
      expect(state.fromCurrency).toBe('USD');
      expect(state.toCurrency).toBe('JPY');
      expect(state.mode).toBe('multi');
      expect(state.favorites).toEqual(['USD', 'EUR']);
    });
  });
});
