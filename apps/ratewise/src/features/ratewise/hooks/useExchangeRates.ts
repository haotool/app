import { useState, useEffect, useRef, useCallback } from 'react';
import { getBuildTimeExchangeRates, getExchangeRates } from '../../../services/exchangeRateService';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode } from '../types';
import { logger } from '../../../utils/logger';
import type { ExchangeRateData, RateDetails } from '../../../utils/offlineStorage';
export type { RateDetails } from '../../../utils/offlineStorage';

export interface ExchangeRatesState {
  rates: Record<CurrencyCode, number | null>;
  details: Record<string, RateDetails>;
  isLoading: boolean;
  error: Error | null;
  warning: Error | null;
  lastUpdate: string | null;
  lastFetchedAt: string | null;
  source: string | null;
  isRefreshing: boolean;
}

const createEmptyRates = (): Record<CurrencyCode, number | null> =>
  Object.fromEntries(Object.keys(CURRENCY_DEFINITIONS).map((code) => [code, null])) as Record<
    CurrencyCode,
    number | null
  >;

const buildStateFromData = (
  data: ExchangeRateData,
  options: { isLoading: boolean; lastFetchedAt: string | null },
): ExchangeRatesState => {
  const rates = createEmptyRates();
  rates.TWD = 1;

  Object.keys(data.rates).forEach((code) => {
    if (code in rates) {
      rates[code as CurrencyCode] = data.rates[code] ?? null;
    }
  });

  return {
    rates,
    details: data.details || {},
    isLoading: options.isLoading,
    error: null,
    warning: null,
    lastUpdate: data.updateTime?.trim() || null,
    lastFetchedAt: options.lastFetchedAt,
    source: data.source,
    isRefreshing: false,
  };
};

const createEmptyState = (): ExchangeRatesState => ({
  rates: createEmptyRates(),
  details: {},
  isLoading: true,
  error: null,
  warning: null,
  lastUpdate: null,
  lastFetchedAt: null,
  source: null,
  isRefreshing: false,
});

const createInitialState = (): ExchangeRatesState => {
  try {
    return buildStateFromData(getBuildTimeExchangeRates(), {
      isLoading: false,
      lastFetchedAt: null,
    });
  } catch (error) {
    logger.warn('Build-time exchange rates unavailable, falling back to runtime fetch', { error });
    return createEmptyState();
  }
};

export function useExchangeRates() {
  const [state, setState] = useState<ExchangeRatesState>(() => createInitialState());
  const loadRatesRef = useRef<((isAutoRefresh?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRates(isAutoRefresh = false) {
      // 不在背景刷新（Page Visibility API 優化）
      if (isAutoRefresh && document.hidden) {
        logger.debug('Skipping refresh: page is hidden');
        return;
      }

      // 如果是自動刷新，設定刷新狀態
      if (isAutoRefresh && isMounted) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      try {
        const data = await getExchangeRates();
        if (!isMounted) return;

        const fetchedAt = new Date().toISOString();

        setState(() => {
          const sourceUpdate = data.updateTime?.trim() ?? null;
          const nextState = buildStateFromData(
            { ...data, updateTime: sourceUpdate ?? fetchedAt },
            { isLoading: false, lastFetchedAt: fetchedAt },
          );

          return {
            ...nextState,
            source: data.source,
          };
        });

        logger.info(`Exchange rates ${isAutoRefresh ? 'refreshed' : 'loaded'}`, {
          currencies: Object.keys(data.rates).length + 1,
          source: data.source,
          updateTime: data.updateTime,
        });
      } catch (error) {
        if (!isMounted) return;
        logger.error('Failed to load exchange rates', error instanceof Error ? error : undefined);
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: prev.lastUpdate ? null : normalizedError,
          warning: prev.lastUpdate ? normalizedError : null,
          lastFetchedAt: new Date().toISOString(),
          isRefreshing: false,
        }));
      }
    }

    // Store loadRates in ref for manual refresh
    loadRatesRef.current = loadRates;

    // 初始載入
    void loadRates(false);

    // 設定 5 分鐘自動輪詢（與快取策略一致）
    const intervalId = setInterval(
      () => {
        void loadRates(true);
      },
      5 * 60 * 1000,
    );

    // Page Visibility API: 用戶返回時立即刷新
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        logger.debug('Page visible: refreshing rates');
        void loadRates(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理函數
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      logger.debug('Exchange rates polling cleaned up');
    };
  }, []);

  // Manual refresh function for pull-to-refresh
  const refresh = useCallback(async () => {
    if (loadRatesRef.current) {
      await loadRatesRef.current(true);
    }
  }, []);

  return { ...state, refresh };
}
