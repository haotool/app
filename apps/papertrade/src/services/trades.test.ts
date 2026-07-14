import { describe, expect, it } from 'vitest';
import { mergeTrades, parseTradeMessage, type PublicTrade } from './trades';

const message = {
  topic: 'publicTrade.BTCUSDT',
  type: 'snapshot',
  data: [
    { i: 'a1', T: 1700000000000, S: 'Buy', p: '64486.10', v: '0.005', s: 'BTCUSDT' },
    { i: 'a2', T: 1700000000100, S: 'Sell', p: '64486.00', v: '0.120', s: 'BTCUSDT' },
  ],
};

describe('parseTradeMessage', () => {
  it('parses buy and sell trades', () => {
    const trades = parseTradeMessage(message);
    expect(trades).toEqual<PublicTrade[]>([
      { id: 'a1', time: 1700000000000, side: 'buy', price: 64486.1, size: 0.005 },
      { id: 'a2', time: 1700000000100, side: 'sell', price: 64486, size: 0.12 },
    ]);
  });

  it('returns empty array for malformed payloads', () => {
    expect(parseTradeMessage(null)).toEqual([]);
    expect(parseTradeMessage({ data: [{ i: 'x' }] })).toEqual([]);
  });

  it('drops rows with non-numeric price or size', () => {
    const trades = parseTradeMessage({
      data: [
        { i: 'ok', T: 1, S: 'Buy', p: '100', v: '1' },
        { i: 'bad', T: 2, S: 'Sell', p: 'oops', v: '1' },
      ],
    });
    expect(trades).toHaveLength(1);
    expect(trades[0]?.id).toBe('ok');
  });
});

describe('mergeTrades', () => {
  const existing: PublicTrade[] = [{ id: 'old', time: 1, side: 'buy', price: 100, size: 1 }];

  it('prepends incoming trades newest first', () => {
    const incoming = parseTradeMessage(message);
    const merged = mergeTrades(existing, incoming, 10);
    expect(merged.map((trade) => trade.id)).toEqual(['a2', 'a1', 'old']);
  });

  it('caps the list at the limit', () => {
    const incoming = parseTradeMessage(message);
    const merged = mergeTrades(existing, incoming, 2);
    expect(merged).toHaveLength(2);
    expect(merged.map((trade) => trade.id)).toEqual(['a2', 'a1']);
  });

  it('returns the same reference when nothing arrives', () => {
    expect(mergeTrades(existing, [], 10)).toBe(existing);
  });
});
