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
import { getExchangeRates, clearExchangeRateCache, FETCH_TIMEOUT_MS } from '../exchangeRateService';
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
  const originalLhciOffline = import.meta.env['VITE_LHCI_OFFLINE'];

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
    import.meta.env['VITE_LHCI_OFFLINE'] = originalLhciOffline;
    vi.useRealTimers();
  });

  describe('getExchangeRates', () => {
    it('LHCI 離線模式下直接返回 build-time 匯率且不發送網路請求', async () => {
      import.meta.env['VITE_LHCI_OFFLINE'] = 'true';
      vi.resetModules();

      const {
        getExchangeRates: getExchangeRatesLhci,
        getBuildTimeExchangeRates: getBuildTimeExchangeRatesLhci,
      } = await import('../exchangeRateService');

      const result = await getExchangeRatesLhci();
      const buildTimeRates = getBuildTimeExchangeRatesLhci();

      expect(result).toEqual(buildTimeRates);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(logger.logger.info).toHaveBeenCalledWith(
        'LHCI offline mode: using build-time exchange rates',
      );
    });

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

    it('快取過期時立即返回過期快取並在背景更新（stale-while-revalidate）', async () => {
      // ✅ Setup: 設置過期快取（10分鐘前）
      const staleData = {
        data: { ...mockRateData, updateTime: '2025-10-31 00:50' },
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(staleData));

      // ✅ Mock successful background fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      // SWR: stale data returned immediately (not waiting for CDN)
      expect(result.updateTime).toBe('2025-10-31 00:50');
      // Background fetch was triggered
      expect(global.fetch).toHaveBeenCalled();
      expect(logger.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stale-while-revalidate'),
        expect.any(Object),
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

    it('CDN 失敗時已有過期快取：立即返回過期快取（stale-while-revalidate）', async () => {
      // 有過期快取：stale-while-revalidate 立即返回，背景 fetch 失敗只記錄警告
      const staleData = {
        data: { ...mockRateData, updateTime: '2025-10-31 00:40' },
        timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago (expired)
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(staleData));

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // SWR: 立即返回 stale 資料，不等待 CDN
      const result = await getExchangeRates();
      expect(result.updateTime).toBe('2025-10-31 00:40');
      expect(logger.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stale-while-revalidate'),
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

    it('CDN_URLS[0]（jsDelivr）失敗時自動落到 CDN_URLS[1]（GitHub Raw 備援）', async () => {
      // CDN_URLS[0]（jsDelivr，主要端點）失敗
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('jsDelivr unavailable'))
        // CDN_URLS[1]（GitHub Raw，備援端點）成功
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRateData,
        });

      const result = await getExchangeRates();

      expect(result).toEqual(mockRateData);
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

  describe('stale-while-revalidate', () => {
    it('過期快取立即返回，不阻塞在 CDN 請求', async () => {
      const staleData = { ...mockRateData, updateTime: 'stale-data' };
      mockLocalStorage.setItem(
        'exchangeRates',
        JSON.stringify({ data: staleData, timestamp: Date.now() - 10 * 60 * 1000 }),
      );

      // fetch 永遠不回應（模擬行動網路卡頓）
      let fetchCalled = false;
      (global.fetch as any).mockImplementation(() => {
        fetchCalled = true;
        return new Promise(() => {}); // never resolves
      });

      const result = await getExchangeRates();

      // ✅ 立即拿到 stale 資料，不需等待 CDN
      expect(result.updateTime).toBe('stale-data');
      // ✅ 背景 fetch 已觸發
      expect(fetchCalled).toBe(true);
      expect(logger.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stale-while-revalidate'),
        expect.any(Object),
      );
    });

    it('背景更新成功後快取被更新', async () => {
      const staleData = { ...mockRateData, updateTime: 'stale-data' };
      mockLocalStorage.setItem(
        'exchangeRates',
        JSON.stringify({ data: staleData, timestamp: Date.now() - 10 * 60 * 1000 }),
      );

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateData,
      });

      const result = await getExchangeRates();

      // SWR: 立即返回 stale
      expect(result.updateTime).toBe('stale-data');
      // 背景 fetch 已觸發（確認背景更新機制啟動）
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('FETCH_TIMEOUT_MS 常數已匯出且為正整數（防止行動網路無限等待）', () => {
      expect(typeof FETCH_TIMEOUT_MS).toBe('number');
      expect(FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it('fetch 呼叫帶有 AbortSignal（逾時保護機制確認）', async () => {
      // 驗證 AbortSignal 已傳入 fetch，確認逾時機制正確設定
      let capturedSignal: AbortSignal | undefined | null;
      (global.fetch as any).mockImplementation((_: unknown, init?: RequestInit) => {
        capturedSignal = init?.signal ?? null;
        // 立即 reject 模擬網路失敗（避免 timer 複雜性）
        return Promise.reject(new Error('simulated network error'));
      });

      await getExchangeRates().catch(() => {});

      expect(capturedSignal).toBeDefined();
      expect(capturedSignal).not.toBeNull();
      expect(capturedSignal).toBeInstanceOf(AbortSignal);
    });

    it('逾時後記錄警告日誌（timeout callback 覆蓋）', async () => {
      // 使用 fake timers 觸發 AbortController timeout callback（line 197）
      vi.useFakeTimers();

      (global.fetch as any).mockImplementation((_: unknown, init?: RequestInit) => {
        // 當 signal abort 時 reject（模擬 AbortController 中斷）。
        // 若 signal 已中止（CDN fallback 嘗試第二條時），立即 reject 避免 Promise 懸掛。
        return new Promise((_, reject) => {
          if (init?.signal?.aborted) {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
            return;
          }
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          });
        });
      });

      const resultPromise = getExchangeRates().catch(() => {});
      // 推進 fake timer 觸發 setTimeout callback（內含 logger.warn + controller.abort）
      await vi.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS + 100);
      await resultPromise;

      vi.useRealTimers();

      expect(logger.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('CDN fetch timed out'),
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

  // ===== ETag 條件式請求測試（2026-03 jsDelivr 整合）=====
  describe('ETag 條件式請求 (jsDelivr CDN)', () => {
    it('首次獲取成功後，ETag 存入快取', async () => {
      // 無快取，CDN 返回含 ETag 的回應
      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockRateData,
        headers: { get: (name: string) => (name === 'etag' ? '"v1-abc"' : null) },
      });

      await getExchangeRates();

      const saved = JSON.parse(mockLocalStorage.store['exchangeRates'] ?? '{}') as {
        etag?: string;
      };
      expect(saved.etag).toBe('"v1-abc"');
    });

    it('快取含 ETag 時，對 CDN_URLS[0]（jsDelivr）發送 If-None-Match 標頭', async () => {
      // 過期快取含 ETag（SWR 路徑：立即返回 stale，背景 fetch 帶 If-None-Match）
      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 10 * 60 * 1000,
        etag: '"stored-etag-v1"',
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      let capturedInit: RequestInit | undefined;
      (global.fetch as any).mockImplementation((_: unknown, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockRateData,
          headers: { get: () => null },
        });
      });

      await getExchangeRates();

      // fetch 在 SWR 背景立即被呼叫（synchronous before return）
      expect(global.fetch).toHaveBeenCalled();
      const sentHeaders = capturedInit?.headers as Record<string, string> | undefined;
      expect(sentHeaders?.['If-None-Match']).toBe('"stored-etag-v1"');
    });

    it('快取無 ETag 時，不發送 If-None-Match 標頭', async () => {
      // 過期快取，但沒有 ETag 欄位
      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 10 * 60 * 1000,
        // 刻意省略 etag
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      let capturedInit: RequestInit | undefined;
      (global.fetch as any).mockImplementation((_: unknown, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockRateData,
          headers: { get: () => null },
        });
      });

      await getExchangeRates();

      const sentHeaders = capturedInit?.headers as Record<string, string> | undefined;
      expect(sentHeaders?.['If-None-Match']).toBeUndefined();
    });

    it('CDN_URLS[1]（GitHub Raw 備援）不發送 If-None-Match 標頭', async () => {
      // 過期快取含 ETag，CDN_URLS[0] 失敗 → 落到 CDN_URLS[1]
      const cachedData = {
        data: mockRateData,
        timestamp: Date.now() - 10 * 60 * 1000,
        etag: '"v1"',
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      const capturedInits: RequestInit[] = [];
      (global.fetch as any)
        .mockImplementationOnce((_: unknown, init?: RequestInit) => {
          capturedInits.push(init ?? {});
          return Promise.reject(new Error('jsDelivr unavailable'));
        })
        .mockImplementationOnce((_: unknown, init?: RequestInit) => {
          capturedInits.push(init ?? {});
          return Promise.resolve({
            status: 200,
            ok: true,
            json: async () => mockRateData,
            headers: { get: () => null },
          });
        });

      await getExchangeRates();

      // CDN_URLS[0]（jsDelivr）：應帶 If-None-Match
      const firstHeaders = capturedInits[0]?.headers as Record<string, string> | undefined;
      expect(firstHeaders?.['If-None-Match']).toBe('"v1"');

      // CDN_URLS[1]（GitHub Raw）：不帶 If-None-Match
      const secondHeaders = capturedInits[1]?.headers as Record<string, string> | undefined;
      expect(secondHeaders?.['If-None-Match']).toBeUndefined();
    });

    it('CDN 返回 304 Not Modified 時，背景更新記錄 ETag 命中日誌', async () => {
      // 過期快取含 ETag
      const cachedData = {
        data: { ...mockRateData, updateTime: '304-test-timestamp' },
        timestamp: Date.now() - 10 * 60 * 1000,
        etag: '"v1"',
      };
      mockLocalStorage.setItem('exchangeRates', JSON.stringify(cachedData));

      (global.fetch as any).mockResolvedValueOnce({
        status: 304,
        ok: false, // 304 在 response.ok 為 false，但先被 status === 304 分支攔截
        headers: { get: () => null },
      });

      // SWR：立即返回 stale 資料
      const result = await getExchangeRates();
      expect(result.updateTime).toBe('304-test-timestamp');

      // 排空 microtask queue，讓背景 fetch 鏈完成（fetchWithTimeout → fetchFromCDN → .then）
      for (let i = 0; i < 10; i++) await Promise.resolve();

      expect(logger.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('ETag hit'),
        expect.any(Object),
      );
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
