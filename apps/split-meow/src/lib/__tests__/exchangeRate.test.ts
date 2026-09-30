import { describe, it, expect } from 'vitest';
import { isRateStale, RATE_TTL_MS } from '../exchangeRate';

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
