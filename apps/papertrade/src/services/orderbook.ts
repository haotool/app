import { z } from 'zod';

export type OrderBookLevel = readonly [price: number, size: number];

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  updateId: number;
}

export interface OrderBookUpdate {
  book: OrderBook;
  resync: boolean;
}

export const EMPTY_ORDER_BOOK: OrderBook = { bids: [], asks: [], updateId: 0 };

// Bybit 契約：delta 的 u 必須恰為前一則 u+1；u=1 為服務重啟 snapshot，必須整簿覆寫。
const SERVICE_RESTART_UPDATE_ID = 1;

const wsOrderbookSchema = z.object({
  type: z.string(),
  data: z.object({
    b: z.array(z.tuple([z.string(), z.string()])),
    a: z.array(z.tuple([z.string(), z.string()])),
    u: z.number(),
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

export function applyOrderbookMessage(book: OrderBook, message: unknown): OrderBookUpdate {
  const parsed = wsOrderbookSchema.safeParse(message);
  if (!parsed.success) return { book, resync: false };
  const { type, data } = parsed.data;
  const bidChanges = parseLevels(data.b);
  const askChanges = parseLevels(data.a);

  if (type === 'snapshot' || data.u === SERVICE_RESTART_UPDATE_ID) {
    return {
      book: {
        bids: applyDelta([], bidChanges, true),
        asks: applyDelta([], askChanges, false),
        updateId: data.u,
      },
      resync: false,
    };
  }

  if (book.updateId === 0 || data.u <= book.updateId) {
    return { book, resync: false };
  }

  if (data.u > book.updateId + 1) {
    return { book: EMPTY_ORDER_BOOK, resync: true };
  }

  return {
    book: {
      bids: applyDelta(book.bids, bidChanges, true),
      asks: applyDelta(book.asks, askChanges, false),
      updateId: data.u,
    },
    resync: false,
  };
}
