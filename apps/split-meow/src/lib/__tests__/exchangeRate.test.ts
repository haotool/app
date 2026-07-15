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
});
