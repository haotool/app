import { type Kline } from '../services/kline';
import { type MacdPoint } from './indicators';

export interface PivotPoint {
  index: number;
  time: number;
  price: number;
}

export interface Pivots {
  highs: PivotPoint[];
  lows: PivotPoint[];
}

export interface TrendLinePoint {
  time: number;
  price: number;
}

export interface TrendLine {
  p1: TrendLinePoint;
  p2: TrendLinePoint;
  p3: TrendLinePoint;
}

export interface SupportResistanceLevel {
  price: number;
  touches: number;
}

export interface Divergence {
  time: number;
  kind: 'bullish' | 'bearish';
}

const ATR_PERIOD = 14;
const DIVERGENCE_MIN_GAP = 10;
const DIVERGENCE_MAX_GAP = 80;
const DIVERGENCE_MIN_SWING_ATR = 0.5;
const SR_TOLERANCE_ATR = 0.3;
const SR_MIN_TOUCHES = 2;
const SR_MAX_LEVELS = 4;

// 標準 fractal：中心 K 棒的 high／low 嚴格高／低於左右各 N 根鄰棒；
// rightBars 根之後才確認，已確認 pivot 不因後續 bar 重繪。
export function detectPivots(bars: Kline[], leftBars = 5, rightBars = 5): Pivots {
  const highs: PivotPoint[] = [];
  const lows: PivotPoint[] = [];
  for (let index = leftBars; index < bars.length - rightBars; index += 1) {
    const center = bars[index];
    if (center === undefined) continue;
    let isHigh = true;
    let isLow = true;
    for (let offset = index - leftBars; offset <= index + rightBars; offset += 1) {
      if (offset === index) continue;
      const neighbor = bars[offset];
      if (neighbor === undefined) continue;
      if (neighbor.high >= center.high) isHigh = false;
      if (neighbor.low <= center.low) isLow = false;
      if (!isHigh && !isLow) break;
    }
    if (isHigh) highs.push({ index, time: center.time, price: center.high });
    if (isLow) lows.push({ index, time: center.time, price: center.low });
  }
  return { highs, lows };
}

// 標準 True Range 簡單平均：取最近 period 根 TR 平均；不足時以可得 TR 平均，無 TR 回 0。
export function computeAtr(bars: Kline[], period = ATR_PERIOD): number {
  const ranges: number[] = [];
  for (let index = Math.max(1, bars.length - period); index < bars.length; index += 1) {
    const bar = bars[index];
    const previous = bars[index - 1];
    if (bar === undefined || previous === undefined) continue;
    ranges.push(
      Math.max(
        bar.high - bar.low,
        Math.abs(bar.high - previous.close),
        Math.abs(bar.low - previous.close),
      ),
    );
  }
  if (ranges.length === 0) return 0;
  return ranges.reduce((sum, value) => sum + value, 0) / ranges.length;
}

// 取最近兩個已確認同型 pivot 為錨點，線性外推至最新 bar 的第三點（ADR-R6-03 簡化裁決）。
export function computeTrendLine(pivots: PivotPoint[], lastBar: Kline): TrendLine | null {
  const first = pivots.at(-2);
  const second = pivots.at(-1);
  if (first === undefined || second === undefined) return null;
  if (second.time <= first.time || lastBar.time <= second.time) return null;
  const slope = (second.price - first.price) / (second.time - first.time);
  return {
    p1: { time: first.time, price: first.price },
    p2: { time: second.time, price: second.price },
    p3: { time: lastBar.time, price: second.price + slope * (lastBar.time - second.time) },
  };
}

// pivot 價位聚類（容差 0.3 × ATR）：觸碰數 ≥ 2 的群按觸碰數（tie 用新近度）取前 4 檔。
export function computeSupportResistance(pivots: Pivots, atr: number): SupportResistanceLevel[] {
  const sorted = [...pivots.highs, ...pivots.lows].sort((a, b) => a.price - b.price);
  if (sorted.length === 0) return [];
  const tolerance = atr * SR_TOLERANCE_ATR;
  interface Cluster {
    anchor: number;
    sum: number;
    count: number;
    latestIndex: number;
  }
  const clusters: Cluster[] = [];
  for (const pivot of sorted) {
    const current = clusters.at(-1);
    if (current !== undefined && pivot.price - current.anchor <= tolerance) {
      current.sum += pivot.price;
      current.count += 1;
      current.latestIndex = Math.max(current.latestIndex, pivot.index);
    } else {
      clusters.push({
        anchor: pivot.price,
        sum: pivot.price,
        count: 1,
        latestIndex: pivot.index,
      });
    }
  }
  return clusters
    .filter((cluster) => cluster.count >= SR_MIN_TOUCHES)
    .sort((a, b) => b.count - a.count || b.latestIndex - a.latestIndex)
    .slice(0, SR_MAX_LEVELS)
    .map((cluster) => ({ price: cluster.sum / cluster.count, touches: cluster.count }));
}

function pairDivergence(
  pivots: PivotPoint[],
  difByTime: Map<number, number>,
  minSwing: number,
  kind: Divergence['kind'],
): Divergence | null {
  const previous = pivots.at(-2);
  const latest = pivots.at(-1);
  if (previous === undefined || latest === undefined) return null;
  const gap = latest.index - previous.index;
  if (gap < DIVERGENCE_MIN_GAP || gap > DIVERGENCE_MAX_GAP) return null;
  const previousDif = difByTime.get(previous.time);
  const latestDif = difByTime.get(latest.time);
  if (previousDif === undefined || latestDif === undefined) return null;
  if (kind === 'bullish') {
    const drop = previous.price - latest.price;
    if (drop <= 0 || drop < minSwing || latestDif <= previousDif) return null;
  } else {
    const rise = latest.price - previous.price;
    if (rise <= 0 || rise < minSwing || latestDif >= previousDif) return null;
  }
  return { time: latest.time, kind };
}

// Regular divergence（以價格 pivot 為錨、比對 DIF）：
// bullish＝價格 Lower Low ＋ DIF Higher Low；bearish＝價格 Higher High ＋ DIF Lower High。
export function detectDivergences(
  bars: Kline[],
  macd: MacdPoint[],
  pivots: Pivots = detectPivots(bars),
  atr: number = computeAtr(bars),
): Divergence[] {
  if (macd.length === 0) return [];
  const difByTime = new Map(macd.map((point) => [point.time, point.dif]));
  const minSwing = atr * DIVERGENCE_MIN_SWING_ATR;
  const result: Divergence[] = [];
  const bullish = pairDivergence(pivots.lows, difByTime, minSwing, 'bullish');
  if (bullish !== null) result.push(bullish);
  const bearish = pairDivergence(pivots.highs, difByTime, minSwing, 'bearish');
  if (bearish !== null) result.push(bearish);
  return result.sort((a, b) => a.time - b.time);
}

export interface ChartAnalysis {
  divergences: Divergence[];
  support: TrendLine | null;
  resistance: TrendLine | null;
  levels: SupportResistanceLevel[];
}

export const EMPTY_CHART_ANALYSIS: ChartAnalysis = {
  divergences: [],
  support: null,
  resistance: null,
  levels: [],
};

export interface ChartAnalysisOptions {
  divergences: boolean;
  trendLines: boolean;
  supportResistance: boolean;
}

// 單一入口：pivot 與 ATR 只算一次，供背離／趨勢線／支撐阻力共用。
export function analyzeChart(
  bars: Kline[],
  macd: MacdPoint[],
  options: ChartAnalysisOptions,
): ChartAnalysis {
  const lastBar = bars.at(-1);
  const enabled = options.divergences || options.trendLines || options.supportResistance;
  if (lastBar === undefined || !enabled) return EMPTY_CHART_ANALYSIS;
  const confirmedBars = bars.length > 1 ? bars.slice(0, -1) : bars;
  const pivots = detectPivots(confirmedBars);
  const atr = computeAtr(confirmedBars);
  return {
    divergences: options.divergences ? detectDivergences(bars, macd, pivots, atr) : [],
    support: options.trendLines ? computeTrendLine(pivots.lows, lastBar) : null,
    resistance: options.trendLines ? computeTrendLine(pivots.highs, lastBar) : null,
    levels: options.supportResistance ? computeSupportResistance(pivots, atr) : [],
  };
}
