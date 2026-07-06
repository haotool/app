/**
 * E3 v2 趨勢資料 hook：銀行牌告與換錢所兩路徑，回傳依日期排序的匯率點位。
 * 歷史資料來源上限由服務層決定（目前 30 天）；不足期間不推估，由 UI 誠實標註。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useEffect, useState } from 'react';
import type { MiniTrendDataPoint } from '../MiniTrendChart';
import type { CurrencyCode, RateSource, RateType } from '../../types';
import {
  fetchHistoricalRatesRange,
  fetchLatestRates,
  getTrendRate,
  type HistoricalRateData,
  type RateSnapshot,
} from '../../../../services/exchangeRateHistoryService';
import {
  computeConverterRate,
  fetchExchangeShopHistoricalRatesRange,
  type ExchangeShopRate,
} from '../../../../services/moneyboxRateService';

export interface UseConverterTrendOptions {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rateSource: RateSource;
  moneyBoxRate: ExchangeShopRate | null;
  exchangeShopCurrency: CurrencyCode | null;
  /** 卡片當前費率模式（現金/即期）；趨勢基準跟隨此值（#564）。 */
  rateType: RateType;
  /** 期望天數；實際回傳以資料源可用範圍為準。 */
  maxDays: number;
}

export interface UseConverterTrendResult {
  data: MiniTrendDataPoint[];
  isLoading: boolean;
  /** 實際使用的趨勢基準；即期序列不足時誠實回落現金賣出，標註須跟隨此值。 */
  trendRateType: RateType;
}

/** 以指定基準組出歷史點位；任一端缺該基準報價即跳過該日（不推估）。 */
export function buildTrendHistoryPoints(
  historicalData: HistoricalRateData[],
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rateType: RateType,
): MiniTrendDataPoint[] {
  return historicalData.flatMap((item) => {
    const fromRate = getTrendRate(item.data, fromCurrency, rateType);
    const toRate = getTrendRate(item.data, toCurrency, rateType);
    if (fromRate === null || toRate === null) return [];
    return [{ date: item.date, rate: fromRate / toRate }];
  });
}

/** 即期序列可繪點不足 2 時回落現金賣出（老 aggregate 無 basisRates 的過渡相容）。 */
export function resolveTrendSeries(
  historicalData: HistoricalRateData[],
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rateType: RateType,
): { points: MiniTrendDataPoint[]; trendRateType: RateType } {
  const points = buildTrendHistoryPoints(historicalData, fromCurrency, toCurrency, rateType);
  if (rateType === 'spot' && points.length < 2) {
    return {
      points: buildTrendHistoryPoints(historicalData, fromCurrency, toCurrency, 'cash'),
      trendRateType: 'cash',
    };
  }
  return { points, trendRateType: rateType };
}

/** 以趨勢基準合併最新即時點位；最新快照缺該基準報價時不合併。 */
export function mergeLatestTrendPoint(
  historyPoints: MiniTrendDataPoint[],
  latestRates: RateSnapshot | null,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rateType: RateType,
): MiniTrendDataPoint[] {
  if (!latestRates) return historyPoints;

  const latestFromRate = getTrendRate(latestRates, fromCurrency, rateType);
  const latestToRate = getTrendRate(latestRates, toCurrency, rateType);
  if (latestFromRate === null || latestToRate === null) return historyPoints;

  const latestRate = latestFromRate / latestToRate;
  if (!Number.isFinite(latestRate) || latestRate <= 0) return historyPoints;

  const latestDate =
    latestRates.updateTime?.split(/\s+/)[0]?.replace(/\//g, '-') ??
    new Date().toISOString().slice(0, 10);
  return [
    ...historyPoints.filter((point) => point.date !== latestDate),
    { date: latestDate, rate: latestRate },
  ];
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useConverterTrend({
  fromCurrency,
  toCurrency,
  rateSource,
  moneyBoxRate,
  exchangeShopCurrency,
  rateType,
  maxDays,
}: UseConverterTrendOptions): UseConverterTrendResult {
  const [data, setData] = useState<MiniTrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendRateType, setTrendRateType] = useState<RateType>(rateType);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const exchangeShopLatestRate = moneyBoxRate
          ? computeConverterRate(moneyBoxRate, fromCurrency, toCurrency)
          : null;
        const shouldUseExchangeShopTrend =
          rateSource === 'exchange-shop' &&
          moneyBoxRate !== null &&
          !!exchangeShopCurrency &&
          exchangeShopLatestRate !== null;

        if (shouldUseExchangeShopTrend) {
          const historicalRates = await fetchExchangeShopHistoricalRatesRange(
            exchangeShopCurrency,
            maxDays,
          );
          if (!isMounted) return;

          const historyPoints = historicalRates
            .map(({ date, rate }) => {
              const converterRate = computeConverterRate(rate, fromCurrency, toCurrency);
              return converterRate && Number.isFinite(converterRate) && converterRate > 0
                ? { date, rate: converterRate }
                : null;
            })
            .filter((item): item is MiniTrendDataPoint => item !== null);

          const latestDate =
            /\d{4}\/\d{2}\/\d{2}/.exec(moneyBoxRate.updateTime)?.[0]?.replace(/\//g, '-') ??
            getLocalDateKey();
          const mergedPoints =
            Number.isFinite(exchangeShopLatestRate) && exchangeShopLatestRate > 0
              ? [
                  ...historyPoints.filter((point) => point.date !== latestDate),
                  { date: latestDate, rate: exchangeShopLatestRate },
                ]
              : historyPoints;

          setData(mergedPoints.sort((a, b) => a.date.localeCompare(b.date)).slice(-maxDays));
          setTrendRateType(rateType);
          return;
        }

        const [historicalData, latestRates] = await Promise.all([
          fetchHistoricalRatesRange(maxDays),
          fetchLatestRates().catch(() => null),
        ]);
        if (!isMounted) return;

        // 基準跟隨卡片費率模式（#564）；即期序列不足時誠實回落現金賣出。
        const { points: historyPoints, trendRateType: effectiveRateType } = resolveTrendSeries(
          historicalData,
          fromCurrency,
          toCurrency,
          rateType,
        );
        const mergedPoints = mergeLatestTrendPoint(
          historyPoints,
          latestRates,
          fromCurrency,
          toCurrency,
          effectiveRateType,
        );

        setData(mergedPoints.sort((a, b) => a.date.localeCompare(b.date)).slice(-maxDays));
        setTrendRateType(effectiveRateType);
      } catch {
        if (isMounted) setData([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [fromCurrency, toCurrency, rateSource, moneyBoxRate, exchangeShopCurrency, rateType, maxDays]);

  return { data, isLoading, trendRateType };
}
