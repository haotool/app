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

    it('應該在主 CDN 失敗時使用備援 URL', async () => {
      const mockResponse = {
        updateTime: '2025/10/16 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };

      // 第一次請求失敗
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('CDN timeout'))
        // 第二次請求成功
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

      const result = await fetchLatestRates();

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('應該在所有 URL 失敗時拋出錯誤', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(fetchLatestRates()).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(2); // 兩個 URL 都嘗試
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
    it('應該正確獲取過去 N 天的歷史匯率', async () => {
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

      const result = await fetchHistoricalRatesRange(2);

      expect(result).toHaveLength(2);
      expect(result[0]?.data).toEqual(mockResponse1);
      expect(result[1]?.data).toEqual(mockResponse2);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('應該在部分資料不存在時繼續處理', async () => {
      const mockResponse = {
        updateTime: '2025/10/14 23:39:59',
        source: 'Taiwan Bank',
        rates: { USD: 31.025 },
      };

      // 第一天成功，第二天兩個 URL 都失敗，第三天成功
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
        .mockRejectedValueOnce(new Error('Not found')) // 第二天第一個 URL 失敗
        .mockRejectedValueOnce(new Error('Not found')) // 第二天第二個 URL 失敗
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

      const result = await fetchHistoricalRatesRange(3);

      // 應該返回2筆成功的資料（跳過失敗的）
      expect(result).toHaveLength(2);
      // 第一天1次，第二天2次（都失敗），第三天1次 = 4次
      expect(fetch).toHaveBeenCalled();
    });

    it('應該使用預設天數 30 天', async () => {
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
      expect(fetch).toHaveBeenCalledTimes(30);
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
  });
});
