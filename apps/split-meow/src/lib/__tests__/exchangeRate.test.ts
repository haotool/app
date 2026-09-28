import { describe, it, expect, vi, afterEach } from 'vitest';
import { isRateStale, fetchMoneyboxRate, RATE_TTL_MS } from '../exchangeRate';

describe('isRateStale', () => {
  const NOW = Date.parse('2026-07-16T12:00:00Z');

  it('null → true', () => {
    expect(isRateStale(null, NOW)).toBe(true);
  });

  it('7 小時前 → true；1 小時前 → false（TTL 6h）', () => {
    expect(isRateStale('2026-07-16T05:00:00Z', NOW)).toBe(true);
    expect(isRateStale('2026-07-16T11:00:00Z', NOW)).toBe(false);
  });

  it('恰好 TTL 邊界內不算過期', () => {
    expect(isRateStale(new Date(NOW - RATE_TTL_MS).toISOString(), NOW)).toBe(false);
  });

  it('不可解析字串 → true', () => {
    expect(isRateStale('not-a-date', NOW)).toBe(true);
  });

  it('裝置時鐘落後（快照時間晚於 now）不算過期，與 main 相同', () => {
    expect(isRateStale('2026-07-16T12:05:00Z', NOW)).toBe(false);
  });
});

describe('fetchMoneyboxRate', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(body: unknown, ok = true) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        json: () => Promise.resolve(body),
      }),
    );
  }

  it('回傳賣出價與 ISO 時間戳', async () => {
    stubFetch({
      timestamp: '2026-07-15T14:58:17.205Z',
      updateTime: '2026/07/15 23:58:17',
      rates: { TWD: { buy: 46, sell: 45, base: 1 } },
    });
    await expect(fetchMoneyboxRate()).resolves.toEqual({
      krwPerTwd: 45,
      updatedAt: '2026/07/15 23:58:17',
      updatedAtIso: '2026-07-15T14:58:17.205Z',
    });
  });

  it('sell 為 0 或缺失時擲錯', async () => {
    stubFetch({ timestamp: 't', updateTime: 't', rates: { TWD: { buy: 1, sell: 0, base: 1 } } });
    await expect(fetchMoneyboxRate()).rejects.toThrow('TWD sell rate missing or invalid');

    stubFetch({ timestamp: 't', updateTime: 't', rates: {} });
    await expect(fetchMoneyboxRate()).rejects.toThrow('TWD sell rate missing or invalid');
  });

  it('HTTP 非 2xx 擲錯', async () => {
    stubFetch({}, false);
    await expect(fetchMoneyboxRate()).rejects.toThrow('HTTP 500');
  });

  it('timestamp 缺失或不可解析時擲錯（避免永遠 stale 熱迴圈）', async () => {
    stubFetch({ updateTime: 't', rates: { TWD: { buy: 46, sell: 45, base: 1 } } });
    await expect(fetchMoneyboxRate()).rejects.toThrow('timestamp missing or invalid');

    stubFetch({
      timestamp: 'not-a-date',
      updateTime: 't',
      rates: { TWD: { buy: 46, sell: 45, base: 1 } },
    });
    await expect(fetchMoneyboxRate()).rejects.toThrow('timestamp missing or invalid');
  });
});

describe('FX_V3_PUBLIC=false 惰性：行為與 main 等價', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('只請求 v2 MoneyBox CDN，不請求 v3 current，也不標示參考值', async () => {
    const { FX_V3_PUBLIC } = await import('@app/shared/fx/public');
    expect(FX_V3_PUBLIC).toBe(false);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          timestamp: '2026-07-15T14:58:17.205Z',
          updateTime: '2026/07/15 23:58:17',
          rates: { TWD: { buy: 46, sell: 45, base: 1 } },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const rate = await fetchMoneyboxRate();
    expect(rate).not.toHaveProperty('isFallback');
    expect(rate.updatedAtIso).toBe('2026-07-15T14:58:17.205Z');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/providers/moneybox/latest.json',
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/v3/'))).toBe(false);
  });

  it('store 更新後 rateFetchFailed=false，Settings／Home 不顯示參考值提示', async () => {
    const { useStore } = await import('../../store/useStore');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            timestamp: new Date().toISOString(),
            updateTime: '2026/07/15 23:58:17',
            rates: { TWD: { buy: 46, sell: 45, base: 1 } },
          }),
      }),
    );
    useStore.setState({ krwPerTwd: null, rateUpdatedAtIso: null, rateFetchFailed: true });
    await useStore.getState().refreshExchangeRate();
    expect(useStore.getState()).toMatchObject({ krwPerTwd: 45, rateFetchFailed: false });
    expect(useStore.getState().rateUpdatedAtIso).not.toBeNull();
  });
});
