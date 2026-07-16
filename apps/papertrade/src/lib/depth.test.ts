import { describe, expect, it } from 'vitest';
import { computeDepthProfile, depthAtPrice, type DepthProfile } from './depth';
import { EMPTY_ORDER_BOOK, type OrderBook } from '../services/orderbook';

const book: OrderBook = {
  bids: [
    [100, 1],
    [99, 2],
    [98, 3],
  ],
  asks: [
    [101, 2],
    [102, 4],
  ],
  updateId: 10,
};

describe('computeDepthProfile', () => {
  it('accumulates bids from best downward and asks from best upward', () => {
    const profile = computeDepthProfile(book);
    expect(profile.bids).toEqual([
      { price: 100, cumulative: 1 },
      { price: 99, cumulative: 3 },
      { price: 98, cumulative: 6 },
    ]);
    expect(profile.asks).toEqual([
      { price: 101, cumulative: 2 },
      { price: 102, cumulative: 6 },
    ]);
    expect(profile.maxCumulative).toBe(6);
  });

  it('centers the domain on the mid price symmetrically', () => {
    const profile = computeDepthProfile(book);
    expect(profile.midPrice).toBe(100.5);
    expect(profile.domainMin).toBe(98);
    expect(profile.domainMax).toBe(103);
  });

  it('returns an empty profile for an empty book', () => {
    const profile = computeDepthProfile(EMPTY_ORDER_BOOK);
    expect(profile.bids).toEqual([]);
    expect(profile.asks).toEqual([]);
    expect(profile.midPrice).toBeNull();
    expect(profile.maxCumulative).toBe(0);
  });

  it('keeps mid price null when one side is missing', () => {
    const oneSided = computeDepthProfile({ bids: book.bids, asks: [], updateId: 1 });
    expect(oneSided.midPrice).toBeNull();
    expect(oneSided.bids).toHaveLength(3);
    expect(oneSided.asks).toEqual([]);
  });

  it('handles the resync cleared book like an empty book', () => {
    const cleared = computeDepthProfile({ bids: [], asks: [], updateId: 0 });
    expect(cleared.midPrice).toBeNull();
    expect(cleared.maxCumulative).toBe(0);
  });
});

describe('depthAtPrice', () => {
  const profile: DepthProfile = computeDepthProfile(book);

  it('returns the covering bid level for a price between bid steps', () => {
    expect(depthAtPrice(profile, 99.5)).toEqual({ side: 'bid', price: 100, cumulative: 1 });
    expect(depthAtPrice(profile, 99)).toEqual({ side: 'bid', price: 99, cumulative: 3 });
    expect(depthAtPrice(profile, 98.5)).toEqual({ side: 'bid', price: 99, cumulative: 3 });
  });

  it('returns the covering ask level for a price between ask steps', () => {
    expect(depthAtPrice(profile, 101.5)).toEqual({ side: 'ask', price: 101, cumulative: 2 });
    expect(depthAtPrice(profile, 102)).toEqual({ side: 'ask', price: 102, cumulative: 6 });
  });

  it('returns null inside the spread', () => {
    expect(depthAtPrice(profile, 100.2)).toBeNull();
    expect(depthAtPrice(profile, 100.8)).toBeNull();
  });

  it('returns the total cumulative beyond the worst level', () => {
    expect(depthAtPrice(profile, 97.5)).toEqual({ side: 'bid', price: 98, cumulative: 6 });
    expect(depthAtPrice(profile, 102.9)).toEqual({ side: 'ask', price: 102, cumulative: 6 });
  });

  it('returns null when the profile has no mid price', () => {
    expect(depthAtPrice(computeDepthProfile(EMPTY_ORDER_BOOK), 100)).toBeNull();
  });
});
