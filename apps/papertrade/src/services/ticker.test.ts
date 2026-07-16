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
  it('parses a full snapshot into a ticker with markPrice fallback to lastPrice', () => {
    const update = parseTickerMessage(snapshotMessage);
    expect(update).toEqual({
      kind: 'snapshot',
      ticker: {
        symbol: 'BTCUSDT',
        lastPrice: 64486.1,
        markPrice: 64486.1,
        price24hPcnt: 0.038264,
        highPrice24h: 65000,
        lowPrice24h: 61848,
        turnover24h: 5122660654.3565,
        volume24h: 80648.719,
        fundingRate: 0.0001,
      },
    });
  });

  it('prefers explicit markPrice over lastPrice in snapshots', () => {
    const update = parseTickerMessage({
      ...snapshotMessage,
      data: { ...snapshotMessage.data, markPrice: '64490.55' },
    });
    expect(update?.kind).toBe('snapshot');
    if (update?.kind === 'snapshot') {
      expect(update.ticker.markPrice).toBe(64490.55);
    }
  });

  it('includes markPrice in delta patches', () => {
    const update = parseTickerMessage({
      topic: 'tickers.BTCUSDT',
      type: 'delta',
      data: { symbol: 'BTCUSDT', markPrice: '64490.55' },
    });
    expect(update).toEqual({
      kind: 'delta',
      symbol: 'BTCUSDT',
      patch: { markPrice: 64490.55 },
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

  it('parses funding and open interest fields from snapshots', () => {
    const update = parseTickerMessage({
      ...snapshotMessage,
      data: {
        ...snapshotMessage.data,
        fundingRate: '-0.005',
        nextFundingTime: '1760342400000',
        openInterestValue: '32824881841.75',
      },
    });
    expect(update?.kind).toBe('snapshot');
    if (update?.kind === 'snapshot') {
      expect(update.ticker.fundingRate).toBe(-0.005);
      expect(update.ticker.nextFundingTime).toBe(1760342400000);
      expect(update.ticker.openInterestValue).toBe(32824881841.75);
    }
  });

  it('accepts snapshots without funding fields (lenient schema)', () => {
    const update = parseTickerMessage({
      ...snapshotMessage,
      data: { ...snapshotMessage.data, fundingRate: undefined },
    });
    expect(update?.kind).toBe('snapshot');
    if (update?.kind === 'snapshot') {
      expect(update.ticker.fundingRate).toBeUndefined();
      expect(update.ticker.nextFundingTime).toBeUndefined();
      expect(update.ticker.openInterestValue).toBeUndefined();
    }
  });

  it('treats empty-string funding fields as missing instead of zero', () => {
    const update = parseTickerMessage({
      ...snapshotMessage,
      data: { ...snapshotMessage.data, fundingRate: '', nextFundingTime: '' },
    });
    expect(update?.kind).toBe('snapshot');
    if (update?.kind === 'snapshot') {
      expect(update.ticker.fundingRate).toBeUndefined();
      expect(update.ticker.nextFundingTime).toBeUndefined();
    }
  });

  it('includes funding and open interest fields in delta patches', () => {
    const update = parseTickerMessage({
      topic: 'tickers.BTCUSDT',
      type: 'delta',
      data: {
        symbol: 'BTCUSDT',
        fundingRate: '0.0001',
        nextFundingTime: '1760342400000',
        openInterestValue: '1234567.89',
      },
    });
    expect(update).toEqual({
      kind: 'delta',
      symbol: 'BTCUSDT',
      patch: {
        fundingRate: 0.0001,
        nextFundingTime: 1760342400000,
        openInterestValue: 1234567.89,
      },
    });
  });
});
