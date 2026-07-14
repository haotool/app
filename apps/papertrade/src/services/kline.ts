import { z } from 'zod';
import { BYBIT_REST_URL, type MarketSymbol, type TimeframeId } from '../config/market';

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const restKlineSchema = z.object({
  retCode: z.number(),
  result: z.object({
    list: z.array(z.array(z.string())),
  }),
});

const wsKlineSchema = z.object({
  data: z.array(
    z.object({
      start: z.number(),
      open: z.string(),
      high: z.string(),
      low: z.string(),
      close: z.string(),
      volume: z.string(),
      confirm: z.boolean(),
    }),
  ),
});

function isFiniteKline(kline: Kline): boolean {
  return (
    Number.isFinite(kline.time) &&
    Number.isFinite(kline.open) &&
    Number.isFinite(kline.high) &&
    Number.isFinite(kline.low) &&
    Number.isFinite(kline.close) &&
    Number.isFinite(kline.volume)
  );
}

function rowToKline(row: string[]): Kline | null {
  const [start, open, high, low, close, volume] = row;
  if (
    start === undefined ||
    open === undefined ||
    high === undefined ||
    low === undefined ||
    close === undefined ||
    volume === undefined
  ) {
    return null;
  }
  const kline: Kline = {
    time: Number(start) / 1000,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume),
  };
  return isFiniteKline(kline) ? kline : null;
}

export async function fetchKlines(
  symbol: MarketSymbol,
  interval: TimeframeId,
  limit: number,
): Promise<Kline[]> {
  const params = new URLSearchParams({
    category: 'linear',
    symbol,
    interval,
    limit: String(limit),
  });
  const response = await fetch(`${BYBIT_REST_URL}/v5/market/kline?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Kline request failed with status ${response.status}`);
  }
  const parsed = restKlineSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.retCode !== 0) {
    throw new Error('Kline response is invalid');
  }
  return parsed.data.result.list
    .map(rowToKline)
    .filter((kline): kline is Kline => kline !== null)
    .sort((a, b) => a.time - b.time);
}

export function parseKlineMessage(message: unknown): Kline[] {
  const parsed = wsKlineSchema.safeParse(message);
  if (!parsed.success) return [];
  return parsed.data.data
    .map((entry) => ({
      time: entry.start / 1000,
      open: Number(entry.open),
      high: Number(entry.high),
      low: Number(entry.low),
      close: Number(entry.close),
      volume: Number(entry.volume),
    }))
    .filter(isFiniteKline);
}

export function mergeKline(bars: Kline[], incoming: Kline): Kline[] {
  const last = bars.at(-1);
  if (last === undefined || incoming.time > last.time) {
    return [...bars, incoming];
  }
  if (incoming.time === last.time) {
    return [...bars.slice(0, -1), incoming];
  }
  return bars;
}
