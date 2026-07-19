import { describe, expect, it } from 'vitest';
import {
  averageEntryPrice,
  effectiveMaintenanceMarginRate,
  isSlBeyondLiquidation,
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

describe('effectiveMaintenanceMarginRate', () => {
  it('keeps the flat 0.5% MMR up to 100x', () => {
    expect(effectiveMaintenanceMarginRate(1)).toBe(0.005);
    expect(effectiveMaintenanceMarginRate(10)).toBe(0.005);
    expect(effectiveMaintenanceMarginRate(100)).toBe(0.005);
  });

  it('caps at half the initial margin rate beyond 100x', () => {
    expect(effectiveMaintenanceMarginRate(125)).toBeCloseTo(0.004, 12);
    expect(effectiveMaintenanceMarginRate(500)).toBeCloseTo(0.001, 12);
    expect(effectiveMaintenanceMarginRate(1000)).toBeCloseTo(0.0005, 12);
  });
});

describe('liquidationPrice (isolated, effective MMR)', () => {
  it('long: entry × (1 − 1/lev + mmr)', () => {
    expect(liquidationPrice('long', 60000, 10)).toBeCloseTo(54300, 8);
    // 125x 起 effective MMR = 0.5/lev：60000 × (1 − 0.008 + 0.004) = 59760。
    expect(liquidationPrice('long', 60000, 125)).toBeCloseTo(59760, 8);
    expect(liquidationPrice('long', 60000, 1)).toBeCloseTo(300, 8);
  });

  it('short: entry × (1 + 1/lev − mmr)', () => {
    expect(liquidationPrice('short', 60000, 10)).toBeCloseTo(65700, 8);
    expect(liquidationPrice('short', 60000, 125)).toBeCloseTo(60240, 8);
  });

  it('high leverage still leaves room between entry and liquidation', () => {
    for (const leverage of [125, 500, 1000]) {
      const longLiq = liquidationPrice('long', 60000, leverage);
      const shortLiq = liquidationPrice('short', 60000, leverage);
      expect(longLiq).toBeGreaterThan(0);
      expect(longLiq).toBeLessThan(60000);
      expect(shortLiq).toBeGreaterThan(60000);
    }
  });

  it('long liquidation distance shrinks monotonically as leverage grows', () => {
    const leverages = [10, 50, 100, 125, 200, 500, 1000];
    const distances = leverages.map(
      (leverage) => 60000 - liquidationPrice('long', 60000, leverage),
    );
    for (let index = 1; index < distances.length; index += 1) {
      const current = distances[index] ?? 0;
      const previous = distances[index - 1] ?? 0;
      expect(current).toBeLessThan(previous);
      expect(current).toBeGreaterThan(0);
    }
  });

  it('1000x long does not liquidate at the entry price', () => {
    const entry = 60000;
    const liq = liquidationPrice('long', entry, 1000);
    // 有效 MMR 0.05%：強平價 = entry × (1 − 0.001 + 0.0005) = entry × 0.9995 < entry。
    expect(liq).toBeCloseTo(entry * 0.9995, 6);
    expect(liq).toBeLessThan(entry);
  });
});

describe('isSlBeyondLiquidation (issue 781)', () => {
  it('long: sl below the liquidation price is dead-zone', () => {
    // 10x long @60000 → 強平 54300。
    expect(isSlBeyondLiquidation('long', 60000, 10, 54000)).toBe(true);
    expect(isSlBeyondLiquidation('long', 60000, 10, 55000)).toBe(false);
    // 恰等於強平價：強平與 SL 同點觸發，不視為死區。
    expect(isSlBeyondLiquidation('long', 60000, 10, 54300)).toBe(false);
  });

  it('short: sl above the liquidation price is dead-zone', () => {
    // 10x short @60000 → 強平 65700。
    expect(isSlBeyondLiquidation('short', 60000, 10, 66000)).toBe(true);
    expect(isSlBeyondLiquidation('short', 60000, 10, 65000)).toBe(false);
  });

  it('flags the narrow dead-zone at 100x', () => {
    // 100x long @60000 → 強平 59700：SL 低於 59700 皆為死區。
    expect(isSlBeyondLiquidation('long', 60000, 100, 59600)).toBe(true);
    expect(isSlBeyondLiquidation('long', 60000, 100, 59800)).toBe(false);
  });

  it('flags the razor-thin dead-zone at 1000x', () => {
    // 1000x long @60000 → 強平 59970（有效 MMR 0.05%）。
    expect(isSlBeyondLiquidation('long', 60000, 1000, 59950)).toBe(true);
    expect(isSlBeyondLiquidation('long', 60000, 1000, 59980)).toBe(false);
    // 1000x short @60000 → 強平 60030。
    expect(isSlBeyondLiquidation('short', 60000, 1000, 60050)).toBe(true);
    expect(isSlBeyondLiquidation('short', 60000, 1000, 60020)).toBe(false);
  });
});

describe('averageEntryPrice', () => {
  it('merges two fills into a weighted average', () => {
    expect(averageEntryPrice(0.5, 60000, 0.5, 62000)).toBe(61000);
    expect(averageEntryPrice(1, 100, 3, 200)).toBe(175);
  });
});

describe('isValidLeverage', () => {
  it('accepts 1–1000 inclusive', () => {
    expect(isValidLeverage(1)).toBe(true);
    expect(isValidLeverage(125)).toBe(true);
    expect(isValidLeverage(1000)).toBe(true);
    expect(isValidLeverage(12.5)).toBe(true);
  });

  it('rejects out-of-range or non-finite values', () => {
    expect(isValidLeverage(0.5)).toBe(false);
    expect(isValidLeverage(1001)).toBe(false);
    expect(isValidLeverage(0)).toBe(false);
    expect(isValidLeverage(Number.NaN)).toBe(false);
    expect(isValidLeverage(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
