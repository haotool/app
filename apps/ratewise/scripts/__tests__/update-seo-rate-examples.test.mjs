import { describe, expect, it } from 'vitest';
import { getValidCashBuy } from '../update-seo-rate-examples.mjs';

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
