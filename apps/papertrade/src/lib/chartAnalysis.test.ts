import { describe, expect, it } from 'vitest';
import {
  analyzeChart,
  computeAtr,
  computeSupportResistance,
  computeTrendLine,
  detectDivergences,
  detectPivots,
  EMPTY_CHART_ANALYSIS,
  type PivotPoint,
  type Pivots,
} from './chartAnalysis';
import { type MacdPoint } from './indicators';
import { type Kline } from '../services/kline';

// 每根 bar 以中價 ±0.5 展開 high/low，時間自 60 起每根 +60。
function wave(prices: number[]): Kline[] {
  return prices.map((price, index) => ({
    time: (index + 1) * 60,
    open: price,
    high: price + 0.5,
    low: price - 0.5,
    close: price,
    volume: 1,
  }));
}

function pivot(index: number, price: number): PivotPoint {
  return { index, time: (index + 1) * 60, price };
}

function macdPoint(time: number, dif: number): MacdPoint {
  return { time, dif, dea: 0, hist: 0 };
}

// 峰（index 7 高 20.5、index 23 高 20.0）與谷（index 15 低 7.5）的三擺盪序列。
const swingPrices = [
  10, 11.5, 13, 14.5, 16, 17.5, 19, 20, 18.5, 17, 15.5, 14, 12.5, 11, 9.5, 8, 9.5, 11, 12.5, 14,
  15.5, 17, 18.5, 19.5, 18, 16.5, 15, 13.5, 12, 10.5,
];
const swingBars = wave(swingPrices);

describe('detectPivots', () => {
  it('finds confirmed fractal highs and lows at the expected indexes', () => {
    const { highs, lows } = detectPivots(swingBars);
    expect(highs.map((point) => point.index)).toEqual([7, 23]);
    expect(highs.map((point) => point.price)).toEqual([20.5, 20]);
    expect(lows.map((point) => point.index)).toEqual([15]);
    expect(lows[0]).toEqual({ index: 15, time: 16 * 60, price: 7.5 });
  });

  it('does not confirm the last rightBars bars', () => {
    // 峰在倒數第 3 根（rightBars 不足）：不得回報。
    const rising = wave([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8]);
    expect(detectPivots(rising).highs).toEqual([]);
  });

  it('requires strict inequality against every neighbor', () => {
    // 平頂（兩根同高）不構成嚴格 fractal。
    const flatTop = wave([1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2, 1]);
    expect(detectPivots(flatTop).highs).toEqual([]);
  });

  it('returns empty pivots for short sequences', () => {
    expect(detectPivots(wave([1, 2, 3]))).toEqual({ highs: [], lows: [] });
    expect(detectPivots([])).toEqual({ highs: [], lows: [] });
  });
});

describe('computeAtr', () => {
  it('averages the true range over the recent window', () => {
    const bars = wave([10, 11, 12]);
    // 每根 TR = max(1.0, |high − prevClose| = 1.5, |low − prevClose| = 0.5) = 1.5。
    expect(computeAtr(bars)).toBeCloseTo(1.5, 10);
  });

  it('uses gaps against the previous close', () => {
    const bars: Kline[] = [
      { time: 60, open: 9, high: 10, low: 8, close: 9, volume: 1 },
      { time: 120, open: 15, high: 15, low: 14, close: 15, volume: 1 },
    ];
    // TR = max(1, |15 − 9| = 6, |14 − 9| = 5) = 6。
    expect(computeAtr(bars)).toBe(6);
  });

  it('limits the window to the given period', () => {
    const bars: Kline[] = [
      { time: 60, open: 1, high: 101, low: 1, close: 1, volume: 1 },
      { time: 120, open: 1, high: 3, low: 1, close: 1, volume: 1 },
      { time: 180, open: 1, high: 3, low: 1, close: 1, volume: 1 },
    ];
    // period=1 只取最後一根 TR = 2。
    expect(computeAtr(bars, 1)).toBe(2);
  });

  it('returns 0 when no true range is available', () => {
    expect(computeAtr([])).toBe(0);
    expect(computeAtr(wave([10]))).toBe(0);
  });
});

describe('computeTrendLine', () => {
  const lastBar = wave(Array.from({ length: 31 }, () => 10)).at(-1)!;

  it('anchors the two most recent pivots and extrapolates to the last bar', () => {
    const pivots = [pivot(2, 90), pivot(5, 100), pivot(20, 110)];
    const line = computeTrendLine(pivots, lastBar);
    expect(line).not.toBeNull();
    expect(line?.p1).toEqual({ time: 6 * 60, price: 100 });
    expect(line?.p2).toEqual({ time: 21 * 60, price: 110 });
    expect(line?.p3.time).toBe(31 * 60);
    // 斜率 10 / (15 × 60)，外推 10 根 → 110 + 10 × 10/15。
    expect(line?.p3.price).toBeCloseTo(110 + (10 * 10) / 15, 10);
  });

  it('uses the confirmed pivot prices of a known sequence as anchors', () => {
    const { highs } = detectPivots(swingBars);
    const line = computeTrendLine(highs, swingBars.at(-1)!);
    expect(line?.p1.price).toBe(20.5);
    expect(line?.p2.price).toBe(20);
    expect(line?.p3.time).toBe(30 * 60);
  });

  it('returns null with fewer than two pivots', () => {
    expect(computeTrendLine([], lastBar)).toBeNull();
    expect(computeTrendLine([pivot(5, 100)], lastBar)).toBeNull();
  });

  it('returns null when the last bar does not extend beyond the second anchor', () => {
    const pivots = [pivot(5, 100), pivot(30, 110)];
    expect(computeTrendLine(pivots, lastBar)).toBeNull();
  });
});

describe('computeSupportResistance', () => {
  it('clusters pivot prices within the ATR tolerance and counts touches', () => {
    const pivots: Pivots = {
      lows: [pivot(5, 100), pivot(20, 100.2), pivot(35, 99.9), pivot(10, 90)],
      highs: [pivot(15, 110), pivot(30, 110.1)],
    };
    // atr=1 → 容差 0.3：{99.9,100,100.2} 三觸、{110,110.1} 兩觸、{90} 單觸剔除。
    const levels = computeSupportResistance(pivots, 1);
    expect(levels).toHaveLength(2);
    expect(levels[0]?.touches).toBe(3);
    expect(levels[0]?.price).toBeCloseTo((99.9 + 100 + 100.2) / 3, 10);
    expect(levels[1]?.touches).toBe(2);
    expect(levels[1]?.price).toBeCloseTo(110.05, 10);
  });

  it('breaks touch ties by recency', () => {
    const pivots: Pivots = {
      lows: [pivot(5, 100), pivot(10, 100)],
      highs: [pivot(8, 110), pivot(30, 110)],
    };
    const levels = computeSupportResistance(pivots, 1);
    expect(levels.map((level) => level.price)).toEqual([110, 100]);
  });

  it('caps the output at four levels', () => {
    const lows = [100, 105, 110, 115, 120].flatMap((price, group) => [
      pivot(group * 10, price),
      pivot(group * 10 + 3, price),
    ]);
    const levels = computeSupportResistance({ lows, highs: [] }, 1);
    expect(levels).toHaveLength(4);
  });

  it('returns no levels without repeated touches', () => {
    expect(computeSupportResistance({ lows: [pivot(5, 100)], highs: [] }, 1)).toEqual([]);
    expect(computeSupportResistance({ lows: [], highs: [] }, 1)).toEqual([]);
  });
});

describe('detectDivergences', () => {
  // 兩谷序列：谷1（index 15 低 7.5）→ 谷2（index 30 低 5.5）價格 Lower Low，間距 15。
  const bullishBars = wave([
    10, 11.5, 13, 14.5, 16, 17.5, 19, 20, 18.5, 17, 15.5, 14, 12.5, 11, 9.5, 8, 9.5, 11, 12.5, 14,
    15.5, 16.5, 17, 15.5, 14, 12.5, 11, 9.5, 8, 7, 6, 7.5, 9, 10.5, 12, 13.5, 15,
  ]);

  it('flags a regular bullish divergence (price LL + DIF HL)', () => {
    const macd = [macdPoint(16 * 60, -1), macdPoint(31 * 60, -0.4)];
    expect(detectDivergences(bullishBars, macd)).toEqual([{ time: 31 * 60, kind: 'bullish' }]);
  });

  it('stays silent when the DIF confirms the new low', () => {
    const macd = [macdPoint(16 * 60, -1), macdPoint(31 * 60, -1.6)];
    expect(detectDivergences(bullishBars, macd)).toEqual([]);
  });

  // 雙峰序列：峰1（index 7 高 18.5）→ 峰2（index 22 高 20.5）價格 Higher High，間距 15。
  const bearishBars = wave([
    10, 11, 12, 13, 14, 15, 16.5, 18, 17, 16, 15, 14, 13, 12.5, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    19, 18, 17, 16, 15, 14,
  ]);

  it('flags a regular bearish divergence (price HH + DIF LH)', () => {
    const macd = [macdPoint(8 * 60, 1), macdPoint(23 * 60, 0.3)];
    expect(detectDivergences(bearishBars, macd)).toEqual([{ time: 23 * 60, kind: 'bearish' }]);
  });

  it('rejects pivot pairs outside the 10-80 bar gap window', () => {
    const macd = [macdPoint(6 * 60, -1), macdPoint(14 * 60, -0.4), macdPoint(120 * 60, -0.2)];
    const narrow: Pivots = { lows: [pivot(5, 10), pivot(13, 8)], highs: [] };
    expect(detectDivergences([], macd, narrow, 1)).toEqual([]);
    const wide: Pivots = { lows: [pivot(5, 10), pivot(119, 8)], highs: [] };
    expect(detectDivergences([], macd, wide, 1)).toEqual([]);
  });

  it('rejects swings below half the ATR', () => {
    const macd = [macdPoint(6 * 60, -1), macdPoint(21 * 60, -0.4)];
    const pivots: Pivots = { lows: [pivot(5, 10), pivot(20, 9.6)], highs: [] };
    // 擺幅 0.4 < 0.5 × atr(1)。
    expect(detectDivergences([], macd, pivots, 1)).toEqual([]);
    // 擺幅 0.4 ≥ 0.5 × atr(0.5)：門檻由 ATR 比例決定。
    expect(detectDivergences([], macd, pivots, 0.5)).toEqual([{ time: 21 * 60, kind: 'bullish' }]);
  });

  it('skips pivots without a MACD point at their time', () => {
    const macd = [macdPoint(31 * 60, -0.4)];
    expect(detectDivergences(bullishBars, macd)).toEqual([]);
    expect(detectDivergences(bullishBars, [])).toEqual([]);
  });
});

describe('analyzeChart', () => {
  const macd = [macdPoint(16 * 60, -1), macdPoint(31 * 60, -0.4)];
  const bars = wave([
    10, 11.5, 13, 14.5, 16, 17.5, 19, 20, 18.5, 17, 15.5, 14, 12.5, 11, 9.5, 8, 9.5, 11, 12.5, 14,
    15.5, 16.5, 17, 15.5, 14, 12.5, 11, 9.5, 8, 7, 6, 7.5, 9, 10.5, 12, 13.5, 15,
  ]);

  it('returns the shared empty analysis when every option is off', () => {
    const analysis = analyzeChart(bars, macd, {
      divergences: false,
      trendLines: false,
      supportResistance: false,
    });
    expect(analysis).toBe(EMPTY_CHART_ANALYSIS);
    expect(
      analyzeChart([], macd, { divergences: true, trendLines: true, supportResistance: true }),
    ).toBe(EMPTY_CHART_ANALYSIS);
  });

  it('computes only the requested sections', () => {
    const divergencesOnly = analyzeChart(bars, macd, {
      divergences: true,
      trendLines: false,
      supportResistance: false,
    });
    expect(divergencesOnly.divergences).toEqual([{ time: 31 * 60, kind: 'bullish' }]);
    expect(divergencesOnly.support).toBeNull();
    expect(divergencesOnly.levels).toEqual([]);

    const trendOnly = analyzeChart(bars, macd, {
      divergences: false,
      trendLines: true,
      supportResistance: false,
    });
    expect(trendOnly.divergences).toEqual([]);
    expect(trendOnly.support?.p2.price).toBe(5.5);
    expect(trendOnly.resistance?.p2.price).toBe(17.5);
  });
});
