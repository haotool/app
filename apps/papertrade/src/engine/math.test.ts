import { describe, expect, it } from 'vitest';
import {
  averageEntryPrice,
  crossAvailableBalance,
  crossMaintenanceMargin,
  crossMarginBalance,
  crossUnrealizedPnl,
  effectiveMaintenanceMarginRate,
  estimatedCrossLiquidationPrice,
  isSlBeyondLiquidation,
  isValidLeverage,
  liquidationPrice,
  notionalValue,
  orderFee,
  requiredMargin,
  roePercent,
  unrealizedPnl,
} from './math';
import { type Account, type Position } from './types';
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

function crossPosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p1',
    symbol: 'BTCUSDT',
    side: 'long',
    qty: 0.1,
    entryPrice: 60000,
    margin: 600,
    openFee: 3.3,
    leverage: 10,
    marginMode: 'cross',
    openedAt: 0,
    takeProfit: null,
    stopLoss: null,
    tpSlCloseRatio: 1,
    trailing: null,
    ...overrides,
  };
}

function accountWith(balance: number, positions: Position[]): Account {
  return { balance, positions, orders: [], history: [] };
}

describe('cross margin aggregates (R6-2, ADR-R6-02)', () => {
  // PM 手算範例：balance 10000 開 BTC long cross 0.1@60000 10x（IM 600、fee 3.3）→ balance 9396.7。
  const account = accountWith(9396.7, [crossPosition()]);
  const marks = { BTCUSDT: 61000 } as const;

  it('matches the hand-calculated example at mark 61000', () => {
    expect(crossUnrealizedPnl(account.positions, marks)).toBeCloseTo(100, 8);
    expect(crossAvailableBalance(account, marks)).toBeCloseTo(9496.7, 8);
    expect(crossMarginBalance(account, marks)).toBeCloseTo(10096.7, 8);
    // MM = 0.1 × 61000 × 0.005 = 30.5。
    expect(crossMaintenanceMargin(account.positions, marks)).toBeCloseTo(30.5, 8);
    // buffer = 10096.7 − 30.5 = 10066.2；mark 錨：61000 − 10066.2/0.1 < 0 → null。
    expect(estimatedCrossLiquidationPrice(account.positions[0]!, account, marks)).toBeNull();
  });

  it('excludes isolated positions and missing marks from the aggregates', () => {
    const mixed = accountWith(9396.7, [
      crossPosition(),
      crossPosition({ id: 'p2', symbol: 'ETHUSDT', marginMode: 'isolated', qty: 1 }),
      crossPosition({ id: 'p3', symbol: 'SOLUSDT', qty: 10, entryPrice: 100, margin: 100 }),
    ]);
    // SOL 缺 mark：不計 uPnL 與 MM；ETH 為 isolated：全部聚合不計。
    expect(crossUnrealizedPnl(mixed.positions, marks)).toBeCloseTo(100, 8);
    expect(crossMaintenanceMargin(mixed.positions, marks)).toBeCloseTo(30.5, 8);
    // crossMarginBalance 仍加總全部 cross 持倉 IM（600 + 100）。
    expect(crossMarginBalance(mixed, marks)).toBeCloseTo(9396.7 + 700 + 100, 8);
  });

  it('estimates a positive liquidation price for a deep losing long', () => {
    // balance 10000 開 1@60000 10x（IM 6000、fee 33）→ 3967；mark 58000：uPnL −2000。
    const heavy = accountWith(3967, [crossPosition({ qty: 1, margin: 6000, openFee: 33 })]);
    const heavyMarks = { BTCUSDT: 58000 } as const;
    // marginBalance = 3967 + 6000 − 2000 = 7967；MM = 1×58000×0.005 = 290；buffer = 7677。
    // 虧損倉 refPrice 用 mark：58000 − 7677/1 = 50323。
    const estimate = estimatedCrossLiquidationPrice(heavy.positions[0]!, heavy, heavyMarks);
    expect(estimate).toBeCloseTo(50323, 8);
  });

  it('anchors a profitable position at the mark so unrealized profit is not double counted', () => {
    const heavy = accountWith(3967, [crossPosition({ qty: 1, margin: 6000, openFee: 33 })]);
    const heavyMarks = { BTCUSDT: 61000 } as const;
    // marginBalance = 3967 + 6000 + 1000 = 10967；MM = 305；buffer = 10662；61000 − 10662 = 50338。
    // mark 錨即靜態精確解：61000 − 50338 = 10662 恰好耗盡 buffer（entry 錨會多算 1000 利潤）。
    const estimate = estimatedCrossLiquidationPrice(heavy.positions[0]!, heavy, heavyMarks);
    expect(estimate).toBeCloseTo(50338, 8);
  });

  it('deducts the aggregate maintenance margin across all cross positions', () => {
    // 雙 cross 倉：估算 BTC 倉時 buffer 須扣減聚合 MM（含 ETH 倉），
    // 只扣本倉 MM 會漏算 10×3000×0.005 = 150，估算價偏遠 150/1 = 150。
    const dual = accountWith(3967, [
      crossPosition({ qty: 1, margin: 6000, openFee: 33 }),
      crossPosition({ id: 'p2', symbol: 'ETHUSDT', qty: 10, entryPrice: 3000, margin: 3000 }),
    ]);
    const dualMarks = { BTCUSDT: 58000, ETHUSDT: 3000 } as const;
    // marginBalance = 3967 + 9000 − 2000 = 10967；crossMM = 290 + 150 = 440；
    // buffer = 10527；58000 − 10527/1 = 47473（漏扣 ETH MM 會得 47623）。
    const estimate = estimatedCrossLiquidationPrice(dual.positions[0]!, dual, dualMarks);
    expect(estimate).toBeCloseTo(47473, 8);
  });

  it('estimates the short side by adding the buffer above the reference', () => {
    // short 1@60000 10x，mark 62000：uPnL −2000；marginBalance = 3967+6000−2000 = 7967；
    // MM = 310；buffer = 7657；62000 + 7657 = 69657。
    const heavy = accountWith(3967, [
      crossPosition({ side: 'short', qty: 1, margin: 6000, openFee: 33 }),
    ]);
    const heavyMarks = { BTCUSDT: 62000 } as const;
    const estimate = estimatedCrossLiquidationPrice(heavy.positions[0]!, heavy, heavyMarks);
    expect(estimate).toBeCloseTo(69657, 8);
  });

  it('returns null for isolated positions or missing marks', () => {
    const isolated = crossPosition({ marginMode: 'isolated' });
    expect(
      estimatedCrossLiquidationPrice(isolated, accountWith(9396.7, [isolated]), marks),
    ).toBeNull();
    expect(estimatedCrossLiquidationPrice(account.positions[0]!, account, {})).toBeNull();
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
