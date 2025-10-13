/**
 * 匯率歷史資料服務測試
 *
 * 測試範圍：
 * - fetchLatestRates()
 * - fetchHistoricalRates()
 * - fetchHistoricalRatesRange()
 * - clearCache()
 * - 快取機制
 * - 錯誤處理
 * - Fallback 機制
 *
 * @created 2025-10-14T01:42:24+08:00
 * @references [context7:/vitest-dev/vitest:2025-10-14T01:42:24+08:00]
 * @references [context7:/testing-library/react-testing-library:2025-10-14T01:42:24+08:00]
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchLatestRates,
  fetchHistoricalRates,
  fetchHistoricalRatesRange,
  clearCache,
  type ExchangeRateData,
} from './exchangeRateHistoryService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Test data
const mockLatestData: ExchangeRateData = {
  updateTime: '2025-10-14T01:00:00+08:00',
  source: 'Taiwan Bank',
  rates: {
    USD: 31.5,
    EUR: 34.2,
    JPY: 0.21,
    CNY: 4.35,
    GBP: 39.8,
    AUD: 20.5,
    CAD: 22.8,
    CHF: 35.6,
    SGD: 23.4,
    NZD: 18.9,
    THB: 0.89,
    KRW: 0.024,
    MYR: 7.12,
    VND: 0.00125,
    PHP: 0.54,
    IDR: 0.002,
    HKD: 4.05,
  },
};

const mockHistoricalData: ExchangeRateData = {
  updateTime: '2025-10-13T01:00:00+08:00',
  source: 'Taiwan Bank',
  rates: {
    USD: 31.4,
    EUR: 34.1,
    JPY: 0.2,
    CNY: 4.34,
    GBP: 39.7,
    AUD: 20.4,
    CAD: 22.7,
    CHF: 35.5,
    SGD: 23.3,
    NZD: 18.8,
    THB: 0.88,
    KRW: 0.023,
    MYR: 7.11,
    VND: 0.00124,
    PHP: 0.53,
    IDR: 0.0019,
    HKD: 4.04,
  },
};

describe('exchangeRateHistoryService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    clearCache();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchLatestRates', () => {
    it('should fetch latest rates successfully from primary CDN', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      const result = await fetchLatestRates();

      expect(result).toEqual(mockLatestData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json',
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
      );
    });

    it('should fallback to secondary URL when primary fails', async () => {
      // First URL fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Second URL succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      const result = await fetchLatestRates();

      expect(result).toEqual(mockLatestData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when all URLs fail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchLatestRates()).rejects.toThrow('Failed to fetch data from all URLs');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Both URLs attempted
    });

    it('should use cached data within cache duration', async () => {
      // First call - fetch from network
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      const result1 = await fetchLatestRates();
      expect(result1).toEqual(mockLatestData);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await fetchLatestRates();
      expect(result2).toEqual(mockLatestData);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchLatestRates()).rejects.toThrow('Failed to fetch data from all URLs');
    });
  });

  describe('fetchHistoricalRates', () => {
    it('should fetch historical rates for specific date', async () => {
      const testDate = new Date('2025-10-13');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      });

      const result = await fetchHistoricalRates(testDate);

      expect(result).toEqual(mockHistoricalData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2025-10-13.json',
        expect.any(Object),
      );
    });

    it('should format date correctly', async () => {
      const testDate = new Date('2025-01-05'); // Test single digit month/day

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      });

      await fetchHistoricalRates(testDate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('2025-01-05'),
        expect.any(Object),
      );
    });

    it('should use cache for repeated date requests', async () => {
      const testDate = new Date('2025-10-13');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      });

      // First call
      await fetchHistoricalRates(testDate);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await fetchHistoricalRates(testDate);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when historical data not found', async () => {
      const testDate = new Date('2025-10-13');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchHistoricalRates(testDate)).rejects.toThrow();
    });
  });

  describe('fetchHistoricalRatesRange', () => {
    it('should fetch multiple days of historical data', async () => {
      const days = 3;

      // Mock successful responses for all days
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHistoricalData,
      });

      const results = await fetchHistoricalRatesRange(days);

      expect(results).toHaveLength(days);
      expect(mockFetch).toHaveBeenCalledTimes(days);

      // Verify structure
      results.forEach((result) => {
        expect(result).toHaveProperty('date');
        expect(result).toHaveProperty('data');
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should handle partial failures gracefully', async () => {
      const days = 3;

      // First day succeeds (primary URL)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      });

      // Second day fails both URLs (primary + fallback)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Third day succeeds (primary URL)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      });

      const results = await fetchHistoricalRatesRange(days);

      // Should return 2 successful results (day 1 and day 3)
      expect(results).toHaveLength(2);
      // Total calls: 1 (day1) + 2 (day2 both URLs) + 1 (day3) = 4
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should default to 30 days when no parameter provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHistoricalData,
      });

      const results = await fetchHistoricalRatesRange();

      expect(mockFetch).toHaveBeenCalledTimes(30);
      expect(results.length).toBeLessThanOrEqual(30);
    });

    it('should generate correct date sequence', async () => {
      const days = 3;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHistoricalData,
      });

      const results = await fetchHistoricalRatesRange(days);

      // Verify dates are in descending order (today, yesterday, etc.)
      const dates = results.map((r) => new Date(r.date));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThan(dates[i + 1].getTime());
      }
    });

    it('should return empty array when all requests fail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const results = await fetchHistoricalRatesRange(3);

      expect(results).toHaveLength(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      // Fetch some data to populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      await fetchLatestRates();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      clearCache();

      // Fetch again - should hit network
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      await fetchLatestRates();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not throw error when clearing empty cache', () => {
      expect(() => clearCache()).not.toThrow();
    });
  });

  describe('cache expiration', () => {
    it('should expire cache after 5 minutes', async () => {
      // Mock Date.now() to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      // First fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      await fetchLatestRates();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time by 4 minutes (should still use cache)
      currentTime += 4 * 60 * 1000;
      await fetchLatestRates();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time by 2 more minutes (total 6 minutes, cache expired)
      currentTime += 2 * 60 * 1000;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLatestData,
      });

      await fetchLatestRates();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchLatestRates()).rejects.toThrow();
    });

    it('should handle invalid response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      const result = await fetchLatestRates();
      // Should still return the data even if structure is unexpected
      expect(result).toEqual({ invalid: 'data' });
    });
  });
});
