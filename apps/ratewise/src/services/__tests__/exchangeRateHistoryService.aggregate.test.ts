/**
 * Aggregate History Fetch 測試
 *
 * 驗證 fetchHistoricalRatesRange 能從單一 aggregate endpoint 獲取 30 天資料，
 * 減少從 30 個請求到 1 個請求的效能改善。
 *
 * @created 2026-05-05
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHistoricalRatesRange } from '../exchangeRateHistoryService';

describe('fetchHistoricalRatesRange - aggregate endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('應優先使用 aggregate endpoint（30 天資料一次取回）', async () => {
    // Arrange: mock aggregate endpoint
    const mockAggregateData = {
      updateTime: '2026-05-05T08:00:00+08:00',
      dates: ['2026-05-04', '2026-05-03', '2026-05-02'],
      rates: {
        TWD: [1, 1, 1],
        USD: [31.92, 31.85, 31.9],
        JPY: [0.2055, 0.206, 0.2058],
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAggregateData),
    } as Response);

    // Act
    const result = await fetchHistoricalRatesRange(3);

    // Assert: 應該只有 1 次 fetch（aggregate endpoint）
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toContain('history-30d.json');

    // 應該返回 3 天的資料
    expect(result).toHaveLength(3);
    expect(result[0]?.date).toBe('2026-05-04');
    expect(result[0]?.data.rates.USD).toBe(31.92);
  });

  it('aggregate endpoint 失敗時應 fallback 到逐日 fetch', async () => {
    // Arrange: aggregate 失敗，逐日成功
    const mockDailyData = {
      updateTime: '2026-05-04T08:00:00+08:00',
      source: 'Taiwan Bank',
      rates: { TWD: 1, USD: 31.92 },
    };

    let callCount = 0;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      callCount++;
      const urlStr = url instanceof URL ? url.href : typeof url === 'string' ? url : '';

      // 第一次是 aggregate，返回 404
      if (urlStr.includes('history-30d.json')) {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }

      // 之後是逐日 fetch，返回成功
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDailyData),
      } as Response);
    });

    // Act
    await fetchHistoricalRatesRange(5);

    // Assert: 應該先嘗試 aggregate，失敗後 fallback
    expect(fetchSpy).toHaveBeenCalled();
    expect(fetchSpy.mock.calls[0]?.[0]).toContain('history-30d.json');

    // fallback 後應該有逐日的請求
    expect(callCount).toBeGreaterThan(1);
  });

  it('aggregate 資料應正確轉換為 HistoricalRateData 格式', async () => {
    // Arrange: column-major 格式的 aggregate 資料
    const mockAggregateData = {
      updateTime: '2026-05-05T08:00:00+08:00',
      dates: ['2026-05-04', '2026-05-03'],
      rates: {
        TWD: [1, 1],
        USD: [31.92, 31.85],
        EUR: [37.66, 37.5],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAggregateData),
    } as Response);

    // Act
    const result = await fetchHistoricalRatesRange(2);

    // Assert: 應該轉換為 row-major 的 HistoricalRateData[]
    expect(result).toHaveLength(2);

    // 第一筆：2026-05-04
    expect(result[0]?.date).toBe('2026-05-04');
    expect(result[0]?.data.rates.TWD).toBe(1);
    expect(result[0]?.data.rates.USD).toBe(31.92);
    expect(result[0]?.data.rates.EUR).toBe(37.66);
    expect(result[0]?.data.source).toContain('Taiwan Bank');

    // 第二筆：2026-05-03
    expect(result[1]?.date).toBe('2026-05-03');
    expect(result[1]?.data.rates.USD).toBe(31.85);
    expect(result[1]?.data.rates.EUR).toBe(37.5);
  });

  it('請求天數超過 aggregate 可用天數時應 graceful 處理', async () => {
    // Arrange: aggregate 只有 10 天，但請求 30 天
    const dates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i - 1);
      return d.toISOString().slice(0, 10);
    });

    const mockAggregateData = {
      updateTime: '2026-05-05T08:00:00+08:00',
      dates,
      rates: {
        TWD: Array(10).fill(1),
        USD: Array(10).fill(31.92),
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAggregateData),
    } as Response);

    // Act
    const result = await fetchHistoricalRatesRange(30);

    // Assert: 應該返回 aggregate 可用的天數
    expect(result).toHaveLength(10);
  });
});
