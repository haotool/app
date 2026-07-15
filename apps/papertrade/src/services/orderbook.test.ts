import { describe, expect, it } from 'vitest';
import { applyOrderbookMessage, EMPTY_ORDER_BOOK, type OrderBook } from './orderbook';

const snapshot = {
  topic: 'orderbook.50.BTCUSDT',
  type: 'snapshot',
  data: {
    s: 'BTCUSDT',
    b: [
      ['64486.00', '10.615'],
      ['64485.90', '0.001'],
    ],
    a: [
      ['64486.10', '5.112'],
      ['64486.20', '0.002'],
    ],
    u: 100,
  },
};

function delta(u: number, b: string[][] = [], a: string[][] = []) {
  return { type: 'delta', data: { s: 'BTCUSDT', b, a, u } };
}

function bookFromSnapshot(): OrderBook {
  return applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot).book;
}

describe('applyOrderbookMessage', () => {
  it('builds a sorted book from a snapshot', () => {
    const { book, resync } = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    expect(resync).toBe(false);
    expect(book.updateId).toBe(100);
    expect(book.bids).toEqual([
      [64486, 10.615],
      [64485.9, 0.001],
    ]);
    expect(book.asks).toEqual([
      [64486.1, 5.112],
      [64486.2, 0.002],
    ]);
  });

  it('updates existing levels on a consecutive delta', () => {
    const book = bookFromSnapshot();
    const { book: next, resync } = applyOrderbookMessage(
      book,
      delta(101, [['64486.00', '11.000']]),
    );
    expect(resync).toBe(false);
    expect(next.updateId).toBe(101);
    expect(next.bids[0]).toEqual([64486, 11]);
    expect(next.asks).toEqual(book.asks);
  });

  it('inserts new levels keeping sort order', () => {
    const book = bookFromSnapshot();
    const { book: next } = applyOrderbookMessage(
      book,
      delta(101, [['64485.95', '2.5']], [['64486.15', '1.5']]),
    );
    expect(next.bids.map(([price]) => price)).toEqual([64486, 64485.95, 64485.9]);
    expect(next.asks.map(([price]) => price)).toEqual([64486.1, 64486.15, 64486.2]);
  });

  it('removes levels with zero size', () => {
    const book = bookFromSnapshot();
    const { book: next } = applyOrderbookMessage(
      book,
      delta(101, [['64485.90', '0']], [['64486.10', '0']]),
    );
    expect(next.bids).toEqual([[64486, 10.615]]);
    expect(next.asks).toEqual([[64486.2, 0.002]]);
  });

  it('rebuilds from a later snapshot', () => {
    const book = bookFromSnapshot();
    const { book: next } = applyOrderbookMessage(book, {
      type: 'snapshot',
      data: { s: 'BTCUSDT', b: [['64000.00', '1']], a: [['64001.00', '2']], u: 200 },
    });
    expect(next).toEqual<OrderBook>({
      bids: [[64000, 1]],
      asks: [[64001, 2]],
      updateId: 200,
    });
  });

  it('treats a delta with u=1 as a service-restart snapshot', () => {
    const book = bookFromSnapshot();
    const { book: next, resync } = applyOrderbookMessage(book, delta(1, [['64000.00', '3']]));
    expect(resync).toBe(false);
    expect(next).toEqual<OrderBook>({ bids: [[64000, 3]], asks: [], updateId: 1 });
  });

  it('drops deltas arriving before any snapshot', () => {
    const { book, resync } = applyOrderbookMessage(
      EMPTY_ORDER_BOOK,
      delta(50, [['64486.00', '1']]),
    );
    expect(resync).toBe(false);
    expect(book).toBe(EMPTY_ORDER_BOOK);
  });

  it('drops stale deltas with u lower than or equal to the local book', () => {
    const book = bookFromSnapshot();
    expect(applyOrderbookMessage(book, delta(100, [['64486.00', '99']])).book).toBe(book);
    expect(applyOrderbookMessage(book, delta(90, [['64486.00', '99']])).book).toBe(book);
  });

  it('clears the book and requests a resync on a sequence gap', () => {
    const book = bookFromSnapshot();
    const { book: next, resync } = applyOrderbookMessage(book, delta(103, [['64486.00', '99']]));
    expect(resync).toBe(true);
    expect(next).toBe(EMPTY_ORDER_BOOK);
  });

  it('ignores malformed messages and keeps current book', () => {
    const book = bookFromSnapshot();
    expect(applyOrderbookMessage(book, null).book).toBe(book);
    expect(applyOrderbookMessage(book, { type: 'delta', data: { b: 'oops', a: [] } }).book).toBe(
      book,
    );
  });

  it('drops non-numeric levels', () => {
    const { book } = applyOrderbookMessage(EMPTY_ORDER_BOOK, {
      type: 'snapshot',
      data: {
        s: 'BTCUSDT',
        b: [
          ['abc', '1'],
          ['64486.00', '10'],
        ],
        a: [],
        u: 5,
      },
    });
    expect(book.bids).toEqual([[64486, 10]]);
  });
});
