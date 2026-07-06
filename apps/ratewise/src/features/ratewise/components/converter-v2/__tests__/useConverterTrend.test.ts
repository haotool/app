/**
 * 趨勢基準跟隨費率模式測試（#564/#618）：
 * spot 走即期賣出序列、缺基準日跳點不推估、即期序列不足誠實回落現金賣出。
 */

import { describe, expect, it } from 'vitest';
import { mergeLatestTrendPoint, resolveTrendSeries } from '../useConverterTrend';
import type {
  HistoricalRateData,
  RateSnapshot,
} from '../../../../../services/exchangeRateHistoryService';

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
