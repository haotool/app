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
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useExchangeRates } from './hooks/useExchangeRates';
import { SingleConverter } from './components/SingleConverter';
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../../components/PullToRefreshIndicator';
import { formatDisplayTime } from '../../utils/timeFormatter';
import { clearAllServiceWorkerCaches, forceServiceWorkerUpdate } from '../../utils/swUtils';
import { logger } from '../../utils/logger';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { HomeStructuredData } from '../../components/HomeStructuredData';
import type { RateType } from './types';
import { STORAGE_KEYS } from './storage-keys';

const HOMEPAGE_FAQ = [
  {
    question: '匯率來源與更新頻率？',
    answer: '匯率 100% 參考臺灣銀行牌告，包含現金/即期買入賣出價，每 5 分鐘自動同步一次。',
  },
  {
    question: '支援哪些貨幣？',
    answer:
      '支援 30+ 種主要貨幣（TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD 等），可收藏常用貨幣。',
  },
  {
    question: '可以離線使用嗎？',
    answer: '可。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算。',
  },
  {
    question: '如何查看多幣別與歷史趨勢？',
    answer:
      '切換「多幣別」模式可同時查看所有支援貨幣；單幣別卡片可展開 7~30 天歷史趨勢線圖，輔助判斷換匯時機。',
  },
];

const RateWise = () => {
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

  // Pull-to-refresh: clear cache and force reload page
  // 解決方案: 清除快取後強制重新載入頁面，確保載入最新版本
  // 參考:
  // - https://plainenglish.io/blog/how-to-force-a-pwa-to-refresh-its-content
  // - https://web.dev/learn/pwa/update
  const handlePullToRefresh = useCallback(async () => {
    try {
      logger.info('Pull-to-refresh: starting full refresh');

      // 1. 清除 Service Worker 快取
      const clearedCount = await clearAllServiceWorkerCaches();
      logger.debug('Pull-to-refresh: caches cleared', { count: clearedCount });

      // 2. 檢查並嘗試更新 Service Worker
      await forceServiceWorkerUpdate();

      // 3. 強制重新載入頁面 (確保載入最新版本的 JS/CSS/HTML)
      window.location.reload();

      logger.info('Pull-to-refresh: completed successfully');
    } catch (error) {
      logger.error('Pull-to-refresh: failed', error as Error);
      // 即使出錯，仍然重新載入頁面
      window.location.reload();
    }
  }, []); // 移除 refresh 依賴，因為頁面會重新載入

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
      <div className="min-h-screen bg-danger-bg flex items-center justify-center p-4">
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
      <HomeStructuredData faq={HOMEPAGE_FAQ} />

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
       * SSOT 頁面佈局規範（2025 最佳實踐）：
       * - 外層容器：min-h-full（不使用 overflow，由 AppLayout 處理）
       * - 內容區域：px-5 py-6 max-w-md mx-auto
       * - 移除 pb-32（AppLayout 已有 pb-[calc(56px+safe-area)]）
       *
       * @see AppLayout.tsx - 外層滾動容器
       * @see https://web.dev/viewport-units/ - 動態視口高度
       */}
      <div ref={mainRef} className="min-h-full">
        <div className="px-5 py-6 max-w-md mx-auto">
          {/* 載入狀態提示 */}
          {ratesLoading && (
            <div className="text-center text-sm text-neutral-text-secondary py-2">
              載入即時匯率中...
            </div>
          )}

          {/* 單幣別轉換區塊 */}
          <section className="mb-6">
            <div className="card p-4">
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
          <section className="mb-6 hidden md:block">
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

          {/* 資料來源與更新時間區塊 - 現代化精簡設計 */}
          {!ratesLoading && lastUpdate && (
            <section className="text-center">
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
