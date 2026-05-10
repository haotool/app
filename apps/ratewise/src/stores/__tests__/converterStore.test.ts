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
import type { ConversionHistoryEntry, CurrencyCode } from '../../features/ratewise/types';
import type { RateProviderPreference } from '../../features/ratewise/rateProviderTypes';
import { categorizeHistoryEntry, useConverterStore } from '../converterStore';

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
    providerPreference: {
      mode: 'manual',
      manualProvider: { sourceKind: 'bank', providerId: 'bot' },
    },
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
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
        },
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

  describe('providerPreference', () => {
    it('預設值為 manual + 台銀 (bot)', () => {
      const { providerPreference } = useConverterStore.getState();
      expect(providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
    });

    it('setProviderPreference 切到 exchange-shop/moneybox 同步 rateSource 與 cash 不變式', () => {
      useConverterStore.setState({ rateType: 'spot', rateSource: 'bank' });

      useConverterStore.getState().setProviderPreference({
        mode: 'manual',
        manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
      });

      const state = useConverterStore.getState();
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
      });
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('setProviderPreference 切回 bank 時，保留使用者刻意選的 rateType (cash 不被改成 spot)', () => {
      useConverterStore.setState({ rateType: 'cash', rateSource: 'exchange-shop' });

      useConverterStore.getState().setProviderPreference({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });

      const state = useConverterStore.getState();
      expect(state.providerPreference.manualProvider).toEqual({
        sourceKind: 'bank',
        providerId: 'bot',
      });
      expect(state.rateSource).toBe('bank');
      expect(state.rateType).toBe('cash');
    });

    it('setRateSource("exchange-shop") 為相容包裝，會同步寫入 providerPreference', () => {
      useConverterStore.setState({ rateType: 'spot', rateSource: 'bank' });

      useConverterStore.getState().setRateSource('exchange-shop');

      const state = useConverterStore.getState();
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
      });
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('setRateSource("bank") 為相容包裝，providerPreference 同步成 bot', () => {
      useConverterStore.getState().setRateSource('exchange-shop');
      useConverterStore.getState().setRateSource('bank');

      const state = useConverterStore.getState();
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
      expect(state.rateSource).toBe('bank');
    });

    it('setRateSource 永遠不產出 mode="best"', () => {
      useConverterStore.getState().setRateSource('bank');
      expect(useConverterStore.getState().providerPreference.mode).toBe('manual');
      useConverterStore.getState().setRateSource('exchange-shop');
      expect(useConverterStore.getState().providerPreference.mode).toBe('manual');
    });

    it('sanitize: providerPreference 為 null/undefined 時，重置為預設值且 rateSource 收斂', () => {
      useConverterStore.setState({
        providerPreference: null as unknown as RateProviderPreference,
        rateSource: 'exchange-shop',
        rateType: 'cash',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      const state = useConverterStore.getState();
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
      expect(state.rateSource).toBe('bank');
    });

    it('sanitize: providerPreference.mode 為非法值時，整體重置為預設', () => {
      useConverterStore.setState({
        providerPreference: {
          mode: 'garbage',
          manualProvider: { sourceKind: 'bank', providerId: 'bot' },
        } as unknown as RateProviderPreference,
      });

      useConverterStore.getState().__validateAndSanitize?.();

      const state = useConverterStore.getState();
      expect(state.providerPreference.mode).toBe('manual');
      expect(state.providerPreference.manualProvider).toEqual({
        sourceKind: 'bank',
        providerId: 'bot',
      });
    });

    it('sanitize: providerPreference.manualProvider 缺失（mode=manual）時，回退預設', () => {
      useConverterStore.setState({
        providerPreference: { mode: 'manual' } as unknown as RateProviderPreference,
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
    });

    it('sanitize: providerPreference.manualProvider.sourceKind 非法時，整體回退預設', () => {
      useConverterStore.setState({
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'unknown_kind', providerId: 'bot' },
        } as unknown as RateProviderPreference,
      });

      useConverterStore.getState().__validateAndSanitize?.();

      expect(useConverterStore.getState().providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
    });

    it('sanitize: providerPreference 是 exchange-shop 但 rateType=spot → rateType 修正為 cash', () => {
      useConverterStore.setState({
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
        },
        rateSource: 'exchange-shop',
        rateType: 'spot',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      const state = useConverterStore.getState();
      expect(state.providerPreference.manualProvider?.sourceKind).toBe('exchange-shop');
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('sanitize: providerPreference 與 rateSource 漂移時，以 providerPreference 為主重新推導 rateSource', () => {
      useConverterStore.setState({
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
        },
        rateSource: 'bank',
        rateType: 'spot',
      });

      useConverterStore.getState().__validateAndSanitize?.();

      const state = useConverterStore.getState();
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('migration: 舊 storage rateSource=exchange-shop 且無 providerPreference → 補上 manual moneybox', () => {
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
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
      });
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.rateType).toBe('cash');
    });

    it('migration: 舊 storage rateSource=bank → providerPreference 設為 manual bot', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          'ratewise-converter': JSON.stringify({
            state: { fromCurrency: 'USD', toCurrency: 'JPY' },
          }),
          rateSource: 'bank',
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      const state = useConverterStore.getState();
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
    });

    it('migration: 全新安裝（無 legacy keys）時，providerPreference 維持預設不變', () => {
      localStorageMock.clear();

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      const state = useConverterStore.getState();
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      });
    });

    it('migration: legacy rateSource 永遠不產出 mode="best"', () => {
      localStorageMock.clear();
      localStorageMock.getItem.mockImplementation((key: string) => {
        const legacyStore: Record<string, string> = {
          rateSource: 'exchange-shop',
        };
        return legacyStore[key] ?? null;
      });

      resetStore();
      useConverterStore.getState().__migrateFromLegacy?.();

      expect(useConverterStore.getState().providerPreference.mode).toBe('manual');
    });
  });

  describe('history SSOT', () => {
    const baseEntry = (
      overrides: Partial<ConversionHistoryEntry> = {},
    ): ConversionHistoryEntry => ({
      from: 'USD',
      to: 'TWD',
      amount: '100',
      result: '3150',
      time: '今天 14:30',
      timestamp: 1_700_000_000_000,
      rateType: 'spot',
      sourceKind: 'bank',
      providerId: 'bot',
      providerSelectionMode: 'manual',
      schemaVersion: 2,
      ...overrides,
    });

    it('addToHistory 將新紀錄置於陣列前端', () => {
      useConverterStore.getState().addToHistory(baseEntry({ amount: '100' }));
      useConverterStore.getState().addToHistory(baseEntry({ amount: '200' }));
      const list = useConverterStore.getState().history;
      expect(list[0]?.amount).toBe('200');
      expect(list[1]?.amount).toBe('100');
    });

    it('addToHistory 上限 50 筆（store SSOT）', () => {
      for (let i = 0; i < 60; i += 1) {
        useConverterStore.getState().addToHistory(baseEntry({ amount: String(i) }));
      }
      expect(useConverterStore.getState().history.length).toBe(50);
    });

    it('clearHistory 清空 history', () => {
      useConverterStore.getState().addToHistory(baseEntry());
      useConverterStore.getState().clearHistory();
      expect(useConverterStore.getState().history).toEqual([]);
    });

    describe('categorizeHistoryEntry', () => {
      it('schemaVersion=2 + bank + spot → spot', () => {
        expect(categorizeHistoryEntry(baseEntry({ rateType: 'spot' }))).toBe('spot');
      });

      it('schemaVersion=2 + bank + cash → cash', () => {
        expect(categorizeHistoryEntry(baseEntry({ rateType: 'cash' }))).toBe('cash');
      });

      it('schemaVersion=2 + exchange-shop → exchange-shop', () => {
        expect(
          categorizeHistoryEntry(
            baseEntry({
              sourceKind: 'exchange-shop',
              providerId: 'moneybox',
              rateType: 'cash',
            }),
          ),
        ).toBe('exchange-shop');
      });

      it('缺 schemaVersion 的舊紀錄 → legacy', () => {
        expect(
          categorizeHistoryEntry({
            from: 'USD',
            to: 'TWD',
            amount: '100',
            result: '3150',
            time: '昨天',
            timestamp: 1_690_000_000_000,
          }),
        ).toBe('legacy');
      });

      it('schemaVersion=2 但缺 sourceKind / rateType → legacy（不偽造分類）', () => {
        expect(categorizeHistoryEntry(baseEntry({ sourceKind: undefined }))).toBe('legacy');
        expect(categorizeHistoryEntry(baseEntry({ rateType: undefined }))).toBe('legacy');
      });
    });

    describe('legacy STORAGE_KEYS.CONVERSION_HISTORY 遷移', () => {
      it('store.history 為空時，從舊 key 遷移基本欄位（不偽造 sourceKind/providerId）', () => {
        const legacy = [
          {
            from: 'USD',
            to: 'TWD',
            amount: '50',
            result: '1575',
            time: '昨天 10:00',
            timestamp: 1_690_000_000_000,
          },
        ];
        localStorageMock.clear();
        localStorageMock.getItem.mockImplementation((key: string) => {
          if (key === 'conversionHistory') return JSON.stringify(legacy);
          return null;
        });

        resetStore();
        useConverterStore.getState().__migrateFromLegacy();

        const list = useConverterStore.getState().history;
        expect(list).toHaveLength(1);
        const entry = list[0];
        expect(entry?.from).toBe('USD');
        expect(entry?.schemaVersion).toBeUndefined();
        expect(entry?.sourceKind).toBeUndefined();
        expect(entry?.providerId).toBeUndefined();
      });

      it('store.history 已有資料時，不覆蓋（避免重複遷移）', () => {
        useConverterStore.setState({ history: [baseEntry({ amount: 'kept' })] });
        localStorageMock.getItem.mockImplementation((key: string) =>
          key === 'conversionHistory'
            ? JSON.stringify([
                {
                  from: 'USD',
                  to: 'TWD',
                  amount: 'old',
                  result: '0',
                  time: 't',
                  timestamp: 1,
                },
              ])
            : null,
        );

        useConverterStore.getState().__migrateFromLegacy();

        const list = useConverterStore.getState().history;
        expect(list).toHaveLength(1);
        expect(list[0]?.amount).toBe('kept');
      });

      it('遷移完成後一次性移除 conversionHistory legacy key', () => {
        localStorageMock.clear();
        localStorageMock.getItem.mockImplementation((key: string) =>
          key === 'conversionHistory'
            ? JSON.stringify([
                {
                  from: 'USD',
                  to: 'TWD',
                  amount: '1',
                  result: '1',
                  time: 't',
                  timestamp: 1,
                },
              ])
            : null,
        );

        resetStore();
        useConverterStore.getState().__migrateFromLegacy();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('conversionHistory');
      });
    });
  });
});
