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
import { multiConverterLayoutTokens } from '../config/design-tokens';

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
      <div className="flex-1 flex items-center justify-center p-4">
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
    <div className={multiConverterLayoutTokens.container}>
      <div className={multiConverterLayoutTokens.content.className}>
        {/* 多幣別換算區塊 - 簡約風格（標題已移除，由底部導航識別）
         *
         * RWD 全頁面佈局：
         * - flex-1：填滿可用垂直空間
         * - flex flex-col：垂直佈局允許貨幣列表自適應擴展
         * - 滾動由 AppLayout 統一處理，避免嵌套滾動
         */}
        <section className={multiConverterLayoutTokens.section.className}>
          <div className={multiConverterLayoutTokens.card.className}>
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

        {/* 更新時間區塊 - 固定在底部 */}
        {!ratesLoading && lastUpdate && (
          <section className={multiConverterLayoutTokens.info.wrapper}>
            <div className={multiConverterLayoutTokens.info.titleRow}>
              <Clock className="w-3.5 h-3.5" />
              <h3 className={multiConverterLayoutTokens.info.titleText}>
                {t('footer.dataSource')}
              </h3>
            </div>
            <div className={multiConverterLayoutTokens.info.card}>
              <p className={multiConverterLayoutTokens.info.text}>
                {formatDisplayTime(lastUpdate, lastFetchedAt)}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
