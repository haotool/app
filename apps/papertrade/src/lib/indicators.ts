import { type Kline } from '../services/kline';

export const INDICATOR_IDS = ['ma7', 'ma25', 'ma99', 'ema12', 'ema26'] as const;

export type IndicatorId = (typeof INDICATOR_IDS)[number];

export interface IndicatorDefinition {
  id: IndicatorId;
  label: string;
  kind: 'sma' | 'ema';
  period: number;
  colorToken: string;
}

export const INDICATORS: IndicatorDefinition[] = [
  { id: 'ma7', label: 'MA7', kind: 'sma', period: 7, colorToken: '--color-indicator-1' },
  { id: 'ma25', label: 'MA25', kind: 'sma', period: 25, colorToken: '--color-indicator-2' },
  { id: 'ma99', label: 'MA99', kind: 'sma', period: 99, colorToken: '--color-indicator-3' },
  { id: 'ema12', label: 'EMA12', kind: 'ema', period: 12, colorToken: '--color-indicator-4' },
  { id: 'ema26', label: 'EMA26', kind: 'ema', period: 26, colorToken: '--color-indicator-5' },
];

export interface IndicatorPoint {
  time: number;
  value: number;
}

// 不足期數回空窗（不補 0）：線自第一個完整視窗起繪。
export function computeSma(bars: Kline[], period: number): IndicatorPoint[] {
  if (period <= 0 || bars.length < period) return [];
  const points: IndicatorPoint[] = [];
  let sum = 0;
  bars.forEach((bar, index) => {
    sum += bar.close;
    const dropped = bars[index - period];
    if (dropped !== undefined) sum -= dropped.close;
    if (index >= period - 1) points.push({ time: bar.time, value: sum / period });
  });
  return points;
}

// 以首個完整視窗的 SMA 為種子，之後遞迴平滑（k = 2 / (period + 1)）。
export function computeEma(bars: Kline[], period: number): IndicatorPoint[] {
  if (period <= 0 || bars.length < period) return [];
  const smoothing = 2 / (period + 1);
  let seed = 0;
  for (let index = 0; index < period; index += 1) {
    seed += bars[index]?.close ?? 0;
  }
  let previous = seed / period;
  const points: IndicatorPoint[] = [{ time: bars[period - 1]?.time ?? 0, value: previous }];
  for (let index = period; index < bars.length; index += 1) {
    const bar = bars[index];
    if (bar === undefined) break;
    previous = bar.close * smoothing + previous * (1 - smoothing);
    points.push({ time: bar.time, value: previous });
  }
  return points;
}

export function computeIndicatorLine(
  bars: Kline[],
  definition: IndicatorDefinition,
): IndicatorPoint[] {
  switch (definition.kind) {
    case 'sma':
      return computeSma(bars, definition.period);
    case 'ema':
      return computeEma(bars, definition.period);
    default:
      return definition.kind satisfies never;
  }
}
