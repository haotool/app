/**
 * useCurrencyConverter Hook Tests
 * useCurrencyConverter Hook 測試
 *
 * @description Tests for currency converter hook including history management
 *              and toast notifications
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCurrencyConverter } from '../useCurrencyConverter';
import { STORAGE_KEYS } from '../../storage-keys';

// Mock dependencies
const mockShowToast = vi.fn();
const mockT = vi.fn((key: string) => key);

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

      // Act - Set up conversion values first
      act(() => {
        result.current.setFromCurrency('USD');
        result.current.setToCurrency('TWD');
        result.current.handleFromAmountChange('100');
      });

      // Act - Add to history
      act(() => {
        result.current.addToHistory();
      });

      // Assert - Toast should be shown with correct message
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

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CONVERSION_HISTORY,
        expect.any(String),
      );
    });

    it('should limit history to 10 entries', () => {
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

      // Act - Add 12 entries
      for (let i = 0; i < 12; i++) {
        act(() => {
          result.current.handleFromAmountChange(String(i * 100));
        });
        act(() => {
          result.current.addToHistory();
        });
      }

      // Assert - Should only keep 10 entries
      expect(result.current.history.length).toBeLessThanOrEqual(10);
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
  });
});
