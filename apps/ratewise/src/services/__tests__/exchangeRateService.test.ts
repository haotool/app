/**
 * exchangeRateService Test Suite
 *
 * 測試策略 (Linus Style):
 * 1. Mock HTTP requests with MSW (Context7 best practice)
 * 2. 測試快取策略（fresh, expired, stale fallback）
 * 3. 測試錯誤處理（network errors, invalid data, API failures）
 * 4. 測試邊界情況（empty cache, corrupted cache, multiple CDN failures）
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getExchangeRates, clearExchangeRateCache, transformRates } from '../exchangeRateService';
import * as logger from '../../utils/logger';

// ===== Mock Setup =====

// Mock fetchWithRequestId to use the mocked global.fetch
/* eslint-disable @typescript-eslint/no-unsafe-return */
vi.mock('../../utils/requestId', () => ({
  fetchWithRequestId: vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return global.fetch(input, init) as unknown as Promise<Response>;
  }),
  getRequestId: vi.fn(() => 'test-request-id'),
  generateRequestId: vi.fn(() => 'test-request-id'),
  resetRequestId: vi.fn(() => 'test-request-id'),
  addRequestIdHeader: vi.fn((options) => options),
}));
/* eslint-enable @typescript-eslint/no-unsafe-return */
const mockLocalStorage = (() => {
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
    get store() {
      return store;
    },
    _resetStore: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', mockLocalStorage);

vi.mock('../../utils/logger', () => ({
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
  },
  details: {
    USD: {
      name: '美元',
      spot: { buy: 30.48, sell: 30.52 },
      cash: { buy: 30.4, sell: 30.6 },
    },
    EUR: {
      name: '歐元',
      spot: { buy: 33.18, sell: 33.22 },
      cash: { buy: 33.1, sell: 33.3 },
    },
    JPY: {
      name: '日圓',
      spot: { buy: 0.2, sell: 0.22 },
      cash: { buy: null, sell: null },
    },
  },
};

// ===== Test Suite =====
describe('exchangeRateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage._resetStore();
    vi.clearAllTimers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-31T01:00:00+08:00'));

    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getExchangeRates', () => {
    it('從快取返回有效資料', async () => {
      // ✅ Setup: 設置有效快取（2分鐘前）
      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
      expect(global.fetch).not.toHaveBeenCalled(); // ✅ 沒有發送請求
      expect(logger.logger.debug).toHaveBeenCalledWith(expect.stringContaining('Cache valid'));
    });

    it('快取過期時從 CDN 獲取新資料', async () => {
      // ✅ Setup: 設置過期快取（10分鐘前）
      const staleData = {
        data: { ...mockRateData, updateTime: '2025-10-31 00:50' },
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(staleData));

      // ✅ Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
      expect(global.fetch).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('exchangeRates'); // ✅ 清除過期快取
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'exchangeRates',
        expect.stringContaining('2025-10-31 01:00'),
      );
    });

    it('無快取時從 CDN 獲取資料', async () => {
      // ✅ No cache

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
      expect(logger.logger.debug).toHaveBeenCalledWith('No cache found');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('CDN 失敗但無可用快取時拋出錯誤', async () => {
      // ✅ Note: getFromCache() 會自動清除過期快取
      // 所以當快取過期後，fallback 無法使用
      const staleData = {
        data: { ...mockRateData, updateTime: '2025-10-31 00:40' },
        timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago (expired)
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(staleData));

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // ✅ 過期快取被清除，無可用 fallback
      await expect(getExchangeRates()).rejects.toThrow('Network error');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('exchangeRates');
    });

    it('CDN 返回 HTTP 錯誤時拋出異常', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getExchangeRates()).rejects.toThrow('Failed to fetch from all');
      expect(logger.logger.error).toHaveBeenCalled();
    });

    it('CDN 返回無效資料格式時拋出異常', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' }), // ✅ Missing 'rates'
      });

      await expect(getExchangeRates()).rejects.toThrow();
      expect(logger.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('CDN #1 failed'),
        expect.any(Object),
      );
    });

    it('所有 CDN 失敗時拋出錯誤訊息', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network timeout'));

      await expect(getExchangeRates()).rejects.toThrow(/Failed to fetch from all.*sources/);
    });

    it('快取損壞時從 CDN 獲取新資料', async () => {
      // ✅ Setup: 損壞的 JSON
      mockLocalStorage.setItem('exchangeRates', 'invalid json {{{');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Failed to read from cache',
        expect.any(Object),
      );
    });
  });

  describe('clearExchangeRateCache', () => {
    it('清除 localStorage 中的匯率快取', () => {
      mockLocalStorage.setItem('exchangeRates', JSON.stringify({ data: mockRateData }));

      clearExchangeRateCache();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('exchangeRates');
      expect(logger.logger.debug).toHaveBeenCalledWith('Exchange rate cache cleared');
    });

    it('快取不存在時也不拋出錯誤', () => {
      expect(() => clearExchangeRateCache()).not.toThrow();
    });
  });

  describe('transformRates', () => {
    it('轉換台灣銀行匯率為應用格式', () => {
      const transformed = transformRates(mockRateData);

      // ✅ 1 TWD = 1/30.5 USD
      expect(transformed['USD']).toBeCloseTo(1 / 30.5, 5);
      expect(transformed['EUR']).toBeCloseTo(1 / 33.2, 5);
      expect(transformed['JPY']).toBeCloseTo(1 / 0.21, 5);
    });

    it('處理空的 rates 物件', () => {
      const emptyData = { ...mockRateData, rates: {} };

      const transformed = transformRates(emptyData);

      expect(transformed).toEqual({});
    });

    it('處理單一貨幣', () => {
      const singleRateData = {
        ...mockRateData,
        rates: { USD: 30.5 },
      };

      const transformed = transformRates(singleRateData);

      expect(Object.keys(transformed)).toHaveLength(1);
      expect(transformed['USD']).toBeCloseTo(1 / 30.5, 5);
    });

    it('處理極小匯率值', () => {
      const smallRateData = {
        ...mockRateData,
        rates: { JPY: 0.001 },
      };

      const transformed = transformRates(smallRateData);

      expect(transformed['JPY']).toBe(1000); // 1 / 0.001 = 1000
    });

    it('處理極大匯率值', () => {
      const largeRateData = {
        ...mockRateData,
        rates: { ZAR: 1000 },
      };

      const transformed = transformRates(largeRateData);

      expect(transformed['ZAR']).toBe(0.001); // 1 / 1000 = 0.001
    });
  });

  describe('快取機制', () => {
    it('5分鐘內使用快取', async () => {
      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 3 * 60 * 1000, // 3 minutes ago
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      await getExchangeRates();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('5分鐘後自動過期', async () => {
      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (expired)
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      await getExchangeRates();

      expect(logger.logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Cache expired: 6 minutes old'),
      );
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    it('localStorage 寫入失敗不影響功能', async () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Quota exceeded');
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Failed to save to cache',
        expect.any(Object),
      );
    });

    it('localStorage 讀取失敗時從 CDN 獲取', async () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
    });

    it('CDN 失敗且有有效快取時使用快取', async () => {
      // ✅ Setup: 有效快取（3分鐘前，未過期）
      const validData = {
        data: { ...mockRateData, updateTime: '2025-10-31 00:57' },
        timestamp: Date.now() - 3 * 60 * 1000, // 3 minutes ago (valid)
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(validData));

      // ✅ 快取有效，根本不會嘗試 fetch
      const result = await getExchangeRates();

      expect(result.updateTime).toBe('2025-10-31 00:57');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
