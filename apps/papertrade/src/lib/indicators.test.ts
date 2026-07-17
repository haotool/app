import { describe, expect, it } from 'vitest';
import { computeIndicatorLine, computeSma, computeEma, INDICATORS } from './indicators';
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
