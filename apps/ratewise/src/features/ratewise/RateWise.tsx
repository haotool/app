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
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useExchangeRates } from './hooks/useExchangeRates';
import { SingleConverter } from './components/SingleConverter';
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../../components/PullToRefreshIndicator';
import { formatDisplayTime } from '../../utils/timeFormatter';
import { performFullRefresh } from '../../utils/swUtils';
import { logger } from '../../utils/logger';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { rateWiseLayoutTokens } from '../../config/design-tokens';
import type { RateType } from './types';
import { STORAGE_KEYS } from './storage-keys';

const RateWise = () => {
  const { t } = useTranslation();
  // Main container ref for pull-to-refresh
  const mainRef = useRef<HTMLDivElement>(null);
  const isTestEnv = import.meta.env.MODE === 'test';
  const [isHydrated, setIsHydrated] = useState(isTestEnv);

  // 確保伺服端與客戶端初始渲染內容一致，避免 hydration 警告
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration 標記，必須在 effect 中設置
    setIsHydrated(true);
  }, []);

  // 使用固定初始值避免 SSR hydration mismatch，在 useEffect 中從 localStorage 恢復
  const [rateType, setRateType] = useState<RateType>('spot');

  // Restore user preferences from localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_TYPE);
    if (stored === 'cash') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration：必須在 effect 中從 localStorage 恢復用戶偏好，避免 hydration mismatch
      setRateType('cash');
    }
  }, []);

  // 持久化 rateType 選擇
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATE_TYPE, rateType);
  }, [rateType]);

  // Load real-time exchange rates
  const {
    rates: exchangeRates,
    details,
    isLoading: ratesLoading,
    error: ratesError,
    lastUpdate,
    lastFetchedAt,
  } = useExchangeRates();

  // Pull-to-refresh: 使用共用流程確保快取與 Service Worker 更新一致
  const handlePullToRefresh = useCallback(async () => {
    logger.info('Pull-to-refresh: starting full refresh');
    await performFullRefresh();
  }, []);

  // Pull-to-refresh functionality
  const isPullToRefreshEnabled = isHydrated && !ratesLoading && !ratesError && !isTestEnv;
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
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    favorites,
    trend,
    setFromCurrency,
    setToCurrency,
    handleFromAmountChange,
    handleToAmountChange,
    quickAmount,
    swapCurrencies,
    toggleFavorite,
    addToHistory,
    generateTrends,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  // 在 hydration 完成前，永遠返回 SkeletonLoader（與 SSG 一致）
  if (!isHydrated) {
    return <SkeletonLoader />;
  }

  // hydration 完成後，只有在載入中才顯示 skeleton
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
          <h1 className="text-2xl font-bold text-neutral-text mt-4">匯率載入失敗</h1>
          <p className="text-neutral-text-secondary mt-2 mb-6">
            抱歉，我們無法從網路獲取最新的匯率資料。請檢查您的網路連線，然後再試一次。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-danger hover:bg-danger-hover text-white font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw size={18} />
            重新整理頁面
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
          <h1 className="sr-only">{t('app.title')}</h1>
          {/* 載入狀態提示 */}
          {ratesLoading && (
            <div className="text-center text-sm text-neutral-text-secondary py-2">
              載入即時匯率中...
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
                onFromCurrencyChange={setFromCurrency}
                onToCurrencyChange={setToCurrency}
                onFromAmountChange={handleFromAmountChange}
                onToAmountChange={handleToAmountChange}
                onQuickAmount={quickAmount}
                onSwapCurrencies={swapCurrencies}
                onAddToHistory={addToHistory}
                onRateTypeChange={setRateType}
              />
            </div>
          </section>

          {/* 收藏與貨幣列表區塊（桌面版顯示於側欄） */}
          <section className="mb-4 hidden md:block flex-shrink-0">
            <div className="space-y-4">
              <FavoritesList favorites={favorites} trend={trend} exchangeRates={exchangeRates} />
              <CurrencyList
                favorites={favorites}
                trend={trend}
                exchangeRates={exchangeRates}
                onToggleFavorite={toggleFavorite}
                onRefreshTrends={generateTrends}
              />
            </div>
          </section>

          {/* 資料來源與更新時間區塊 - 現代化精簡設計，固定在底部 */}
          {!ratesLoading && lastUpdate && (
            <section
              data-testid="ratewise-data-source"
              className={`${rateWiseLayoutTokens.info.base} ${rateWiseLayoutTokens.info.visibility}`}
            >
              <div className="inline-flex items-center gap-2 text-[10px] text-text-muted/60">
                <a
                  href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  臺灣銀行牌告
                </a>
                <span>·</span>
                <span>{formattedLastUpdate}</span>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default RateWise;
