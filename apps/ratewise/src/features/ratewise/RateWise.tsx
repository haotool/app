/**
 * RateWise - 單幣別轉換器組件
 *
 * 功能：
 * - 單幣別轉換
 * - 即期/現金匯率切換
 * - 轉換歷史記錄
 * - 收藏貨幣列表
 * - 幣種列表與趨勢
 */
import { AlertCircle, Landmark, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useExchangeRates } from './hooks/useExchangeRates';
import { SingleConverter } from './components/SingleConverter';
import { ExchangeShopBadge } from './components/ExchangeShopBadge';
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../../components/PullToRefreshIndicator';
import { formatDisplayTime } from '../../utils/timeFormatter';
import { performFullRefresh } from '../../utils/swUtils';
import { logger } from '../../utils/logger';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { feedbackSurfaceTokens, rateWiseLayoutTokens } from '../../config/design-tokens';
import type { CurrencyCode, RateSource, RateType } from './types';
import { CURRENCY_DEFINITIONS } from './constants';
import { useConverterStore } from '../../stores/converterStore';
import {
  getPairRateTypeAvailability,
  resolveRateTypeByAvailability,
} from '../../utils/exchangeRateCalculation';

const RateWise = () => {
  const { t } = useTranslation();
  // Main container ref for pull-to-refresh
  const mainRef = useRef<HTMLDivElement>(null);
  const isTestEnv = import.meta.env.MODE === 'test';

  // rateType / rateSource 由 converterStore 持久化，與多幣別/收藏頁共用同一份 SSOT。
  const rateType = useConverterStore((state) => state.rateType);
  const rateSource = useConverterStore((state) => state.rateSource);
  const setRateType = useConverterStore((state) => state.setRateType);
  const setRateSource = useConverterStore((state) => state.setRateSource);

  // Load real-time exchange rates
  const {
    rates: exchangeRates,
    details,
    isLoading: ratesLoading,
    error: ratesError,
    warning: ratesWarning,
    lastUpdate,
    lastFetchedAt,
  } = useExchangeRates();

  // Pull-to-refresh: 使用共用流程確保快取與 Service Worker 更新一致
  const handlePullToRefresh = useCallback(async () => {
    logger.info('Pull-to-refresh: starting full refresh');
    await performFullRefresh();
  }, []);

  // Pull-to-refresh functionality
  const isPullToRefreshEnabled = !ratesLoading && !ratesError && !isTestEnv;
  const { pullDistance, isRefreshing, canTrigger } = usePullToRefresh(
    mainRef,
    handlePullToRefresh,
    { enabled: isPullToRefreshEnabled },
  );

  // 格式化顯示時間（來源時間 · 刷新時間）
  const formattedLastUpdate = useMemo(
    () => formatDisplayTime(lastUpdate, lastFetchedAt),
    [lastUpdate, lastFetchedAt],
  );

  const {
    rateMode,
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    favorites,
    setFromCurrency,
    setToCurrency,
    handleFromAmountChange,
    handleToAmountChange,
    quickAmount,
    swapCurrencies,
    toggleFavorite,
    addToHistory,
    moneyBoxRate,
    exchangeShopCurrency,
    effectiveRateSource,
  } = useCurrencyConverter({ exchangeRates, details, rateType, rateSource, mode: 'single' });

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const from = searchParams.get('from')?.toUpperCase();
    const to = searchParams.get('to')?.toUpperCase();
    const amount = searchParams.get('amount');

    if (!from && !to && !amount) return;

    const validCodes = Object.keys(CURRENCY_DEFINITIONS);
    if (from && validCodes.includes(from)) setFromCurrency(from as CurrencyCode);
    if (to && validCodes.includes(to)) setToCurrency(to as CurrencyCode);
    if (amount && /^\d+(\.\d+)?$/.test(amount)) handleFromAmountChange(amount);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- 只在首次掛載時讀取 URL 參數

  // 註：rateSource 換錢所→銀行 fallback 已收斂到 useCurrencyConverter（SSOT），頁面層不再重複。

  const rateTypeAvailability = useMemo(
    () => getPairRateTypeAvailability(fromCurrency, toCurrency, details),
    [fromCurrency, toCurrency, details],
  );

  useEffect(() => {
    // 匯率類型需依可用性即時收斂，避免顯示不可用選項造成誤導；透過 store action，不算直接 setState in effect。
    if (!rateTypeAvailability.spot && !rateTypeAvailability.cash) return;
    const resolvedRateType = resolveRateTypeByAvailability(rateType, rateTypeAvailability);
    if (resolvedRateType !== rateType) {
      setRateType(resolvedRateType);
    }
  }, [rateType, rateTypeAvailability, setRateType]);

  const handleRateTypeChange = useCallback(
    (nextType: RateType) => {
      if (!rateTypeAvailability[nextType]) return;
      setRateType(nextType);
    },
    [rateTypeAvailability, setRateType],
  );

  const handleRateSourceChange = useCallback(
    (nextSource: RateSource) => {
      if (nextSource === 'exchange-shop' && !exchangeShopCurrency) return;
      setRateSource(nextSource);
    },
    [exchangeShopCurrency, setRateSource],
  );

  // 首屏使用 build-time rates 直接渲染；只有完全沒有可用資料時才顯示 skeleton。
  const shouldShowSkeleton = ratesLoading && !isTestEnv;

  if (shouldShowSkeleton) {
    return <SkeletonLoader />;
  }

  // Error state UI
  if (ratesError) {
    return (
      <div className={feedbackSurfaceTokens.pageCenter}>
        <div className={feedbackSurfaceTokens.card}>
          <AlertCircle className={feedbackSurfaceTokens.icon} size={48} />
          <h1 className={feedbackSurfaceTokens.title}>{t('errors.rateLoadFailed')}</h1>
          <p className={feedbackSurfaceTokens.description}>{t('errors.rateLoadDescription')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={feedbackSurfaceTokens.dangerActionButton}
          >
            <RefreshCw size={18} />
            {t('errors.reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 下拉重新整理指示器 */}
      {isPullToRefreshEnabled && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          canTrigger={canTrigger}
        />
      )}

      <div ref={mainRef} className={rateWiseLayoutTokens.container}>
        <div className={rateWiseLayoutTokens.content.className}>
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,22rem)] lg:items-start xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,24rem)]">
            <div className="min-w-0">
              {/* H1 由 routes.tsx SEO wrapper 提供，此處不重複 */}
              {/* 載入狀態提示 */}
              {ratesLoading && (
                <div className="py-2 text-center text-sm text-neutral-text-secondary">
                  {t('app.loadingLiveRates')}
                </div>
              )}

              {ratesWarning && (
                <div
                  role="status"
                  data-testid="ratewise-stale-rates-warning"
                  className="mb-3 flex items-center gap-2 rounded-control border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-text"
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{t('errors.rateStaleWarning')}</span>
                </div>
              )}

              {/* 單幣別轉換區塊 - RWD 全頁面佈局 */}
              <section className={rateWiseLayoutTokens.section.className}>
                <div className={rateWiseLayoutTokens.card.className}>
                  <SingleConverter
                    fromCurrency={fromCurrency}
                    toCurrency={toCurrency}
                    fromAmount={fromAmount}
                    toAmount={toAmount}
                    exchangeRates={exchangeRates}
                    details={details}
                    rateType={rateType}
                    rateSource={effectiveRateSource}
                    moneyBoxRate={moneyBoxRate}
                    exchangeShopCurrency={exchangeShopCurrency}
                    rateMode={rateMode}
                    rateTypeAvailability={rateTypeAvailability}
                    onFromCurrencyChange={setFromCurrency}
                    onToCurrencyChange={setToCurrency}
                    onFromAmountChange={handleFromAmountChange}
                    onToAmountChange={handleToAmountChange}
                    onQuickAmount={quickAmount}
                    onSwapCurrencies={swapCurrencies}
                    onAddToHistory={addToHistory}
                    onRateTypeChange={handleRateTypeChange}
                    onRateSourceChange={handleRateSourceChange}
                  />
                </div>
              </section>

              {!ratesLoading && lastUpdate && (
                <section
                  data-testid="ratewise-data-source"
                  className={`${rateWiseLayoutTokens.info.base} ${rateWiseLayoutTokens.info.visibility}`}
                >
                  <AnimatePresence mode="wait">
                    {effectiveRateSource === 'exchange-shop' &&
                    moneyBoxRate?.currency === exchangeShopCurrency ? (
                      <ExchangeShopBadge key="exchange-shop-badge" rate={moneyBoxRate} />
                    ) : (
                      <div
                        key="bank-badge"
                        className="inline-flex flex-wrap items-center gap-2 text-xs text-text-muted"
                      >
                        <a
                          href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 rounded-control px-1 font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Landmark className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
                          {t('rateInfo.bankOfficialRates')}
                        </a>
                        <span>·</span>
                        <span>{formattedLastUpdate}</span>
                      </div>
                    )}
                  </AnimatePresence>
                </section>
              )}
            </div>

            <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6">
              <FavoritesList favorites={favorites} exchangeRates={exchangeRates} />
              <CurrencyList
                favorites={favorites}
                exchangeRates={exchangeRates}
                onToggleFavorite={toggleFavorite}
              />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default RateWise;
