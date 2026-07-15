import { describe, expect, it } from 'vitest';
import {
  averageEntryPrice,
  isValidLeverage,
  liquidationPrice,
  notionalValue,
  orderFee,
  requiredMargin,
  roePercent,
  unrealizedPnl,
} from './math';
import { MAKER_FEE_RATE, TAKER_FEE_RATE } from '../config/trading';

describe('notionalValue / requiredMargin', () => {
  it('computes notional as qty times price', () => {
    expect(notionalValue(0.5, 60000)).toBe(30000);
  });

  it('computes margin as notional divided by leverage', () => {
    expect(requiredMargin(30000, 10)).toBe(3000);
    expect(requiredMargin(30000, 1)).toBe(30000);
    expect(requiredMargin(30000, 125)).toBe(240);
  });
});

describe('orderFee', () => {
  it('charges taker fee at 0.055% of notional', () => {
    expect(orderFee(30000, TAKER_FEE_RATE)).toBeCloseTo(16.5, 10);
  });

  it('charges maker fee at 0.02% of notional', () => {
    expect(orderFee(30000, MAKER_FEE_RATE)).toBeCloseTo(6, 10);
  });
});

describe('unrealizedPnl', () => {
  it('long gains when mark rises', () => {
    expect(unrealizedPnl('long', 60000, 61000, 0.5)).toBe(500);
  });

  it('long loses when mark falls', () => {
    expect(unrealizedPnl('long', 60000, 59000, 0.5)).toBe(-500);
  });

  it('short gains when mark falls', () => {
    expect(unrealizedPnl('short', 60000, 59000, 0.5)).toBe(500);
  });

  it('short loses when mark rises', () => {
    expect(unrealizedPnl('short', 60000, 61000, 0.5)).toBe(-500);
  });

  it('is independent of leverage (price pnl only)', () => {
    const pnl = unrealizedPnl('long', 60000, 61200, 1);
    expect(pnl).toBe(1200);
  });
});

describe('roePercent', () => {
  it('scales pnl against margin', () => {
    expect(roePercent(500, 3000)).toBeCloseTo(16.6667, 3);
    expect(roePercent(-300, 3000)).toBeCloseTo(-10, 10);
  });

  it('returns 0 for non-positive margin', () => {
    expect(roePercent(500, 0)).toBe(0);
  });
});

describe('liquidationPrice (isolated, MMR 0.5%)', () => {
  it('long: entry × (1 − 1/lev + 0.005)', () => {
    expect(liquidationPrice('long', 60000, 10)).toBeCloseTo(54300, 8);
    expect(liquidationPrice('long', 60000, 125)).toBeCloseTo(59820, 8);
    expect(liquidationPrice('long', 60000, 1)).toBeCloseTo(300, 8);
  });

  it('short: entry × (1 + 1/lev − 0.005)', () => {
    expect(liquidationPrice('short', 60000, 10)).toBeCloseTo(65700, 8);
    expect(liquidationPrice('short', 60000, 125)).toBeCloseTo(60180, 8);
  });
});

describe('averageEntryPrice', () => {
  it('merges two fills into a weighted average', () => {
    expect(averageEntryPrice(0.5, 60000, 0.5, 62000)).toBe(61000);
    expect(averageEntryPrice(1, 100, 3, 200)).toBe(175);
  });
});

describe('isValidLeverage', () => {
  it('accepts 1–125 inclusive', () => {
    expect(isValidLeverage(1)).toBe(true);
    expect(isValidLeverage(125)).toBe(true);
    expect(isValidLeverage(12.5)).toBe(true);
  });

  it('rejects out-of-range or non-finite values', () => {
    expect(isValidLeverage(0.5)).toBe(false);
    expect(isValidLeverage(126)).toBe(false);
    expect(isValidLeverage(0)).toBe(false);
    expect(isValidLeverage(Number.NaN)).toBe(false);
    expect(isValidLeverage(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
