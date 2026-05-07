import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchExchangeShopRate,
  computeConverterRate,
  type ExchangeShopRate,
} from '../moneyboxRateService';

const MOCK_MONEYBOX_JSON = {
  timestamp: '2026-05-07T07:33:55.932Z',
  updateTime: '2026/05/07 16:33:55',
  source: 'MoneyBox (明洞換匯所聯盟)',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  base: 'KRW',
  rates: {
    TWD: { currency: 'TWD', base: 44.9, buy: 45.1, sell: 44.85, spbuy: 45.5, spsell: 44.2 },
  },
};

describe('fetchExchangeShopRate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns structured ExchangeShopRate on successful fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_MONEYBOX_JSON),
      headers: { get: () => '"etag-abc"' },
    } as unknown as Response);

    const result = await fetchExchangeShopRate('KRW');
    expect(result).not.toBeNull();
    expect(result!.sell).toBe(44.85);
    expect(result!.buy).toBe(45.1);
    expect(result!.providerName).toBe('明洞換匯所');
    expect(result!.source).toBe('MoneyBox');
  });

  it('returns cached data within 5 minutes without re-fetching', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_MONEYBOX_JSON),
      headers: { get: () => null },
    } as unknown as Response);

    await fetchExchangeShopRate('KRW');
    await fetchExchangeShopRate('KRW');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback values when fetch fails and no cache', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchExchangeShopRate('KRW');
    expect(result).not.toBeNull();
    expect(result!.sell).toBe(46.0);
    expect(result!.buy).toBe(46.7);
    expect(result!.isFallback).toBe(true);
  });

  it('returns null for unsupported currency', async () => {
    const result = await fetchExchangeShopRate('USD');
    expect(result).toBeNull();
  });
});

describe('computeConverterRate', () => {
  const rate: ExchangeShopRate = {
    sell: 44.85,
    buy: 45.1,
    updateTime: '2026/05/07 16:33:55',
    source: 'MoneyBox',
    sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
    providerName: '明洞換匯所',
    isFallback: false,
  };

  it('TWD→KRW returns sell rate (1 TWD = sell KRW)', () => {
    const r = computeConverterRate(rate, 'TWD', 'KRW');
    expect(r).toBeCloseTo(44.85, 5);
  });

  it('KRW→TWD returns 1/buy rate (1 KRW = 1/buy TWD)', () => {
    const r = computeConverterRate(rate, 'KRW', 'TWD');
    expect(r).toBeCloseTo(1 / 45.1, 5);
  });

  it('returns null for non-KRW pairs', () => {
    expect(computeConverterRate(rate, 'USD', 'KRW')).toBeNull();
    expect(computeConverterRate(rate, 'KRW', 'JPY')).toBeNull();
    expect(computeConverterRate(rate, 'USD', 'EUR')).toBeNull();
  });
});
