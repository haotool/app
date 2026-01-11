/**
 * exchangeRateService Test Suite
 *
 * 測試策略 (Linus Style):
 * 1. Mock HTTP requests with MSW (Context7 best practice)
 * 2. 測試快取策略（fresh, expired, stale fallback）
 * 3. 測試錯誤處理（network errors, invalid data, API failures）
 * 4. 測試邊界情況（empty cache, corrupted cache, multiple CDN failures）
 * 5. [2026-01-11] 測試 IndexedDB 備援策略（Safari PWA 離線優化）
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getExchangeRates, clearExchangeRateCache, transformRates } from '../exchangeRateService';
import * as logger from '../../utils/logger';

// ===== Mock Setup =====

// [2026-01-11] Mock IndexedDB (offlineStorage)
let mockIDBData: Record<string, unknown> = {};
let mockIDBTimestamp: number | null = null;

vi.mock('../../utils/offlineStorage', () => ({
  saveExchangeRatesToIDB: vi.fn(async (data: unknown) => {
    mockIDBData['exchange_rates'] = data;
    mockIDBTimestamp = Date.now();
    return true;
  }),
  getExchangeRatesFromIDBWithStaleness: vi.fn(async () => {
    const data = mockIDBData['exchange_rates'] ?? null;
    const ageMs = mockIDBTimestamp ? Date.now() - mockIDBTimestamp : Infinity;
    const isExpired = ageMs > 7 * 24 * 60 * 60 * 1000;
    return {
      data,
      staleness: {
        level: isExpired ? 'expired' : 'fresh',
        ageMs,
        ageMinutes: Math.floor(ageMs / 60000),
        ageHours: Math.floor(ageMs / (60 * 60 * 1000)),
        ageDays: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
        isExpired,
        shouldWarn: isExpired,
        message: isExpired ? '資料已過期' : '資料已是最新',
      },
    };
  }),
  DataStaleness: {
    FRESH: 'fresh',
    RECENT: 'recent',
    STALE: 'stale',
    VERY_STALE: 'very_stale',
    EXPIRED: 'expired',
  },
}));

// Mock fetchWithRequestId to use the mocked global.fetch
vi.mock('../../utils/requestId', () => ({
  fetchWithRequestId: vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return global.fetch(input, init) as unknown as Promise<Response>;
  }),
  getRequestId: vi.fn(() => 'test-request-id'),
  generateRequestId: vi.fn(() => 'test-request-id'),
  resetRequestId: vi.fn(() => 'test-request-id'),
  addRequestIdHeader: vi.fn((options) => options),
}));

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
    // [2026-01-11] 重置 IndexedDB mock
    mockIDBData = {};
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
      // [fix:2025-12-28] 不再刪除過期快取，保留給離線使用
      // 過期快取會被新數據覆蓋，而非刪除
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

    it('CDN 失敗時使用過期快取作為 fallback', async () => {
      // [fix:2025-12-28] 過期快取不再被刪除，可作為離線備援
      const staleData = {
        data: { ...mockRateData, updateTime: '2025-10-31 00:40' },
        timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago (expired)
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(staleData));

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // ✅ 過期快取仍可用作 fallback
      const result = await getExchangeRates();
      expect(result.updateTime).toBe('2025-10-31 00:40');
      expect(logger.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Using stale localStorage cache as fallback'),
        expect.any(Object),
      );
    });

    it('CDN 失敗且完全無快取時拋出錯誤', async () => {
      // ✅ 完全無快取
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getExchangeRates()).rejects.toThrow('Network error');
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

  describe('離線模式', () => {
    it('[fix:2026-01-08] 離線無快取時返回 fallback 數據而非拋出錯誤', async () => {
      // Mock navigator.onLine = false
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      // 無任何快取
      mockLocalStorage._resetStore();

      const result = await getExchangeRates();

      // 應返回 fallback 數據
      expect(result.source).toBe('fallback');
      expect(result.updateTime).toBe('離線模式 - 使用預設匯率');
      expect(result.rates['TWD']).toBe(1);
      expect(result.rates['USD']).toBeDefined();
      expect(result.rates['JPY']).toBeDefined();

      // 恢復 navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });
    });

    it('離線有快取時優先使用快取', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired but available)
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
      expect(logger.logger.info).toHaveBeenCalledWith(
        'Offline mode: using localStorage cache',
        expect.any(Object),
      );

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });
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
        'Failed to save to localStorage cache',
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

  // ===== [2026-01-11] IndexedDB 備援策略測試 =====
  describe('IndexedDB 備援策略 (Safari PWA 離線優化)', () => {
    it('離線時 localStorage 無快取，使用 IndexedDB 備援', async () => {
      // Mock 離線狀態
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      // localStorage 無快取
      mockLocalStorage._resetStore();

      // IndexedDB 有快取
      mockIDBData['exchange_rates'] = {
        ...mockRateData,
        updateTime: '2025-10-30 23:00 (IndexedDB)',
      };

      const result = await getExchangeRates();

      expect(result.updateTime).toBe('2025-10-30 23:00 (IndexedDB)');
      expect(logger.logger.info).toHaveBeenCalledWith(
        'Offline mode: using IndexedDB cache (Safari PWA fallback)',
        expect.any(Object),
      );

      // 恢復
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });
    });

    it('CDN 失敗且 localStorage 無快取，使用 IndexedDB 備援', async () => {
      // localStorage 無快取
      mockLocalStorage._resetStore();

      // IndexedDB 有快取
      mockIDBData['exchange_rates'] = {
        ...mockRateData,
        updateTime: '2025-10-30 22:00 (IndexedDB fallback)',
      };

      // CDN 失敗
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getExchangeRates();

      expect(result.updateTime).toBe('2025-10-30 22:00 (IndexedDB fallback)');
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Using IndexedDB cache as fallback due to fetch error',
        expect.any(Object),
      );
    });

    it('成功獲取數據後同時儲存到 IndexedDB', async () => {
      const { saveExchangeRatesToIDB } = await import('../../utils/offlineStorage');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      await getExchangeRates();

      // 驗證 IndexedDB 儲存被調用
      expect(saveExchangeRatesToIDB).toHaveBeenCalledWith(mockRateData);
    });

    it('離線時 localStorage 和 IndexedDB 都無快取，使用 fallback', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      // 兩者都無快取
      mockLocalStorage._resetStore();
      mockIDBData = {};

      const result = await getExchangeRates();

      expect(result.source).toBe('fallback');
      expect(result.updateTime).toBe('離線模式 - 使用預設匯率');
      expect(result.rates['TWD']).toBe(1);
      expect(result.rates['USD']).toBeDefined();

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });
    });
  });
});
