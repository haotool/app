/**
 * E3 v2 趨勢資料 hook：銀行牌告與換錢所兩路徑，回傳依日期排序的匯率點位。
 * 歷史資料來源上限由服務層決定（目前 30 天）；不足期間不推估，由 UI 誠實標註。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useEffect, useState } from 'react';
import type { MiniTrendDataPoint } from '../MiniTrendChart';
import type { CurrencyCode, RateSource } from '../../types';
import {
  fetchHistoricalRatesRange,
  fetchLatestRates,
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
  /** 期望天數；實際回傳以資料源可用範圍為準。 */
  maxDays: number;
}

export interface UseConverterTrendResult {
  data: MiniTrendDataPoint[];
  isLoading: boolean;
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
  maxDays,
}: UseConverterTrendOptions): UseConverterTrendResult {
  const [data, setData] = useState<MiniTrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
          return;
        }

        const [historicalData, latestRates] = await Promise.all([
          fetchHistoricalRatesRange(maxDays),
          fetchLatestRates().catch(() => null),
        ]);
        if (!isMounted) return;

        const historyPoints: MiniTrendDataPoint[] = historicalData.map((item) => {
          const fromRate = item.data.rates[fromCurrency] ?? 1;
          const toRate = item.data.rates[toCurrency] ?? 1;
          return { date: item.date, rate: fromRate / toRate };
        });

        let mergedPoints = historyPoints;
        if (latestRates) {
          const latestFromRate = latestRates.rates[fromCurrency] ?? 1;
          const latestToRate = latestRates.rates[toCurrency] ?? 1;
          const latestRate = latestFromRate / latestToRate;

          if (Number.isFinite(latestRate) && latestRate > 0) {
            const latestDate =
              latestRates.updateTime?.split(/\s+/)[0]?.replace(/\//g, '-') ??
              new Date().toISOString().slice(0, 10);
            mergedPoints = [
              ...historyPoints.filter((point) => point.date !== latestDate),
              { date: latestDate, rate: latestRate },
            ];
          }
        }

        setData(mergedPoints.sort((a, b) => a.date.localeCompare(b.date)).slice(-maxDays));
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
  }, [fromCurrency, toCurrency, rateSource, moneyBoxRate, exchangeShopCurrency, maxDays]);

  return { data, isLoading };
}
