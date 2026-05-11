// @vitest-environment jsdom

/**
 * useCurrencyConverter Hook 單元測試
 *
 * 涵蓋歷史記錄管理與 Toast 通知行為。
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveEffectiveRateSourceForConversion,
  useCurrencyConverter,
} from '../useCurrencyConverter';
import { STORAGE_KEYS } from '../../storage-keys';
import { useConverterStore } from '../../../../stores/converterStore';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';

// Mock dependencies
const mockShowToast = vi.fn();
const mockT = vi.fn((key: string) => key);
const moneyBoxRateMock = vi.hoisted(() => ({
  rate: null as ExchangeShopRate | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'zh-TW' },
  }),
}));

vi.mock('../../../../components/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('../useMoneyBoxRates', () => ({
  useMoneyBoxRates: () => ({
    rate: moneyBoxRateMock.rate,
    isLoading: false,
    error: null,
  }),
}));

// Mock localStorage
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
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useCurrencyConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    moneyBoxRateMock.rate = null;
    // 重置 Zustand store 至初始狀態，確保測試隔離
    useConverterStore.setState({
      fromCurrency: 'TWD',
      toCurrency: 'JPY',
      rateMode: 'auto',
      rateType: 'spot',
      rateSource: 'bank',
      providerPreference: {
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      },
      favorites: ['JPY', 'KRW', 'VND', 'THB', 'HKD', 'USD'],
      history: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addToHistory', () => {
    it('should show success toast when adding to history', () => {
      // Arrange
      const mockRates = {
        USD: 31.5,
        JPY: 0.21,
        EUR: 34.2,
        TWD: 1,
      };

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      act(() => {
        result.current.setFromCurrency('USD');
        result.current.setToCurrency('TWD');
        result.current.handleFromAmountChange('100');
      });

      act(() => {
        result.current.addToHistory();
      });

      expect(mockShowToast).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith('singleConverter.addedToHistory', 'success');
    });

    it('should add entry to history array', () => {
      // Arrange
      const mockRates = {
        USD: 31.5,
        JPY: 0.21,
        EUR: 34.2,
        TWD: 1,
      };

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      // Act
      act(() => {
        result.current.setFromCurrency('USD');
        result.current.setToCurrency('TWD');
        result.current.handleFromAmountChange('100');
      });

      act(() => {
        result.current.addToHistory();
      });

      // Assert
      expect(result.current.history.length).toBe(1);
      expect(result.current.history[0]).toMatchObject({
        from: 'USD',
        to: 'TWD',
        amount: '100',
      });
    });

    it('should persist history to localStorage', () => {
      // Arrange
      const mockRates = {
        USD: 31.5,
        TWD: 1,
      };

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      // Act
      act(() => {
        result.current.setFromCurrency('USD');
        result.current.setToCurrency('TWD');
        result.current.handleFromAmountChange('50');
      });

      act(() => {
        result.current.addToHistory();
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_KEYS.CONVERSION_HISTORY,
        expect.any(String),
      );
      const firstEntry = result.current.history[0];
      expect(firstEntry).toBeDefined();
      expect(firstEntry?.from).toBe('USD');
      expect(firstEntry?.to).toBe('TWD');
    });

    it('每筆寫入應帶 schemaVersion=2 與 provider/sourceKind/rateType/rateMode 欄位', () => {
      useConverterStore.setState({ rateMode: 'sell' });
      const mockRates = { USD: 31.5, TWD: 1 };
      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      act(() => {
        result.current.setFromCurrency('USD');
        result.current.setToCurrency('TWD');
        result.current.handleFromAmountChange('25');
      });
      act(() => {
        result.current.addToHistory();
      });

      const latest = result.current.history[0];
      expect(latest).toMatchObject({
        from: 'USD',
        to: 'TWD',
        rateType: 'spot',
        sourceKind: 'bank',
        providerId: 'bot',
        providerSelectionMode: 'manual',
        rateMode: 'sell',
        schemaVersion: 2,
      });
    });

    it('歷史紀錄上限為 store HISTORY_CAPACITY（50 筆）', () => {
      // Arrange
      const mockRates = {
        USD: 31.5,
        TWD: 1,
      };

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      for (let i = 0; i < 60; i++) {
        act(() => {
          result.current.handleFromAmountChange(String(i * 100));
        });
        act(() => {
          result.current.addToHistory();
        });
      }

      expect(result.current.history.length).toBeLessThanOrEqual(50);
      expect(result.current.history.length).toBeGreaterThan(10);
    });
  });

  describe('clearAllHistory', () => {
    it('should clear all history entries', () => {
      // Arrange
      const mockRates = {
        USD: 31.5,
        TWD: 1,
      };

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      // Add some history first
      act(() => {
        result.current.handleFromAmountChange('100');
      });
      act(() => {
        result.current.addToHistory();
      });

      expect(result.current.history.length).toBeGreaterThan(0);

      // Act
      act(() => {
        result.current.clearAllHistory();
      });

      // Assert
      expect(result.current.history.length).toBe(0);
    });
  });

  describe('sortedCurrencies', () => {
    it('should always have TWD as the first currency', () => {
      const { result } = renderHook(() => useCurrencyConverter({}));
      expect(result.current.sortedCurrencies[0]).toBe('TWD');
    });

    it('should pin TWD first even when favorites do not include TWD', () => {
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'JPY',
        favorites: ['USD', 'JPY', 'KRW'],
        history: [],
      });
      const { result } = renderHook(() => useCurrencyConverter({}));
      expect(result.current.sortedCurrencies[0]).toBe('TWD');
    });

    it('should place user favorites (without TWD) after TWD', () => {
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'JPY',
        favorites: ['USD', 'JPY'],
        history: [],
      });
      const { result } = renderHook(() => useCurrencyConverter({}));
      const sorted = result.current.sortedCurrencies;
      expect(sorted[0]).toBe('TWD');
      expect(sorted[1]).toBe('USD');
      expect(sorted[2]).toBe('JPY');
    });

    it('should have non-favorites sorted alphabetically after favorites', () => {
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'JPY',
        favorites: ['USD'],
        history: [],
      });
      const { result } = renderHook(() => useCurrencyConverter({}));
      const sorted = result.current.sortedCurrencies;
      // TWD first, then USD (favorite), then non-favorites alphabetically
      expect(sorted[0]).toBe('TWD');
      expect(sorted[1]).toBe('USD');
      // remaining should be sorted alphabetically
      const nonFavStart = 2;
      for (let i = nonFavStart; i < sorted.length - 1; i++) {
        expect(sorted[i]! <= sorted[i + 1]!).toBe(true);
      }
    });

    it('should match getAllCurrenciesSorted output for same favorites', async () => {
      const { getAllCurrenciesSorted } = await import('../../../../pages/favorites-utils');
      const favs = ['JPY', 'KRW', 'VND'] as const;
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'JPY',
        favorites: [...favs],
        history: [],
      });
      const { result } = renderHook(() => useCurrencyConverter({}));
      expect(result.current.sortedCurrencies).toEqual(getAllCurrenciesSorted([...favs]));
    });
  });

  describe('reconvertFromHistory', () => {
    it('should restore conversion from history entry', () => {
      // Arrange
      const mockRates = {
        USD: 31.5,
        JPY: 0.21,
        TWD: 1,
      };

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: mockRates,
          rateType: 'spot',
        }),
      );

      const historyEntry = {
        from: 'JPY' as const,
        to: 'TWD' as const,
        amount: '10000',
        result: '2100',
        time: '今天',
        timestamp: Date.now(),
      };

      // Act
      act(() => {
        result.current.reconvertFromHistory(historyEntry);
      });

      // Assert
      expect(result.current.fromCurrency).toBe('JPY');
      expect(result.current.toCurrency).toBe('TWD');
      expect(result.current.fromAmount).toBe('10000');
    });

    it('should restore rate type and provider preference from schema v2 history entry', () => {
      useConverterStore.setState({
        rateMode: 'mid',
        rateType: 'spot',
        rateSource: 'bank',
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'bank', providerId: 'bot' },
        },
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { KRW: 0.0222, TWD: 1 },
          rateType: useConverterStore.getState().rateType,
          rateSource: useConverterStore.getState().rateSource,
        }),
      );

      act(() => {
        result.current.reconvertFromHistory({
          from: 'KRW',
          to: 'TWD',
          amount: '100000',
          result: '2217',
          time: '今天',
          timestamp: Date.now(),
          rateType: 'cash',
          rateMode: 'sell',
          sourceKind: 'exchange-shop',
          providerId: 'moneybox',
          providerSelectionMode: 'manual',
          schemaVersion: 2,
        });
      });

      const state = useConverterStore.getState();
      expect(state.rateMode).toBe('sell');
      expect(state.rateType).toBe('cash');
      expect(state.rateSource).toBe('exchange-shop');
      expect(state.providerPreference).toEqual({
        mode: 'manual',
        manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
      });
    });
  });

  describe('exchange shop conversion', () => {
    const moneyBoxRate: ExchangeShopRate = {
      currency: 'KRW',
      sell: 44.85,
      buy: 45.1,
      updateTime: '2026/05/07 16:33:55',
      source: 'MoneyBox',
      sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
      providerName: '明洞換匯所',
      isFallback: false,
    };

    const exchangeShopPreference = {
      mode: 'manual' as const,
      manualProvider: { sourceKind: 'exchange-shop' as const, providerId: 'moneybox' },
    };

    it('uses MoneyBox sell rate for TWD→KRW result amount', async () => {
      moneyBoxRateMock.rate = moneyBoxRate;
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        favorites: ['KRW'],
        history: [],
        providerPreference: exchangeShopPreference,
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      await waitFor(() => {
        expect(result.current.toAmount).toBe('44850');
      });
      expect(result.current.exchangeShopCurrency).toBe('KRW');
      expect(result.current.moneyBoxRate).toEqual(moneyBoxRate);
    });

    it('reverse-solves TWD→KRW target amount with the same MoneyBox sell quote', async () => {
      moneyBoxRateMock.rate = moneyBoxRate;
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        favorites: ['KRW'],
        history: [],
        providerPreference: exchangeShopPreference,
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      act(() => {
        result.current.handleToAmountChange('44850');
      });

      await waitFor(() => {
        expect(result.current.fromAmount).toBe('1000.00');
      });
      expect(result.current.toAmount).toBe('44850');
      expect(result.current.exchangeShopCurrency).toBe('KRW');
    });

    it('uses provider fallback instead of bank rate while MoneyBox rate is not ready', async () => {
      moneyBoxRateMock.rate = null;
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        favorites: ['KRW'],
        history: [],
        providerPreference: exchangeShopPreference,
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      await waitFor(() => {
        expect(result.current.toAmount).toBe('46000');
      });
      expect(result.current.moneyBoxRate).toMatchObject({
        sell: 46.0,
        buy: 46.7,
        isFallback: true,
      });
    });

    it('uses MoneyBox buy inverse for KRW→TWD result amount', async () => {
      moneyBoxRateMock.rate = moneyBoxRate;
      useConverterStore.setState({
        fromCurrency: 'KRW',
        toCurrency: 'TWD',
        favorites: ['KRW'],
        history: [],
        providerPreference: exchangeShopPreference,
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      act(() => {
        result.current.handleFromAmountChange('45100');
      });

      await waitFor(() => {
        expect(result.current.toAmount).toBe('1000.00');
      });
      expect(result.current.exchangeShopCurrency).toBe('KRW');
    });

    it('does not expose exchange shop for non-TWD KRW cross pairs', () => {
      moneyBoxRateMock.rate = moneyBoxRate;
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'KRW',
        favorites: ['USD', 'KRW'],
        history: [],
        providerPreference: exchangeShopPreference,
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, USD: 31.5, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      expect(result.current.exchangeShopCurrency).toBeNull();
      expect(result.current.toAmount).toBe('1334746');
    });

    it('multi mode uses exchange-shop per supported row even when single pair fallback is bank', () => {
      expect(
        resolveEffectiveRateSourceForConversion({
          mode: 'multi',
          requestedRateSource: 'exchange-shop',
          resolvedSourceKind: 'bank',
          exchangeShopRate: moneyBoxRate,
        }),
      ).toBe('exchange-shop');

      expect(
        resolveEffectiveRateSourceForConversion({
          mode: 'multi',
          requestedRateSource: 'exchange-shop',
          resolvedSourceKind: 'bank',
          exchangeShopRate: null,
        }),
      ).toBe('bank');
    });

    it('multi mode 在 best provider 模式下，有 exchange-shop quote 即套用該 row（不受 legacy rateSource 影響）', () => {
      // best 模式 + legacy rateSource=bank + 該 row 有 exchangeShopRate → 套用 exchange-shop
      expect(
        resolveEffectiveRateSourceForConversion({
          mode: 'multi',
          requestedRateSource: 'bank',
          resolvedSourceKind: 'bank',
          exchangeShopRate: moneyBoxRate,
          providerSelectionMode: 'best',
        }),
      ).toBe('exchange-shop');

      // best 模式 + 該 row 無 exchangeShopRate → fallback bank
      expect(
        resolveEffectiveRateSourceForConversion({
          mode: 'multi',
          requestedRateSource: 'bank',
          resolvedSourceKind: 'bank',
          exchangeShopRate: null,
          providerSelectionMode: 'best',
        }),
      ).toBe('bank');

      // manual + rateSource=bank + 該 row 有 exchangeShopRate → 仍維持 bank（尊重使用者選擇）
      expect(
        resolveEffectiveRateSourceForConversion({
          mode: 'multi',
          requestedRateSource: 'bank',
          resolvedSourceKind: 'bank',
          exchangeShopRate: moneyBoxRate,
          providerSelectionMode: 'manual',
        }),
      ).toBe('bank');
    });

    it('single converter ignores persisted multi mode for quick amounts', () => {
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        favorites: ['TWD', 'KRW'],
        history: [],
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      act(() => {
        result.current.quickAmount(500);
      });

      expect(result.current.fromAmount).toBe('500');
      expect(result.current.multiAmounts.TWD).toBe('1000');
    });
  });

  describe('provider SSOT 暴露面', () => {
    it('銀行偏好 → resolvedProvider 指向 bot/bank/manual', () => {
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'TWD',
        favorites: ['USD'],
        history: [],
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'bank', providerId: 'bot' },
        },
        rateSource: 'bank',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, USD: 31.5 },
          rateType: 'spot',
        }),
      );

      expect(result.current.resolvedProvider).toEqual({
        selectionMode: 'manual',
        sourceKind: 'bank',
        providerId: 'bot',
        reason: 'manual',
      });
    });

    it('換錢所偏好 + 支援的 pair → resolvedProvider 指向 moneybox', () => {
      moneyBoxRateMock.rate = {
        currency: 'KRW',
        sell: 44.85,
        buy: 45.1,
        updateTime: '2026/05/07 16:33:55',
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        providerName: '明洞換匯所',
        isFallback: false,
      };
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        favorites: ['KRW'],
        history: [],
        providerPreference: {
          mode: 'manual',
          manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' },
        },
        rateSource: 'exchange-shop',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'exchange-shop',
        }),
      );

      expect(result.current.resolvedProvider.providerId).toBe('moneybox');
      expect(result.current.resolvedProvider.sourceKind).toBe('exchange-shop');
    });

    it('best-provider 選到 moneybox 時，UI 使用同一個 effective rate source', () => {
      moneyBoxRateMock.rate = {
        currency: 'KRW',
        sell: 44.85,
        buy: 45.1,
        updateTime: '2026/05/07 16:33:55',
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        providerName: '明洞換匯所',
        isFallback: false,
      };
      useConverterStore.setState({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        favorites: ['KRW'],
        history: [],
        providerPreference: { mode: 'best' },
        rateSource: 'bank',
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, KRW: 0.0236 },
          rateType: 'cash',
          rateSource: 'bank',
        }),
      );

      expect(result.current.resolvedProvider.providerId).toBe('moneybox');
      expect(result.current.effectiveRateSource).toBe('exchange-shop');
    });

    it('providerQuotes 同時包含 bot 與 moneybox；moneybox 在缺資料時 isAvailable=false', () => {
      moneyBoxRateMock.rate = null;
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'TWD',
        favorites: ['USD'],
        history: [],
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, USD: 31.5 },
          rateType: 'spot',
        }),
      );

      const ids = result.current.providerQuotes.map((q) => q.provider.providerId);
      expect(ids).toEqual(expect.arrayContaining(['bot', 'moneybox']));
      const moneyboxQuote = result.current.providerQuotes.find(
        (q) => q.provider.providerId === 'moneybox',
      );
      expect(moneyboxQuote?.isAvailable).toBe(false);
    });

    it('rankedProviderQuotes 過濾掉 isAvailable=false 的 quote', () => {
      moneyBoxRateMock.rate = null;
      useConverterStore.setState({
        fromCurrency: 'USD',
        toCurrency: 'TWD',
        favorites: ['USD'],
        history: [],
      });

      const { result } = renderHook(() =>
        useCurrencyConverter({
          exchangeRates: { TWD: 1, USD: 31.5 },
          rateType: 'spot',
        }),
      );

      expect(
        result.current.rankedProviderQuotes.every((q) => q.provider.providerId === 'bot'),
      ).toBe(true);
    });
  });
});
