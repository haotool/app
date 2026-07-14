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
  },
};

describe('applyOrderbookMessage', () => {
  it('builds a sorted book from a snapshot', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    expect(book.bids).toEqual([
      [64486, 10.615],
      [64485.9, 0.001],
    ]);
    expect(book.asks).toEqual([
      [64486.1, 5.112],
      [64486.2, 0.002],
    ]);
  });

  it('updates existing levels on delta', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    const next = applyOrderbookMessage(book, {
      type: 'delta',
      data: { s: 'BTCUSDT', b: [['64486.00', '11.000']], a: [] },
    });
    expect(next.bids[0]).toEqual([64486, 11]);
    expect(next.asks).toEqual(book.asks);
  });

  it('inserts new levels keeping sort order', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    const next = applyOrderbookMessage(book, {
      type: 'delta',
      data: { s: 'BTCUSDT', b: [['64485.95', '2.5']], a: [['64486.15', '1.5']] },
    });
    expect(next.bids.map(([price]) => price)).toEqual([64486, 64485.95, 64485.9]);
    expect(next.asks.map(([price]) => price)).toEqual([64486.1, 64486.15, 64486.2]);
  });

  it('removes levels with zero size', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    const next = applyOrderbookMessage(book, {
      type: 'delta',
      data: { s: 'BTCUSDT', b: [['64485.90', '0']], a: [['64486.10', '0']] },
    });
    expect(next.bids).toEqual([[64486, 10.615]]);
    expect(next.asks).toEqual([[64486.2, 0.002]]);
  });

  it('rebuilds from a later snapshot', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    const next = applyOrderbookMessage(book, {
      type: 'snapshot',
      data: { s: 'BTCUSDT', b: [['64000.00', '1']], a: [['64001.00', '2']] },
    });
    expect(next).toEqual<OrderBook>({
      bids: [[64000, 1]],
      asks: [[64001, 2]],
    });
  });

  it('ignores malformed messages and keeps current book', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, snapshot);
    expect(applyOrderbookMessage(book, null)).toBe(book);
    expect(applyOrderbookMessage(book, { type: 'delta', data: { b: 'oops', a: [] } })).toBe(book);
  });

  it('drops non-numeric levels', () => {
    const book = applyOrderbookMessage(EMPTY_ORDER_BOOK, {
      type: 'snapshot',
      data: {
        s: 'BTCUSDT',
        b: [
          ['abc', '1'],
          ['64486.00', '10'],
        ],
        a: [],
      },
    });
    expect(book.bids).toEqual([[64486, 10]]);
  });
});
