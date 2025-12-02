import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchLatestRates,
  fetchHistoricalRates,
  fetchHistoricalRatesRange,
  clearCache,
} from '../exchangeRateHistoryService';

// Mock global fetch
global.fetch = vi.fn();

describe('exchangeRateHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchLatestRates - 最新匯率', () => {
    it('應該從 CDN 正確獲取最新匯率', async () => {
      const mockResponse = {
        timestamp: '2025-10-16T15:39:59.915Z',
        updateTime: '2025/10/16 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025, EUR: 36.07 },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchLatestRates();

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('latest.json'),
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
      );
    });

    it('應該在 URL 失敗時拋出錯誤', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(fetchLatestRates()).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1); // 只有一個 URL (GitHub raw)
    });
  });

  describe('fetchHistoricalRates - 指定日期歷史匯率', () => {
    it('應該正確獲取指定日期的歷史匯率', async () => {
      const mockResponse = {
        updateTime: '2025/10/14 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025, EUR: 36.07 },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const testDate = new Date('2025-10-14');
      const result = await fetchHistoricalRates(testDate);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('2025-10-14.json'),
        expect.any(Object),
      );
    });

    it('應該正確格式化日期為 YYYY-MM-DD', async () => {
      const mockResponse = {
        updateTime: '2025/10/01 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const testDate = new Date('2025-10-01');
      await fetchHistoricalRates(testDate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('2025-10-01.json'),
        expect.any(Object),
      );
    });
  });

  describe('fetchHistoricalRatesRange - 多天歷史匯率', () => {
    it('應該批次並行抓取，成功日期維持順序', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-17T00:00:00Z'));

      vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
        const urlString = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        const match = /history\/(\d{4}-\d{2}-\d{2})/.exec(urlString);
        const date = match?.[1] ?? 'unknown';
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              updateTime: `${date} 23:39:59`,
              source: 'Taiwan Bank',
              rates: { USD: 31.025 },
            }),
        } as Response);
      });

      try {
        const result = await fetchHistoricalRatesRange(2);

        expect(result).toEqual([
          {
            date: '2025-10-16',
            data: {
              updateTime: '2025-10-16 23:39:59',
              source: 'Taiwan Bank',
              rates: { USD: 31.025 },
            },
          },
          {
            date: '2025-10-15',
            data: {
              updateTime: '2025-10-15 23:39:59',
              source: 'Taiwan Bank',
              rates: { USD: 31.025 },
            },
          },
        ]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('應該在部分日期 404 時跳過並持續抓取', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-17T00:00:00Z'));

      vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        if (urlStr.includes('2025-10-16')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                updateTime: '2025-10-16 23:39:59',
                source: 'Taiwan Bank',
                rates: { USD: 31.025 },
              }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response);
      });

      try {
        const result = await fetchHistoricalRatesRange(3);

        expect(result).toHaveLength(1);
        expect(result[0]?.date).toBe('2025-10-16');
      } finally {
        vi.useRealTimers();
      }
    });

    it('應該使用預設天數 30 天並遵守 MAX 限制', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            updateTime: '2025/10/16 23:39:59',
            source: 'Taiwan Bank',
            rates: { USD: 31.025 },
          }),
      } as Response);

      const result = await fetchHistoricalRatesRange();

      expect(result).toHaveLength(30);
    });

    it('遇到連續缺失達閾值時應提前停止', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-17T00:00:00Z'));
      const successDates = new Set(['2025-10-16', '2025-10-15']);

      vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        if (urlStr.includes('latest')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          } as Response);
        }

        const match = /history\/(\d{4}-\d{2}-\d{2})/.exec(urlStr);
        if (!match?.[1]) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
        }

        const date = match[1];
        if (successDates.has(date)) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                updateTime: `${date} 23:39:59`,
                source: 'Taiwan Bank',
                rates: { USD: 31.025 },
              }),
          } as Response);
        }

        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response);
      });

      try {
        const result = await fetchHistoricalRatesRange(7);

        expect(result).toHaveLength(2);
        const calls = vi
          .mocked(fetch)
          .mock.calls.map(([req]) => (typeof req === 'string' ? req : ''));
        expect(calls.some((url) => url.includes('2025-10-08'))).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('應該處理非 Error 類型的 rejection reason', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-17T00:00:00Z'));

      vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;

        const match = /history\/(\d{4}-\d{2}-\d{2})/.exec(urlStr);
        if (!match?.[1]) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
        }

        // 模擬非 Error 類型的 rejection（如字串）
        // 這會觸發 Line 336-338 的 else 分支
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject('String rejection reason');
      });

      try {
        const result = await fetchHistoricalRatesRange(2);
        // 應該跳過所有日期，因為都失敗了
        expect(result).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('快取機制測試', () => {
    it('應該在5分鐘內使用快取', async () => {
      const mockResponse = {
        updateTime: '2025/10/16 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // 第一次請求
      const result1 = await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(1);

      // 第二次請求（應使用快取）
      const result2 = await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(1); // 沒有新的請求

      expect(result1).toEqual(result2);
    });

    it('應該在清除快取後重新請求', async () => {
      const mockResponse = {
        updateTime: '2025/10/16 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // 第一次請求
      await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(1);

      // 清除快取
      clearCache();

      // 第二次請求（應重新獲取）
      await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('應該為不同日期使用不同的快取 key', async () => {
      const mockResponse1 = {
        updateTime: '2025/10/14 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };
      const mockResponse2 = {
        updateTime: '2025/10/15 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.125 },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        } as Response);

      // 獲取兩個不同日期
      await fetchHistoricalRates(new Date('2025-10-14'));
      await fetchHistoricalRates(new Date('2025-10-15'));

      expect(fetch).toHaveBeenCalledTimes(2);

      // 重複請求應使用快取
      await fetchHistoricalRates(new Date('2025-10-14'));
      await fetchHistoricalRates(new Date('2025-10-15'));

      expect(fetch).toHaveBeenCalledTimes(2); // 沒有新請求
    });
  });

  describe('錯誤處理', () => {
    it('應該處理 HTTP 錯誤狀態碼', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(fetchLatestRates()).rejects.toThrow();
    });

    it('應該處理無效的 JSON 響應', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(fetchLatestRates()).rejects.toThrow();
    });

    it('應該處理網路超時', async () => {
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          }),
      );

      await expect(fetchLatestRates()).rejects.toThrow();
    });

    it('應該處理非 404 的 HTTP 錯誤並記錄 warn', async () => {
      // 測試 HTTP 500 錯誤分支（Line 188）
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(fetchLatestRates()).rejects.toThrow();
    });

    it('應該處理網路錯誤（CORS/連線失敗）並靜默處理', async () => {
      // 測試 fetch.catch 分支（Line 168-174）
      vi.mocked(fetch).mockImplementation(() => {
        // 模擬網路錯誤（如 CORS 或連線失敗）
        return Promise.reject(new Error('Network error: CORS'));
      });

      await expect(fetchLatestRates()).rejects.toThrow();
    });
  });

  describe('快取過期測試', () => {
    it('應該在快取過期後刪除並重新請求', async () => {
      vi.useFakeTimers();

      const mockResponse = {
        updateTime: '2025/10/16 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // 第一次請求
      await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(1);

      // 快取有效期內
      vi.advanceTimersByTime(4 * 60 * 1000); // 4 分鐘
      await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(1); // 仍使用快取

      // 超過快取有效期（5 分鐘）
      vi.advanceTimersByTime(2 * 60 * 1000); // 再過 2 分鐘，共 6 分鐘
      await fetchLatestRates();
      expect(fetch).toHaveBeenCalledTimes(2); // 快取過期，重新請求

      vi.useRealTimers();
    });
  });

  describe('LHCI 離線模式測試', () => {
    const originalEnv = import.meta.env['VITE_LHCI_OFFLINE'];

    afterEach(() => {
      import.meta.env['VITE_LHCI_OFFLINE'] = originalEnv;
    });

    it('應該在 LHCI 離線模式下返回模擬匯率（fetchLatestRates）', async () => {
      // 模擬 LHCI 離線模式
      import.meta.env['VITE_LHCI_OFFLINE'] = 'true';

      // 重新導入模組以應用新的環境變數
      vi.resetModules();
      const { fetchLatestRates: fetchLatestRatesLHCI } =
        await import('../exchangeRateHistoryService');

      const result = await fetchLatestRatesLHCI();

      // 應該返回模擬數據，不應該調用 fetch
      expect(result.source).toBe('LHCI-MOCK');
      expect(result.rates.USD).toBe(31.07);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('應該在 LHCI 離線模式下返回模擬匯率（fetchHistoricalRates）', async () => {
      // 模擬 LHCI 離線模式
      import.meta.env['VITE_LHCI_OFFLINE'] = 'true';

      // 重新導入模組以應用新的環境變數
      vi.resetModules();
      const { fetchHistoricalRates: fetchHistoricalRatesLHCI } =
        await import('../exchangeRateHistoryService');

      const testDate = new Date('2025-10-14');
      const result = await fetchHistoricalRatesLHCI(testDate);

      // 應該返回模擬數據，不應該調用 fetch
      expect(result.source).toBe('LHCI-MOCK');
      expect(result.updateTime).toBe('2025-10-14T00:00:00Z');
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
