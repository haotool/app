/**
 * RateWise - 單幣別轉換器組件
 *
 * [refactor:2026-01-15] 重構為內容組件
 * - 移除頁面級元素（背景、標題、Footer）
 * - 專注於轉換器核心功能
 * - 配合 AppLayout 使用
 *
 * 功能：
 * - 單幣別/多幣別轉換
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
// import { MultiConverter } from './components/MultiConverter'; // [refactor:2026-01-15] 移至獨立頁面
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { ConversionHistory } from './components/ConversionHistory';
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

  /**
   * [fix:2025-12-25] 修復 React Hydration Error #418 根本問題
   *
   * 問題：在 useState 初始化函數中使用 localStorage.getItem()
   * - SSG 時：typeof window === 'undefined'，返回 'spot'
   * - 客戶端：如果用戶有儲存 'cash'，返回 'cash'
   * - 造成 SSG HTML 與客戶端初始渲染不一致 → React Error #418
   *
   * 解法：useState 永遠使用固定初始值 'spot'，
   * 然後在 useEffect (客戶端專用) 中讀取 localStorage 並更新
   *
   * 參考: [context7:/reactjs/react.dev:useState:2025-12-25]
   * 參考: [context7:/daydreamer-riri/vite-react-ssg:ClientOnly:2025-12-25]
   */
  const [rateType, setRateType] = useState<RateType>('spot');

  // [fix:2025-12-25] 客戶端 hydration 後從 localStorage 恢復用戶偏好
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

  // [fix:2025-12-13] 修復下拉刷新：清除快取 + 強制重新載入頁面
  // 問題: 只清除快取不重新載入，用戶仍看到記憶體中的舊版本 JS/CSS
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

  // [refactor:2026-01-15] 單幣別轉換器專用
  // 移除多幣別相關變量：mode, multiAmounts, baseCurrency, sortedCurrencies, setMode, setBaseCurrency, handleMultiAmountChange
  const {
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    favorites,
    history,
    trend,
    setFromCurrency,
    setToCurrency,
    handleFromAmountChange,
    handleToAmountChange,
    quickAmount,
    swapCurrencies,
    toggleFavorite,
    addToHistory,
    clearAllHistory,
    reconvertFromHistory,
    generateTrends,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  /**
   * [fix:2025-12-25] 修復 React Hydration Error #418
   *
   * 問題：SSG 時渲染 SkeletonLoader，但客戶端 hydration 時
   * 如果 ratesLoading 快速變成 false（快取命中），會導致
   * shouldShowSkeleton 變化，造成 hydration 不一致
   *
   * 解法：hydration 完成前，永遠返回 SkeletonLoader，
   * 確保首次渲染與 SSG 生成的 HTML 完全一致
   *
   * 參考: [context7:/reactjs/react.dev:hydration:2025-12-25]
   */
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
        {/* [fix:2026-01-20] SSOT: bg-white → bg-surface */}
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

  // [refactor:2026-01-15] 移除 modeToggleButton
  // 單幣別/多幣別切換改由底部導覽列處理

  return (
    <>
      <HomeStructuredData faq={HOMEPAGE_FAQ} />

      {/* Pull-to-Refresh Indicator */}
      {isPullToRefreshEnabled && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          canTrigger={canTrigger}
        />
      )}

      {/* [refactor:2026-01-15] 移除 min-h-screen 和頁面級背景
          改為由 AppLayout 處理整體頁面結構
          此組件專注於內容區域的渲染 */}
      <div ref={mainRef} className="space-y-4">
        {/* 狀態提示區 */}
        {ratesLoading && (
          <div className="text-center text-sm text-neutral-text-secondary py-2">
            載入即時匯率中...
          </div>
        )}

        {/* 主要轉換區塊 */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            {/* [refactor:2026-01-15] 單幣別轉換器
                多幣別功能已移至獨立頁面 (/multi) */}
            <div className="card p-4 md:p-6">
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

            {/* 轉換歷史記錄 */}
            <ConversionHistory
              history={history}
              onReconvert={reconvertFromHistory}
              onClearAll={clearAllHistory}
            />
          </div>

          {/* 側欄區塊（桌面版顯示） */}
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
        </div>

        {/* [refactor:2026-01-15] 移除 FAQ 精選和行動版 Footer
            - FAQ 精選移至獨立區塊或 FAQ 頁面連結
            - Footer 由 AppLayout 統一處理
            - 保留資料來源顯示，移至更新時間旁 */}

        {/* 更新時間與資料來源 */}
        {!ratesLoading && lastUpdate && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-neutral-text-secondary">
            <a
              href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              臺灣銀行牌告
            </a>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formattedLastUpdate}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default RateWise;
