import { z } from 'zod';
import { BYBIT_REST_URL, type MarketSymbol } from '../config/market';

export interface PublicTrade {
  id: string;
  time: number;
  side: 'buy' | 'sell';
  price: number;
  size: number;
}

const wsTradeSchema = z.object({
  data: z.array(
    z.object({
      i: z.string(),
      T: z.number(),
      S: z.enum(['Buy', 'Sell']),
      p: z.string(),
      v: z.string(),
    }),
  ),
});

export function parseTradeMessage(message: unknown): PublicTrade[] {
  const parsed = wsTradeSchema.safeParse(message);
  if (!parsed.success) return [];
  const trades: PublicTrade[] = [];
  for (const row of parsed.data.data) {
    const price = Number(row.p);
    const size = Number(row.v);
    if (!Number.isFinite(price) || !Number.isFinite(size)) continue;
    trades.push({
      id: row.i,
      time: row.T,
      side: row.S === 'Buy' ? 'buy' : 'sell',
      price,
      size,
    });
  }
  return trades;
}

export function mergeTrades(
  current: PublicTrade[],
  incoming: PublicTrade[],
  limit: number,
): PublicTrade[] {
  if (incoming.length === 0) return current;
  // Bybit 陣列內舊到新；顯示採新到舊，故反轉後前插。
  // REST-first 競態下 WS 可能重推已回填的 execId：依 id 去重，同 id 以 incoming 為準。
  const next = [...incoming].reverse();
  const seen = new Set(next.map((trade) => trade.id));
  const deduped = current.filter((trade) => !seen.has(trade.id));
  return next.concat(deduped).slice(0, limit);
}

// REST 回填墊在既有即時成交之後，同 id 以即時推送為準。
export function backfillTrades(
  current: PublicTrade[],
  history: PublicTrade[],
  limit: number,
): PublicTrade[] {
  const seen = new Set(current.map((trade) => trade.id));
  const older = history.filter((trade) => !seen.has(trade.id));
  return [...current, ...older].slice(0, limit);
}

const restTradeSchema = z.object({
  retCode: z.number(),
  result: z.object({
    list: z.array(
      z.object({
        execId: z.string(),
        price: z.string(),
        size: z.string(),
        side: z.enum(['Buy', 'Sell']),
        time: z.string(),
      }),
    ),
  }),
});

export async function fetchRecentTrades(
  symbol: MarketSymbol,
  limit: number,
): Promise<PublicTrade[]> {
  const params = new URLSearchParams({ category: 'linear', symbol, limit: String(limit) });
  const response = await fetch(`${BYBIT_REST_URL}/v5/market/recent-trade?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Recent trade request failed with status ${response.status}`);
  }
  const parsed = restTradeSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.retCode !== 0) {
    throw new Error('Recent trade response is invalid');
  }
  const trades: PublicTrade[] = [];
  for (const row of parsed.data.result.list) {
    const price = Number(row.price);
    const size = Number(row.size);
    const time = Number(row.time);
    if (!Number.isFinite(price) || !Number.isFinite(size) || !Number.isFinite(time)) continue;
    trades.push({
      id: row.execId,
      time,
      side: row.side === 'Buy' ? 'buy' : 'sell',
      price,
      size,
    });
  }
  return trades.sort((a, b) => b.time - a.time);
}
