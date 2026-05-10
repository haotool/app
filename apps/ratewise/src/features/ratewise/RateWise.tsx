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
import { rateWiseLayoutTokens } from '../../config/design-tokens';
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

  useEffect(() => {
    // 幣別離開換錢所支援範圍時必須立即回到銀行來源；經 converterStore action 更新，不觸發 set-state-in-effect 規則。
    if (rateSource === 'exchange-shop' && !exchangeShopCurrency) {
      setRateSource('bank');
    }
  }, [exchangeShopCurrency, rateSource, setRateSource]);

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
      <div className="min-h-dvh bg-danger-bg flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="text-danger" size={48} />
          <h1 className="text-2xl font-bold text-neutral-text mt-4">
            {t('errors.rateLoadFailed')}
          </h1>
          <p className="text-neutral-text-secondary mt-2 mb-6">{t('errors.rateLoadDescription')}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-danger hover:bg-danger-hover text-white font-semibold rounded-xl shadow-lg transition"
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

      {/* 頁面主容器
       *
       * SSOT 頁面佈局規範（2026 最佳實踐）：
       * - 外層容器：flex flex-col min-h-full（填滿可用空間）
       * - 內容區域：flex-1 flex flex-col px-5 py-4 max-w-md mx-auto w-full
       * - 滾動由 AppLayout 統一處理，避免嵌套滾動
       *
       * @see AppLayout.tsx - 外層滾動容器
       * @see https://web.dev/viewport-units/ - 動態視口高度
       */}
      <div ref={mainRef} className={rateWiseLayoutTokens.container}>
        <div className={rateWiseLayoutTokens.content.className}>
          {/* H1 由 routes.tsx SEO wrapper 提供，此處不重複 */}
          {/* 載入狀態提示 */}
          {ratesLoading && (
            <div className="text-center text-sm text-neutral-text-secondary py-2">
              載入即時匯率中...
            </div>
          )}

          {ratesWarning && (
            <div
              role="status"
              data-testid="ratewise-stale-rates-warning"
              className="mb-3 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-text"
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

          {/* 收藏與貨幣列表區塊（桌面版顯示於側欄） */}
          <section className="mb-4 hidden md:block flex-shrink-0">
            <div className="space-y-4">
              <FavoritesList favorites={favorites} exchangeRates={exchangeRates} />
              <CurrencyList
                favorites={favorites}
                exchangeRates={exchangeRates}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          </section>

          {/* 資料來源與更新時間區塊 - 現代化精簡設計，固定在底部 */}
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
                    className="inline-flex items-center gap-2 text-[10px] text-text-muted/60"
                  >
                    <a
                      href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Landmark className="h-3 w-3 text-primary/70" aria-hidden="true" />
                      臺灣銀行牌告
                    </a>
                    <span>·</span>
                    <span>{formattedLastUpdate}</span>
                  </div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default RateWise;
