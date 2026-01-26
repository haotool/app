/**
 * Multi-Currency Converter Page - ParkKeeper 風格
 *
 * @description 多幣別轉換器頁面，採用 ParkKeeper 設計風格
 *              SSOT: 設計來自 Settings.tsx 風格參考
 *              標題區塊已移除，由底部導航 Tab 識別頁面
 * @version 2.1.0
 * @updated 2026-01-24 - 移除標題區塊，優化垂直空間
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { MultiConverter as MultiConverterComponent } from '../features/ratewise/components/MultiConverter';
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { useCurrencyConverter } from '../features/ratewise/hooks/useCurrencyConverter';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { formatDisplayTime } from '../utils/timeFormatter';
import type { RateType, CurrencyCode } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

export default function MultiConverter() {
  const { t } = useTranslation();
  const isTestEnv = import.meta.env.MODE === 'test';
  const [isHydrated, setIsHydrated] = useState(isTestEnv);
  const [rateType, setRateType] = useState<RateType>('spot');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration marker
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_TYPE);
    if (stored === 'cash') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage restore
      setRateType('cash');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATE_TYPE, rateType);
  }, [rateType]);

  const {
    rates: exchangeRates,
    details,
    isLoading: ratesLoading,
    error: ratesError,
    lastUpdate,
    lastFetchedAt,
  } = useExchangeRates();

  const {
    multiAmounts,
    sortedCurrencies,
    handleMultiAmountChange,
    quickAmount,
    setBaseCurrency,
    setMode,
    baseCurrency,
    favorites,
    toggleFavorite,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  // Set mode to 'multi' on mount
  useEffect(() => {
    setMode('multi');
  }, [setMode]);

  const handleQuickAmount = useCallback(
    (amount: number) => {
      quickAmount(amount);
    },
    [quickAmount],
  );

  const handleBaseCurrencyChange = useCallback(
    (code: CurrencyCode) => {
      setBaseCurrency(code);
    },
    [setBaseCurrency],
  );

  if (!isHydrated) {
    return <SkeletonLoader />;
  }

  if (ratesLoading && !isTestEnv) {
    return <SkeletonLoader />;
  }

  if (ratesError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertCircle className="text-destructive mx-auto" size={48} />
          <h1 className="text-2xl font-bold text-text mt-4">{t('errors.rateLoadFailed')}</h1>
          <p className="text-text-muted mt-2 mb-6">{t('errors.networkCheckRetry')}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw size={18} />
            {t('errors.reload')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* 多幣別換算區塊 - 簡約風格（標題已移除，由底部導航識別） */}
        <section className="mb-6">
          <div className="card p-4">
            <MultiConverterComponent
              sortedCurrencies={sortedCurrencies}
              multiAmounts={multiAmounts}
              baseCurrency={baseCurrency}
              rateType={rateType}
              details={details}
              favorites={favorites}
              onAmountChange={handleMultiAmountChange}
              onQuickAmount={handleQuickAmount}
              onRateTypeChange={setRateType}
              onBaseCurrencyChange={handleBaseCurrencyChange}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </section>

        {/* 更新時間區塊 */}
        {!ratesLoading && lastUpdate && (
          <section>
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <Clock className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                {t('footer.dataSource')}
              </h3>
            </div>
            <div className="card p-4">
              <p className="text-[10px] text-center opacity-60 font-medium">
                {formatDisplayTime(lastUpdate, lastFetchedAt)}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
