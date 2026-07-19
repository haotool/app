import { describe, expect, it } from 'vitest';
import {
  pnlAtPrice,
  pnlFromRoe,
  priceFromPnl,
  priceFromRoe,
  roeAtPrice,
  roeFromPnl,
  type TpSlBasis,
} from './tpslMath';

// 10x 多單：0.1 BTC @ 60000，保證金 600。
const longBasis: TpSlBasis = {
  side: 'long',
  entryPrice: 60000,
  closeQty: 0.1,
  closeMargin: 600,
};

// 10x 空單：同倉位反向。
const shortBasis: TpSlBasis = { ...longBasis, side: 'short' };

// 部分平倉 50%：數量與保證金同比縮減。
const halfBasis: TpSlBasis = { ...longBasis, closeQty: 0.05, closeMargin: 300 };

describe('tpslMath', () => {
  it('converts price to pnl and roe for longs', () => {
    expect(pnlAtPrice(longBasis, 63000)).toBeCloseTo(300, 10);
    expect(roeAtPrice(longBasis, 63000)).toBeCloseTo(50, 10);
    expect(pnlAtPrice(longBasis, 59000)).toBeCloseTo(-100, 10);
  });

  it('converts price to pnl and roe for shorts (mirror of longs)', () => {
    expect(pnlAtPrice(shortBasis, 57000)).toBeCloseTo(300, 10);
    expect(roeAtPrice(shortBasis, 57000)).toBeCloseTo(50, 10);
    expect(pnlAtPrice(shortBasis, 61000)).toBeCloseTo(-100, 10);
  });

  it('inverts pnl and roe back to the trigger price', () => {
    expect(priceFromPnl(longBasis, 300)).toBeCloseTo(63000, 8);
    expect(priceFromRoe(longBasis, 50)).toBeCloseTo(63000, 8);
    expect(priceFromRoe(longBasis, -100)).toBeCloseTo(54000, 8);
    expect(priceFromPnl(shortBasis, 300)).toBeCloseTo(57000, 8);
    expect(priceFromRoe(shortBasis, -100)).toBeCloseTo(66000, 8);
  });

  it('round-trips price -> roe -> price and roe -> price -> roe', () => {
    for (const basis of [longBasis, shortBasis, halfBasis]) {
      for (const price of [54321, 59999.5, 61234.56, 66000]) {
        expect(priceFromRoe(basis, roeAtPrice(basis, price))).toBeCloseTo(price, 6);
      }
      for (const roe of [-100, -35, 5, 50, 300]) {
        expect(roeAtPrice(basis, priceFromRoe(basis, roe))).toBeCloseTo(roe, 6);
      }
      for (const pnl of [-600, -50, 25, 300, 1800]) {
        expect(pnlAtPrice(basis, priceFromPnl(basis, pnl))).toBeCloseTo(pnl, 6);
      }
    }
  });

  it('keeps the roe -> price mapping invariant to the close ratio', () => {
    // ROE 對應觸發價與平倉比例無關（比例在分子分母同時縮減）。
    expect(priceFromRoe(halfBasis, 50)).toBeCloseTo(priceFromRoe(longBasis, 50), 8);
  });

  it('scales the pnl -> price mapping with the close ratio', () => {
    // 相同收益額在較小平倉量下需要更大的價格位移。
    expect(priceFromPnl(halfBasis, 300)).toBeCloseTo(66000, 8);
  });

  it('degrades safely on zero-size or zero-margin bases', () => {
    const dust: TpSlBasis = { ...longBasis, closeQty: 0, closeMargin: 0 };
    expect(Number.isNaN(priceFromPnl(dust, 100))).toBe(true);
    expect(roeFromPnl(dust, 100)).toBe(0);
    expect(pnlFromRoe(dust, 50)).toBe(0);
  });
});
