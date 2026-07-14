import { z } from 'zod';

export type OrderBookLevel = readonly [price: number, size: number];

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export const EMPTY_ORDER_BOOK: OrderBook = { bids: [], asks: [] };

const wsOrderbookSchema = z.object({
  type: z.string(),
  data: z.object({
    b: z.array(z.tuple([z.string(), z.string()])),
    a: z.array(z.tuple([z.string(), z.string()])),
  }),
});

function parseLevels(rows: [string, string][]): OrderBookLevel[] {
  const levels: OrderBookLevel[] = [];
  for (const [rawPrice, rawSize] of rows) {
    const price = Number(rawPrice);
    const size = Number(rawSize);
    if (Number.isFinite(price) && Number.isFinite(size)) {
      levels.push([price, size]);
    }
  }
  return levels;
}

function applyDelta(
  current: OrderBookLevel[],
  changes: OrderBookLevel[],
  descending: boolean,
): OrderBookLevel[] {
  const byPrice = new Map<number, number>(current);
  for (const [price, size] of changes) {
    if (size === 0) {
      byPrice.delete(price);
    } else {
      byPrice.set(price, size);
    }
  }
  const sorted = [...byPrice.entries()].sort((a, b) => (descending ? b[0] - a[0] : a[0] - b[0]));
  return sorted.map(([price, size]) => [price, size] as const);
}

export function applyOrderbookMessage(book: OrderBook, message: unknown): OrderBook {
  const parsed = wsOrderbookSchema.safeParse(message);
  if (!parsed.success) return book;
  const bidChanges = parseLevels(parsed.data.data.b);
  const askChanges = parseLevels(parsed.data.data.a);

  if (parsed.data.type === 'snapshot') {
    return {
      bids: applyDelta([], bidChanges, true),
      asks: applyDelta([], askChanges, false),
    };
  }
  return {
    bids: applyDelta(book.bids, bidChanges, true),
    asks: applyDelta(book.asks, askChanges, false),
  };
}
