/**
 * 趨勢基準跟隨費率模式測試（#564/#618）：
 * spot 走即期賣出序列、缺基準日跳點不推估、即期序列不足誠實回落現金賣出。
 * 併發去重測試（#669）：雙 hook 同參數掛載時冷快取 aggregate 僅發一次請求。
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { mergeLatestTrendPoint, resolveTrendSeries, useConverterTrend } from '../useConverterTrend';
import { clearCache } from '../../../../../services/exchangeRateHistoryService';
import type {
  HistoricalRateData,
  RateSnapshot,
} from '../../../../../services/exchangeRateHistoryService';
import type { ExchangeShopRate } from '../../../../../services/moneyboxRateService';
import type { UseConverterTrendOptions } from '../useConverterTrend';

const toUrlString = (input: RequestInfo | URL): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

function buildDay(
  date: string,
  usd: { cashSell: number; spotSell: number | null },
): HistoricalRateData {
  return {
    date,
    data: {
      updateTime: `${date}T08:00:00+08:00`,
      source: 'Taiwan Bank (臺灣銀行牌告匯率)',
      rates: { TWD: 1, USD: usd.cashSell } as RateSnapshot['rates'],
      details: {
        TWD: { spot: { buy: 1, sell: 1 }, cash: { buy: 1, sell: 1 } },
        USD: {
          spot: { buy: null, sell: usd.spotSell },
          cash: { buy: null, sell: usd.cashSell },
        },
      },
    },
  };
}

const history: HistoricalRateData[] = [
  buildDay('2026-07-03', { cashSell: 32.19, spotSell: 32.0 }),
  buildDay('2026-07-04', { cashSell: 32.215, spotSell: 32.02 }),
  buildDay('2026-07-05', { cashSell: 32.2, spotSell: null }),
];

describe('resolveTrendSeries', () => {
  it('spot 模式使用即期賣出序列，缺即期報價的日期跳點', () => {
    const { points, trendRateType } = resolveTrendSeries(history, 'USD', 'TWD', 'spot');
    expect(trendRateType).toBe('spot');
    expect(points).toEqual([
      { date: '2026-07-03', rate: 32.0 },
      { date: '2026-07-04', rate: 32.02 },
    ]);
  });

  it('cash 模式維持現金賣出序列', () => {
    const { points, trendRateType } = resolveTrendSeries(history, 'USD', 'TWD', 'cash');
    expect(trendRateType).toBe('cash');
    expect(points.map((p) => p.rate)).toEqual([32.19, 32.215, 32.2]);
  });

  it('即期序列可繪點不足 2 時誠實回落現金賣出', () => {
    const spotless = history.map((item) =>
      buildDay(item.date, {
        cashSell: item.data.rates.USD!,
        spotSell: null,
      }),
    );
    const { points, trendRateType } = resolveTrendSeries(spotless, 'USD', 'TWD', 'spot');
    expect(trendRateType).toBe('cash');
    expect(points).toHaveLength(3);
  });
});

describe('useConverterTrend - 雙 hook 併發去重（#669）', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearCache(true);
  });

  it('卡片＋sheet 同參數同時掛載：冷快取下 aggregate 與 latest 各僅發一次', async () => {
    clearCache(true);

    const aggregate = {
      updateTime: '2026-07-08T08:00:00+08:00',
      dates: ['2026-07-07', '2026-07-06'],
      rates: { TWD: [1, 1], USD: [32.215, 32.2] },
    };
    const latest = {
      updateTime: '2026/07/08 10:00:00',
      source: 'Taiwan Bank (臺灣銀行牌告匯率)',
      rates: { TWD: 1, USD: 32.25 },
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const payload = toUrlString(input).includes('history-30d.json') ? aggregate : latest;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(payload),
      } as Response);
    });

    // 與 SingleConverterV2 相同：主卡片與 sheet 兩個 hook 於同一 commit 掛載、預設參數恆同。
    const options: UseConverterTrendOptions = {
      fromCurrency: 'USD',
      toCurrency: 'TWD',
      rateSource: 'bank',
      moneyBoxRate: null,
      exchangeShopCurrency: null,
      rateType: 'cash',
      maxDays: 90,
    };
    const { result } = renderHook(() => ({
      card: useConverterTrend(options),
      sheet: useConverterTrend(options),
    }));

    await waitFor(() => {
      expect(result.current.card.data.length).toBeGreaterThan(0);
      expect(result.current.sheet.data.length).toBeGreaterThan(0);
    });

    // 修正前 service 無 in-flight 去重，冷快取 aggregate 請求 ×2。
    const aggregateCalls = fetchSpy.mock.calls.filter(([input]) =>
      toUrlString(input).includes('history-30d.json'),
    );
    expect(aggregateCalls).toHaveLength(1);
    const latestCalls = fetchSpy.mock.calls.filter(([input]) =>
      toUrlString(input).includes('latest.json'),
    );
    expect(latestCalls).toHaveLength(1);
    expect(result.current.card.data).toEqual(result.current.sheet.data);
  });

  it('換錢所模式雙 hook 同參數掛載：冷快取下換錢所 aggregate 僅發一次（#669 補強）', async () => {
    const moneyboxAggregate = {
      providerId: 'moneybox',
      generatedAt: '2026-07-08T02:00:00Z',
      snapshots: [
        {
          date: '2026-07-08',
          raw: { updateTime: '2026/07/08 10:00:00', rates: { TWD: { sell: 44.85, buy: 45.1 } } },
        },
        {
          date: '2026-07-07',
          raw: { updateTime: '2026/07/07 10:00:00', rates: { TWD: { sell: 44.7, buy: 44.95 } } },
        },
      ],
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(moneyboxAggregate),
        headers: { get: () => null },
      } as unknown as Response),
    );

    const moneyBoxRate: ExchangeShopRate = {
      currency: 'KRW',
      sell: 44.85,
      buy: 45.1,
      updateTime: '2026/07/08 10:00:00',
      source: 'MoneyBox',
      sourceUrl: 'https://exchange-shop.example/exchange',
      providerName: '明洞換匯所',
      isFallback: false,
    };
    const options: UseConverterTrendOptions = {
      fromCurrency: 'TWD',
      toCurrency: 'KRW',
      rateSource: 'exchange-shop',
      moneyBoxRate,
      exchangeShopCurrency: 'KRW',
      rateType: 'cash',
      maxDays: 90,
    };
    const { result } = renderHook(() => ({
      card: useConverterTrend(options),
      sheet: useConverterTrend(options),
    }));

    await waitFor(() => {
      expect(result.current.card.data.length).toBeGreaterThan(0);
      expect(result.current.sheet.data.length).toBeGreaterThan(0);
    });

    // 修正前 moneyboxRateService 無 in-flight 去重，冷快取換錢所 aggregate 請求 ×2。
    const aggregateCalls = fetchSpy.mock.calls.filter(([input]) =>
      toUrlString(input).includes('providers/moneybox/history-30d.json'),
    );
    expect(aggregateCalls).toHaveLength(1);
    expect(result.current.card.data).toEqual(result.current.sheet.data);
  });
});

describe('mergeLatestTrendPoint', () => {
  const latest: RateSnapshot = {
    updateTime: '2026/07/06 10:00:00',
    source: 'Taiwan Bank (臺灣銀行牌告匯率)',
    rates: { TWD: 1, USD: 32.25 } as RateSnapshot['rates'],
    details: {
      USD: { spot: { buy: 31.9, sell: 32.05 }, cash: { buy: 31.55, sell: 32.25 } },
    },
  };

  it('以趨勢基準合併最新點位（spot 用即期賣出）', () => {
    const merged = mergeLatestTrendPoint(
      [{ date: '2026-07-05', rate: 32.0 }],
      latest,
      'USD',
      'TWD',
      'spot',
    );
    expect(merged).toContainEqual({ date: '2026-07-06', rate: 32.05 });
  });

  it('最新快照缺該基準報價時不合併', () => {
    const noSpot: RateSnapshot = {
      ...latest,
      details: { USD: { spot: { buy: null, sell: null }, cash: { buy: null, sell: 32.25 } } },
    };
    const points = [{ date: '2026-07-05', rate: 32.0 }];
    expect(mergeLatestTrendPoint(points, noSpot, 'USD', 'TWD', 'spot')).toEqual(points);
  });
});
