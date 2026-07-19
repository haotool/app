import { describe, expect, it } from 'vitest';
import {
  computeIndicatorLine,
  computeMacd,
  computeSma,
  computeEma,
  emaFromValues,
  INDICATORS,
} from './indicators';
import { type Kline } from '../services/kline';

function bar(time: number, close: number): Kline {
  return { time, open: close, high: close, low: close, close, volume: 1 };
}

const bars = [bar(60, 1), bar(120, 2), bar(180, 3), bar(240, 4), bar(300, 5)];

describe('computeSma', () => {
  it('matches hand-computed values and starts at the first full window', () => {
    expect(computeSma(bars, 3)).toEqual([
      { time: 180, value: 2 },
      { time: 240, value: 3 },
      { time: 300, value: 4 },
    ]);
  });

  it('slides the window over varied closes', () => {
    const varied = [bar(60, 2), bar(120, 4), bar(180, 6), bar(240, 8)];
    expect(computeSma(varied, 2)).toEqual([
      { time: 120, value: 3 },
      { time: 180, value: 5 },
      { time: 240, value: 7 },
    ]);
  });

  it('returns an empty window when bars are insufficient', () => {
    expect(computeSma(bars.slice(0, 2), 3)).toEqual([]);
    expect(computeSma([], 3)).toEqual([]);
  });

  it('recomputes the last point when the live bar close changes', () => {
    const updated = [...bars.slice(0, -1), bar(300, 8)];
    const line = computeSma(updated, 3);
    expect(line.at(-1)).toEqual({ time: 300, value: 5 });
    expect(line.slice(0, -1)).toEqual(computeSma(bars, 3).slice(0, -1));
  });
});

describe('computeEma', () => {
  it('seeds with the SMA and applies the smoothing factor', () => {
    expect(computeEma(bars, 3)).toEqual([
      { time: 180, value: 2 },
      { time: 240, value: 3 },
      { time: 300, value: 4 },
    ]);
  });

  it('matches a hand-computed sample with k = 2 / (period + 1)', () => {
    const sample = [bar(1, 10), bar(2, 11), bar(3, 12), bar(4, 13), bar(5, 14), bar(6, 15)];
    const line = computeEma(sample, 4);
    expect(line).toHaveLength(3);
    expect(line[0]).toEqual({ time: 4, value: 11.5 });
    expect(line[1]?.value).toBeCloseTo(12.5, 10);
    expect(line[2]?.value).toBeCloseTo(13.5, 10);
  });

  it('returns an empty window when bars are insufficient', () => {
    expect(computeEma(bars.slice(0, 2), 3)).toEqual([]);
    expect(computeEma([], 3)).toEqual([]);
  });
});

describe('emaFromValues', () => {
  it('matches computeEma output on the same closes', () => {
    const sample = [bar(1, 10), bar(2, 11), bar(3, 12), bar(4, 13), bar(5, 14), bar(6, 15)];
    const values = emaFromValues(
      sample.map((item) => item.close),
      4,
    );
    expect(values).toEqual(computeEma(sample, 4).map((point) => point.value));
  });

  it('returns an empty window when values are insufficient', () => {
    expect(emaFromValues([1, 2], 3)).toEqual([]);
    expect(emaFromValues([], 3)).toEqual([]);
    expect(emaFromValues([1, 2, 3], 0)).toEqual([]);
  });
});

describe('computeMacd', () => {
  // RS-B 官方查證測試向量（對照 TA-Lib / pandas-ta，容差 ±1e-4）。
  const closes = [
    22.27, 22.19, 22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29, 22.15, 22.39, 22.38,
    22.61, 22.36, 22.56, 22.36, 22.03, 22.09, 22.09, 22.46, 22.59, 22.24, 22.03, 21.89, 22.09,
    22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29, 22.15, 22.39, 22.38, 22.61, 22.36,
    22.56, 22.8, 22.97, 23.13, 23.19, 23.08, 23.01, 23.09, 23.0, 23.09, 23.06,
  ];
  const vectorBars = closes.map((close, index) => bar((index + 1) * 60, close));

  const expected: [number, number, number, number][] = [
    [33, -0.000569, -0.020235, 0.019666],
    [34, -0.007822, -0.017753, 0.009931],
    [37, 0.0413, 0.002382, 0.038918],
    [40, 0.086967, 0.032907, 0.05406],
    [43, 0.197602, 0.098312, 0.09929],
    [46, 0.225036, 0.157492, 0.067544],
    [49, 0.218784, 0.188288, 0.030496],
  ];

  it('matches the TA-Lib reference vector within 1e-4', () => {
    const macd = computeMacd(vectorBars);
    for (const [index, dif, dea, hist] of expected) {
      const point = macd.find((item) => item.time === (index + 1) * 60);
      expect(point, `index ${index}`).toBeDefined();
      expect(point?.dif).toBeCloseTo(dif, 4);
      expect(point?.dea).toBeCloseTo(dea, 4);
      expect(point?.hist).toBeCloseTo(hist, 4);
    }
  });

  it('starts at bars index (slow - 1) + (signal - 1) without padding', () => {
    const macd = computeMacd(vectorBars);
    expect(macd).toHaveLength(closes.length - 33);
    expect(macd[0]?.time).toBe(34 * 60);
  });

  it('returns an empty window when bars are insufficient', () => {
    expect(computeMacd(vectorBars.slice(0, 33))).toEqual([]);
    expect(computeMacd([])).toEqual([]);
  });

  it('keeps hist equal to dif minus dea on every point', () => {
    for (const point of computeMacd(vectorBars)) {
      expect(point.hist).toBeCloseTo(point.dif - point.dea, 12);
    }
  });
});

describe('computeIndicatorLine', () => {
  it('dispatches SMA and EMA by indicator definition', () => {
    const ma7 = INDICATORS.find((definition) => definition.id === 'ma7');
    const ema12 = INDICATORS.find((definition) => definition.id === 'ema12');
    if (ma7 === undefined || ema12 === undefined) throw new Error('missing definition');

    const long = Array.from({ length: 20 }, (_, index) => bar(index + 1, index + 1));
    expect(computeIndicatorLine(long, ma7)).toEqual(computeSma(long, 7));
    expect(computeIndicatorLine(long, ema12)).toEqual(computeEma(long, 12));
  });

  it('exposes five overlays with unique color tokens', () => {
    expect(INDICATORS.map((definition) => definition.id)).toEqual([
      'ma7',
      'ma25',
      'ma99',
      'ema12',
      'ema26',
    ]);
    const tokens = new Set(INDICATORS.map((definition) => definition.colorToken));
    expect(tokens.size).toBe(5);
  });
});
