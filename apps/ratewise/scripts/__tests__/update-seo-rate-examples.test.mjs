import { describe, expect, it } from 'vitest';
import { getBoardDate, getValidCashBuy } from '../update-seo-rate-examples.mjs';

describe('getBoardDate', () => {
  it('uses the Taipei date from an ISO timestamp with +08:00', () => {
    expect(getBoardDate('2026-09-28T16:58:28+08:00')).toBe('2026-09-28');
  });

  it('converts UTC timestamps across the Taipei midnight boundary', () => {
    expect(getBoardDate('2026-09-27T18:00:00Z')).toBe('2026-09-28');
  });

  it('falls back to the Taipei-local updateTime', () => {
    expect(getBoardDate('invalid', '2026/09/28 16:58:28')).toBe('2026-09-28');
  });

  it('returns null when neither timestamp is valid', () => {
    expect(getBoardDate('2026-02-30T16:58:28+08:00', '2026/02/30 16:58:28')).toBeNull();
  });
});

describe('getValidCashBuy', () => {
  it.each([undefined, null, '31.38', 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'omits invalid cashBuy %s',
    (cashBuy) => {
      expect(getValidCashBuy(cashBuy, 31.5)).toBeUndefined();
    },
  );

  it('keeps a positive finite cashBuy below cashSell', () => {
    expect(getValidCashBuy(31.38, 31.5)).toBe(31.38);
  });

  it('omits cashBuy at or above cashSell', () => {
    expect(getValidCashBuy(31.5, 31.5)).toBeUndefined();
    expect(getValidCashBuy(31.51, 31.5)).toBeUndefined();
  });
});
