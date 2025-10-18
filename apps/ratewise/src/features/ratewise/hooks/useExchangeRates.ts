import { useState, useEffect } from 'react';
import { getExchangeRates } from '../../../services/exchangeRateService';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode } from '../types';

export interface ExchangeRatesState {
  rates: Record<CurrencyCode, number | null>;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: string | null;
  source: string | null;
  isRefreshing: boolean;
}

const INITIAL_STATE: ExchangeRatesState = {
  rates: Object.fromEntries(
    Object.keys(CURRENCY_DEFINITIONS).map((code) => [code, null]),
  ) as Record<CurrencyCode, number | null>,
  isLoading: true,
  error: null,
  lastUpdate: null,
  source: null,
  isRefreshing: false,
};

export function useExchangeRates() {
  const [state, setState] = useState<ExchangeRatesState>(INITIAL_STATE);

  useEffect(() => {
    let isMounted = true;

    async function loadRates(isAutoRefresh = false) {
      // 不在背景刷新（Page Visibility API 優化）
      if (isAutoRefresh && document.hidden) {
        console.log('⏸️ Skipping refresh: page is hidden');
        return;
      }

      // 如果是自動刷新，設定刷新狀態
      if (isAutoRefresh && isMounted) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      try {
        const data = await getExchangeRates();
        if (!isMounted) return;

        const newRates = { ...INITIAL_STATE.rates };

        newRates.TWD = 1;

        Object.keys(data.rates).forEach((code) => {
          if (code in newRates) {
            const rate = data.rates[code];
            newRates[code as CurrencyCode] = rate ?? null;
          }
        });

        setState({
          rates: newRates,
          isLoading: false,
          error: null,
          lastUpdate: data.updateTime,
          source: data.source,
          isRefreshing: false,
        });

        console.log(
          `${isAutoRefresh ? '🔄' : '✅'} Exchange rates ${isAutoRefresh ? 'refreshed' : 'loaded'}:`,
          {
            currencies: Object.values(newRates).filter((r) => r !== null).length,
            source: data.source,
            updateTime: data.updateTime,
          },
        );
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load exchange rates:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
          isRefreshing: false,
        }));
      }
    }

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
        console.log('👁️ Page visible: refreshing rates');
        void loadRates(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理函數
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('🧹 Exchange rates polling cleaned up');
    };
  }, []);

  return state;
}
