// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchExchangeShopRate,
  fetchExchangeShopHistoricalRatesRange,
  computeConverterRate,
  getExchangeShopRateForPair,
  type ExchangeShopRate,
} from '../moneyboxRateService';
import { EXCHANGE_SHOP_PROVIDERS } from '../../config/exchangeShopProviders';
import type { CurrencyCode } from '../../features/ratewise/types';

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
    vi.useRealTimers();
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
    expect((result as ExchangeShopRate & { currency?: CurrencyCode })!.currency).toBe('KRW');
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

  it('migrates legacy cached data without currency so converter keeps using exchange-shop rates', async () => {
    localStorage.setItem(
      'exchangeShopRate_KRW',
      JSON.stringify({
        rate: {
          sell: 44.85,
          buy: 45.1,
          updateTime: '2026/05/07 16:33:55',
          source: 'MoneyBox',
          sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
          providerName: '明洞換匯所',
          isFallback: false,
        },
        timestamp: Date.now(),
      }),
    );

    const result = await fetchExchangeShopRate('KRW');

    expect(fetch).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result!.currency).toBe('KRW');
    expect(computeConverterRate(result!, 'TWD', 'KRW')).toBeCloseTo(44.85, 5);
  });

  it('ignores cached data when currency does not match the cache key', async () => {
    localStorage.setItem(
      'exchangeShopRate_KRW',
      JSON.stringify({
        rate: {
          currency: 'PHP',
          sell: 1.5,
          buy: 1.6,
          updateTime: '2026/05/07 16:33:55',
          source: 'MoneyBox',
          sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
          providerName: '錯誤換匯所',
          isFallback: false,
        },
        timestamp: Date.now(),
      }),
    );

    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Primary CDN down'))
      .mockRejectedValueOnce(new Error('Fallback CDN down'));

    const result = await fetchExchangeShopRate('KRW');

    expect(result).not.toBeNull();
    expect(result!.currency).toBe('KRW');
    expect(result!.isFallback).toBe(true);
    expect(result!.sell).toBe(46.0);
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

  it('returns cached rate when server responds with 304 Not Modified', async () => {
    // First call: warm the cache
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_MONEYBOX_JSON),
      headers: { get: (h: string) => (h === 'etag' ? '"etag-abc"' : null) },
    } as unknown as Response);
    await fetchExchangeShopRate('KRW');

    // Invalidate cache timestamp by writing stale entry directly
    const key = 'exchangeShopRate_KRW';
    const cached = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...cached, timestamp: 0 }));

    // Second call: CDN returns 304
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 304,
      json: () => Promise.resolve(null),
      headers: { get: () => null },
    } as unknown as Response);

    const result = await fetchExchangeShopRate('KRW');
    expect(result).not.toBeNull();
    expect(result!.sell).toBe(44.85);
    expect(result!.isFallback).toBe(false);
  });

  it('falls back to secondary CDN URL when primary fails', async () => {
    // Primary CDN fails
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Primary CDN down'))
      // Fallback CDN succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_MONEYBOX_JSON),
        headers: { get: () => null },
      } as unknown as Response);

    const result = await fetchExchangeShopRate('KRW');
    expect(result).not.toBeNull();
    expect(result!.sell).toBe(44.85);
    expect(result!.isFallback).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2); // primary + fallback
  });

  it('fetches MoneyBox history through provider metadata endpoints', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T12:00:00+08:00'));
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_MONEYBOX_JSON),
      headers: { get: () => null },
    } as unknown as Response);

    const result = await fetchExchangeShopHistoricalRatesRange('KRW', 1);

    expect(result).toEqual([
      expect.objectContaining({
        date: '2026-05-10',
        rate: expect.objectContaining({
          currency: 'KRW',
          sell: 44.85,
          buy: 45.1,
          source: 'MoneyBox',
        }),
      }),
    ]);
    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/moneybox-history/2026-05-10.json',
      expect.any(Object),
    );
  });
});

describe('computeConverterRate', () => {
  const rate = {
    currency: 'KRW' as CurrencyCode,
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

  it('does not apply a KRW provider rate to another supported exchange-shop currency', () => {
    (EXCHANGE_SHOP_PROVIDERS as Record<string, unknown>)['PHP'] = {
      ...EXCHANGE_SHOP_PROVIDERS.KRW!,
      providerName: 'PHP 測試換匯所',
      providerNameEn: 'PHP Test Exchange',
    };

    try {
      expect(computeConverterRate(rate, 'TWD', 'PHP')).toBeNull();
      expect(computeConverterRate(rate, 'PHP', 'TWD')).toBeNull();
    } finally {
      delete (EXCHANGE_SHOP_PROVIDERS as Record<string, unknown>)['PHP'];
    }
  });
});

describe('getExchangeShopRateForPair', () => {
  const krwRate: ExchangeShopRate = {
    currency: 'KRW',
    sell: 44.85,
    buy: 45.1,
    updateTime: '2026/05/07 16:33:55',
    source: 'MoneyBox',
    sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
    providerName: '明洞換匯所',
    isFallback: false,
  };

  it('TWD→provider 幣別時回傳目標幣的換錢所匯率', () => {
    expect(
      getExchangeShopRateForPair('TWD', 'KRW', {
        KRW: krwRate,
      }),
    ).toEqual(krwRate);
  });

  it('provider 幣別→TWD 時回傳來源幣的換錢所匯率', () => {
    expect(
      getExchangeShopRateForPair('KRW', 'TWD', {
        KRW: krwRate,
      }),
    ).toEqual(krwRate);
  });

  it('跨外幣配對不套用換錢所匯率，應回傳 null', () => {
    expect(
      getExchangeShopRateForPair('KRW', 'USD', {
        KRW: krwRate,
      }),
    ).toBeNull();
    expect(
      getExchangeShopRateForPair('USD', 'KRW', {
        KRW: krwRate,
      }),
    ).toBeNull();
  });
});
