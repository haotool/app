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

// EMA 底層 SSOT：以首個完整視窗的 SMA 為種子，之後遞迴平滑（k = 2 / (period + 1)）。
// 回傳序列第 offset 項對齊輸入 index = offset + period - 1。
export function emaFromValues(values: number[], period: number): number[] {
  if (period <= 0 || values.length < period) return [];
  const smoothing = 2 / (period + 1);
  let seed = 0;
  for (let index = 0; index < period; index += 1) {
    seed += values[index] ?? 0;
  }
  let previous = seed / period;
  const result: number[] = [previous];
  for (let index = period; index < values.length; index += 1) {
    previous = (values[index] ?? 0) * smoothing + previous * (1 - smoothing);
    result.push(previous);
  }
  return result;
}

export function computeEma(bars: Kline[], period: number): IndicatorPoint[] {
  const values = emaFromValues(
    bars.map((bar) => bar.close),
    period,
  );
  return values.map((value, offset) => ({
    time: bars[offset + period - 1]?.time ?? 0,
    value,
  }));
}

export interface MacdPoint {
  time: number;
  dif: number;
  dea: number;
  hist: number;
}

// MACD(12,26,9)：DIF = EMA(fast) − EMA(slow)、DEA = EMA(DIF, signal)、HIST = DIF − DEA。
// TA-Lib 慣例：fast EMA 種子視窗對齊 slow EMA 首個輸出（index = slow - 1），
// 首個有效輸出對齊 bars index = (slow - 1) + (signal - 1)；不足期數不輸出。
export function computeMacd(bars: Kline[], fast = 12, slow = 26, signal = 9): MacdPoint[] {
  const closes = bars.map((bar) => bar.close);
  const fastEma = emaFromValues(closes.slice(slow - fast), fast);
  const slowEma = emaFromValues(closes, slow);
  const dif = slowEma.map((slowValue, offset) => (fastEma[offset] ?? 0) - slowValue);
  const dea = emaFromValues(dif, signal);
  const start = slow - 1 + signal - 1;
  return dea.map((deaValue, offset) => {
    const difValue = dif[offset + signal - 1] ?? 0;
    return {
      time: bars[start + offset]?.time ?? 0,
      dif: difValue,
      dea: deaValue,
      hist: difValue - deaValue,
    };
  });
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
