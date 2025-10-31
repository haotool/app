/**
 * useExchangeRates Hook Test Suite
 *
 * 測試策略 (Linus Style):
 * 1. 測試未覆蓋的關鍵路徑
 * 2. 簡單實用的測試，避免過度複雜
 * 3. 專注於覆蓋率提升到 85%+
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExchangeRates } from '../useExchangeRates';
import * as exchangeRateService from '../../../../services/exchangeRateService';
import * as logger from '../../../../utils/logger';

// ===== Mock Setup =====
vi.mock('../../../../services/exchangeRateService');
vi.mock('../../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ===== Test Data =====
const mockRateData = {
  timestamp: '2025-10-31T01:00:00+08:00',
  updateTime: '2025-10-31 01:00',
  source: '台灣銀行',
  sourceUrl: 'https://rate.bot.com.tw/',
  base: 'TWD',
  rates: {
    USD: 30.5,
    EUR: 33.2,
    JPY: 0.21,
    CNY: 4.22,
  },
  details: {},
};

// ===== Test Suite =====
describe('useExchangeRates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化載入', () => {
    it('成功載入匯率資料', async () => {
      vi.mocked(exchangeRateService.getExchangeRates).mockResolvedValue(mockRateData);

      const { result } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.rates.USD).toBe(30.5);
      expect(result.current.rates.TWD).toBe(1);
      expect(result.current.lastUpdate).toBe('2025-10-31 01:00');
      expect(result.current.lastFetchedAt).not.toBeNull();
    });

    it('載入失敗時設置錯誤狀態', async () => {
      const error = new Error('Network error');
      vi.mocked(exchangeRateService.getExchangeRates).mockRejectedValue(error);

      const { result } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
    });

    it('處理非 Error 物件的錯誤', async () => {
      vi.mocked(exchangeRateService.getExchangeRates).mockRejectedValue('String error');

      const { result } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('String error');
    });
  });

  describe('Page Visibility API (未覆蓋路徑)', () => {
    it('頁面從隱藏變為可見時立即刷新', async () => {
      vi.mocked(exchangeRateService.getExchangeRates).mockResolvedValue(mockRateData);

      const { result } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = vi.mocked(exchangeRateService.getExchangeRates).mock.calls.length;

      // ✅ 模擬頁面變為可見
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(
        () => {
          expect(exchangeRateService.getExchangeRates).toHaveBeenCalledTimes(initialCallCount + 1);
        },
        { timeout: 3000 },
      );
    });

    it('頁面變為隱藏時不刷新', async () => {
      vi.mocked(exchangeRateService.getExchangeRates).mockResolvedValue(mockRateData);

      const { result } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = vi.mocked(exchangeRateService.getExchangeRates).mock.calls.length;

      // ✅ 模擬頁面變為隱藏
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
        // 等待一小段時間
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // ✅ 確認沒有新的調用
      expect(exchangeRateService.getExchangeRates).toHaveBeenCalledTimes(initialCallCount);

      // Cleanup
      Object.defineProperty(document, 'hidden', {
        value: false,
      });
    });
  });

  describe('手動刷新 (未覆蓋路徑)', () => {
    it('調用 refresh() 手動刷新匯率', async () => {
      vi.mocked(exchangeRateService.getExchangeRates).mockResolvedValue(mockRateData);

      const { result } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = vi.mocked(exchangeRateService.getExchangeRates).mock.calls.length;
      const initialLastUpdate = result.current.lastUpdate;

      // ✅ 手動刷新
      await act(async () => {
        await result.current.refresh();
      });

      expect(exchangeRateService.getExchangeRates).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(result.current.lastUpdate).not.toBe(initialLastUpdate);
      expect(result.current.lastFetchedAt).not.toBeNull();
    });
  });

  describe('清理函數', () => {
    it('卸載時清除定時器和事件監聽', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      vi.mocked(exchangeRateService.getExchangeRates).mockResolvedValue(mockRateData);

      const { unmount } = renderHook(() => useExchangeRates());

      await waitFor(() => {
        expect(exchangeRateService.getExchangeRates).toHaveBeenCalled();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(logger.logger.debug).toHaveBeenCalledWith('Exchange rates polling cleaned up');
    });
  });
});
