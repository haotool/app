import { describe, expect, it } from 'vitest';
import { parseTickerMessage } from './ticker';

const snapshotMessage = {
  topic: 'tickers.BTCUSDT',
  type: 'snapshot',
  data: {
    symbol: 'BTCUSDT',
    lastPrice: '64486.10',
    price24hPcnt: '0.038264',
    highPrice24h: '65000.00',
    lowPrice24h: '61848.00',
    turnover24h: '5122660654.3565',
    volume24h: '80648.7190',
    fundingRate: '0.0001',
  },
};

describe('parseTickerMessage', () => {
  it('parses a full snapshot into a ticker', () => {
    const update = parseTickerMessage(snapshotMessage);
    expect(update).toEqual({
      kind: 'snapshot',
      ticker: {
        symbol: 'BTCUSDT',
        lastPrice: 64486.1,
        price24hPcnt: 0.038264,
        highPrice24h: 65000,
        lowPrice24h: 61848,
        turnover24h: 5122660654.3565,
        volume24h: 80648.719,
      },
    });
  });

  it('parses a delta with only changed fields', () => {
    const update = parseTickerMessage({
      topic: 'tickers.BTCUSDT',
      type: 'delta',
      data: {
        symbol: 'BTCUSDT',
        lastPrice: '64486.00',
        ask1Price: '64486.10',
      },
    });
    expect(update).toEqual({
      kind: 'delta',
      symbol: 'BTCUSDT',
      patch: { lastPrice: 64486 },
    });
  });

  it('rejects snapshots missing required fields', () => {
    const update = parseTickerMessage({
      type: 'snapshot',
      data: { symbol: 'BTCUSDT', lastPrice: '64486.10' },
    });
    expect(update).toBeNull();
  });

  it('rejects unknown symbols', () => {
    const update = parseTickerMessage({
      type: 'snapshot',
      data: { ...snapshotMessage.data, symbol: 'SHIBUSDT' },
    });
    expect(update).toBeNull();
  });

  it('rejects deltas without any numeric field', () => {
    const update = parseTickerMessage({
      type: 'delta',
      data: { symbol: 'BTCUSDT', lastPrice: 'not-a-number' },
    });
    expect(update).toBeNull();
  });

  it('rejects malformed messages without crashing', () => {
    expect(parseTickerMessage(null)).toBeNull();
    expect(parseTickerMessage({ type: 'snapshot' })).toBeNull();
    expect(parseTickerMessage(42)).toBeNull();
  });
});
