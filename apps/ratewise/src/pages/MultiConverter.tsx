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
import { SEOHelmet } from '../components/SEOHelmet';
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

  // SSG Fix: SEOHelmet 必須在所有 early return 之前，確保 SSG 時能正確渲染 meta tags
  // @see https://vite-react-ssg.netlify.app/docs/components — Head 獨立於渲染狀態
  const seoHelmet = (
    <SEOHelmet
      title="多幣別同時換算 - 一次比較 30+ 種即時匯率"
      description="RateWise 多幣別同時換算功能，一次查看所有支援貨幣的即時匯率換算結果。參考臺灣銀行官方牌告匯率，同時顯示 30+ 種貨幣對台幣匯率，支援收藏常用貨幣、切換現金/即期匯率，適合旅遊換匯比價與跨境貿易報價。支援 PWA 離線使用，完全免費，無廣告。"
      pathname="/multi"
    />
  );

  if (!isHydrated) {
    return (
      <>
        {seoHelmet}
        <h1 className="sr-only">多幣別同時換算 - 一次比較 30+ 種即時匯率</h1>
        <SkeletonLoader />
      </>
    );
  }

  if (ratesLoading && !isTestEnv) {
    return (
      <>
        {seoHelmet}
        <h1 className="sr-only">多幣別同時換算 - 一次比較 30+ 種即時匯率</h1>
        <SkeletonLoader />
      </>
    );
  }

  if (ratesError) {
    return (
      <>
        {seoHelmet}
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
      </>
    );
  }

  return (
    <div className={multiConverterLayoutTokens.container}>
      {seoHelmet}
      <h1 className="sr-only">多幣別同時換算 - 一次比較 30+ 種即時匯率</h1>
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
