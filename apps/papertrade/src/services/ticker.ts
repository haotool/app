import { z } from 'zod';
import { isMarketSymbol, type MarketSymbol } from '../config/market';

export interface Ticker {
  symbol: MarketSymbol;
  lastPrice: number;
  markPrice: number;
  price24hPcnt: number;
  highPrice24h: number;
  lowPrice24h: number;
  turnover24h: number;
  volume24h: number;
  // 永續合約資訊欄位：期貨或缺值時 Bybit 可能回空字串，一律容忍缺值。
  fundingRate?: number;
  nextFundingTime?: number;
  openInterestValue?: number;
}

const wsTickerSchema = z.object({
  type: z.string(),
  data: z.object({
    symbol: z.string(),
    lastPrice: z.string().optional(),
    markPrice: z.string().optional(),
    price24hPcnt: z.string().optional(),
    highPrice24h: z.string().optional(),
    lowPrice24h: z.string().optional(),
    turnover24h: z.string().optional(),
    volume24h: z.string().optional(),
    fundingRate: z.string().optional(),
    nextFundingTime: z.string().optional(),
    openInterestValue: z.string().optional(),
  }),
});

export type TickerUpdate =
  | { kind: 'snapshot'; ticker: Ticker }
  | { kind: 'delta'; symbol: MarketSymbol; patch: Partial<Omit<Ticker, 'symbol'>> };

const NUMERIC_FIELDS = [
  'lastPrice',
  'markPrice',
  'price24hPcnt',
  'highPrice24h',
  'lowPrice24h',
  'turnover24h',
  'volume24h',
  'fundingRate',
  'nextFundingTime',
  'openInterestValue',
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

export function parseTickerMessage(message: unknown): TickerUpdate | null {
  const parsed = wsTickerSchema.safeParse(message);
  if (!parsed.success) return null;
  const { type, data } = parsed.data;
  if (!isMarketSymbol(data.symbol)) return null;

  const patch: Partial<Record<NumericField, number>> = {};
  for (const field of NUMERIC_FIELDS) {
    const raw = data[field];
    // 空字串 Number('') 為 0，會誤植假值，視同缺值。
    if (raw === undefined || raw === '') continue;
    const value = Number(raw);
    if (Number.isFinite(value)) {
      patch[field] = value;
    }
  }

  if (type === 'snapshot') {
    const { lastPrice, price24hPcnt, highPrice24h, lowPrice24h, turnover24h, volume24h } = patch;
    if (
      lastPrice === undefined ||
      price24hPcnt === undefined ||
      highPrice24h === undefined ||
      lowPrice24h === undefined ||
      turnover24h === undefined ||
      volume24h === undefined
    ) {
      return null;
    }
    return {
      kind: 'snapshot',
      ticker: {
        symbol: data.symbol,
        lastPrice,
        markPrice: patch.markPrice ?? lastPrice,
        price24hPcnt,
        highPrice24h,
        lowPrice24h,
        turnover24h,
        volume24h,
        fundingRate: patch.fundingRate,
        nextFundingTime: patch.nextFundingTime,
        openInterestValue: patch.openInterestValue,
      },
    };
  }

  if (Object.keys(patch).length === 0) return null;
  return { kind: 'delta', symbol: data.symbol, patch };
}
