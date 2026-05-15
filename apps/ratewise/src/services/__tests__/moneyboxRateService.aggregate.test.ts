// @vitest-environment jsdom

/**
 * 換錢所 aggregate endpoint 測試
 *
 * 對齊台銀 history-30d.json SSOT：fetchExchangeShopHistoricalRatesRange 應優先
 * 嘗試單一 aggregate URL（30→1 fetch），失敗才退回逐日 fetch。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchExchangeShopHistoricalRatesRange } from '../moneyboxRateService';

const MOCK_DAILY_JSON = {
  updateTime: '2026/05/14 10:00:00',
  rates: {
    TWD: { sell: 44.85, buy: 45.1 },
  },
};

const MOCK_AGGREGATE = {
  providerId: 'moneybox',
  generatedAt: '2026-05-14T02:00:00Z',
  snapshots: [
    { date: '2026-05-14', raw: { ...MOCK_DAILY_JSON, updateTime: '2026/05/14 10:00:00' } },
    {
      date: '2026-05-13',
      raw: {
        ...MOCK_DAILY_JSON,
        updateTime: '2026/05/13 10:00:00',
        rates: { TWD: { sell: 44.7, buy: 44.95 } },
      },
    },
    {
      date: '2026-05-12',
      raw: {
        ...MOCK_DAILY_JSON,
        updateTime: '2026/05/12 10:00:00',
        rates: { TWD: { sell: 44.6, buy: 44.85 } },
      },
    },
  ],
};

function mockJsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload),
    headers: { get: () => null },
  } as unknown as Response;
}

function mock404(): Response {
  return { ok: false, status: 404, json: () => Promise.resolve({}) } as unknown as Response;
}

describe('fetchExchangeShopHistoricalRatesRange - aggregate endpoint', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('aggregate 命中時只發一次 fetch（30→1）', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(MOCK_AGGREGATE));

    const result = await fetchExchangeShopHistoricalRatesRange('KRW', 30);

    expect(fetch).toHaveBeenCalledTimes(1);
    const requested = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(typeof requested === 'string' ? requested : '').toContain(
      '/providers/moneybox/history-30d.json',
    );
    expect(result).toHaveLength(3);
    expect(result[0]?.date).toBe('2026-05-14');
    expect(result[0]?.rate.sell).toBe(44.85);
  });

  it('aggregate 404 時退回逐日 fetch（保留現有行為）', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';
      if (url.includes('history-30d.json')) {
        return Promise.resolve(mock404());
      }
      return Promise.resolve(mockJsonResponse(MOCK_DAILY_JSON));
    });

    const result = await fetchExchangeShopHistoricalRatesRange('KRW', 5);

    expect(fetch).toHaveBeenCalled();
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1);
    expect(result.length).toBeGreaterThan(0);
  });

  it('aggregate shape 不合法時退回逐日 fetch', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';
      if (url.includes('history-30d.json')) {
        return Promise.resolve(mockJsonResponse({ providerId: 'moneybox' })); // 缺 snapshots
      }
      return Promise.resolve(mockJsonResponse(MOCK_DAILY_JSON));
    });

    const result = await fetchExchangeShopHistoricalRatesRange('KRW', 3);

    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1);
    expect(result.length).toBeGreaterThan(0);
  });

  it('5 分鐘 TTL 內重複呼叫應走 memory cache，不再 fetch', async () => {
    // 使用獨立 maxDays 避免與其他 test 的 cache key 碰撞。
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(MOCK_AGGREGATE));

    await fetchExchangeShopHistoricalRatesRange('KRW', 28);
    await fetchExchangeShopHistoricalRatesRange('KRW', 28);

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
