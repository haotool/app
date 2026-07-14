import { z } from 'zod';

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
  return [...incoming].reverse().concat(current).slice(0, limit);
}
