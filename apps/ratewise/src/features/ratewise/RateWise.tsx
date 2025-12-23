import { AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useExchangeRates } from './hooks/useExchangeRates';
import { SingleConverter } from './components/SingleConverter';
import { MultiConverter } from './components/MultiConverter';
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { ConversionHistory } from './components/ConversionHistory';
import { VersionDisplay } from '../../components/VersionDisplay';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../../components/PullToRefreshIndicator';
import { formatDisplayTime } from '../../utils/timeFormatter';
import { clearAllServiceWorkerCaches, forceServiceWorkerUpdate } from '../../utils/swUtils';
import { logger } from '../../utils/logger';
import { SkeletonLoader } from '../../components/SkeletonLoader';
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
  const mainRef = useRef<HTMLElement>(null);
  const isTestEnv = import.meta.env.MODE === 'test';
  const [isHydrated, setIsHydrated] = useState(isTestEnv);

  // 確保伺服端與客戶端初始渲染內容一致，避免 hydration 警告
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration 標記，必須在 effect 中設置
    setIsHydrated(true);
  }, []);

  // 匯率類型狀態（spot/cash），默認 spot，從 localStorage 讀取
  const [rateType, setRateType] = useState<RateType>(() => {
    if (typeof window === 'undefined') return 'spot';
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_TYPE);
    return stored === 'cash' ? 'cash' : 'spot';
  });

  // 持久化 rateType 選擇
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.RATE_TYPE, rateType);
    }
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
  const { pullDistance, isRefreshing, canTrigger } = usePullToRefresh(mainRef, handlePullToRefresh);

  // 格式化顯示時間（來源時間 · 刷新時間）
  const formattedLastUpdate = useMemo(
    () => formatDisplayTime(lastUpdate, lastFetchedAt),
    [lastUpdate, lastFetchedAt],
  );

  const {
    mode,
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    favorites,
    multiAmounts,
    baseCurrency,
    history,
    trend,
    sortedCurrencies,
    setMode,
    setFromCurrency,
    setToCurrency,
    setBaseCurrency,
    handleFromAmountChange,
    handleToAmountChange,
    handleMultiAmountChange,
    quickAmount,
    swapCurrencies,
    toggleFavorite,
    addToHistory,
    generateTrends,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  const shouldShowSkeleton = !isHydrated || (ratesLoading && !isTestEnv);

  if (shouldShowSkeleton) {
    return <SkeletonLoader />;
  }

  // Error state UI
  if (ratesError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red-500 mx-auto" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">匯率載入失敗</h1>
          <p className="text-gray-600 mt-2 mb-6">
            抱歉，我們無法從網路獲取最新的匯率資料。請檢查您的網路連線，然後再試一次。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw size={18} />
            重新整理頁面
          </button>
        </div>
      </div>
    );
  }

  const modeToggleButton = (
    <div className="inline-flex bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-0.5 shadow-sm border border-blue-100/50">
      <button
        onClick={() => setMode('single')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
          mode === 'single'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-105'
            : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs font-semibold">單幣別</span>
      </button>
      <button
        onClick={() => setMode('multi')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
          mode === 'multi'
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md scale-105'
            : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="text-xs font-semibold">多幣別</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        canTrigger={canTrigger}
      />

      <main
        ref={mainRef}
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-8"
        style={{ overscrollBehaviorY: 'contain' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-0 mb-0.5">
              <picture>
                <source
                  type="image/avif"
                  srcSet="/optimized/logo-112w.avif 112w, /optimized/logo-192w.avif 192w"
                  sizes="(max-width: 768px) 64px, 80px"
                />
                <source
                  type="image/webp"
                  srcSet="/optimized/logo-112w.webp 112w, /optimized/logo-192w.webp 192w"
                  sizes="(max-width: 768px) 64px, 80px"
                />
                <img
                  src="/logo.png"
                  alt="RateWise Logo"
                  className="w-16 h-16 md:w-20 md:h-20"
                  width="112"
                  height="112"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </picture>
              <h1
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 700 }}
              >
                RateWise 匯率好工具
              </h1>
            </div>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {ratesLoading ? '載入即時匯率中...' : '即時匯率換算 · 精準可靠'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <div className="flex justify-center mb-4">{modeToggleButton}</div>

                {mode === 'single' ? (
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
                ) : (
                  <MultiConverter
                    sortedCurrencies={sortedCurrencies}
                    multiAmounts={multiAmounts}
                    baseCurrency={baseCurrency}
                    favorites={favorites}
                    rateType={rateType}
                    details={details}
                    onAmountChange={handleMultiAmountChange}
                    onQuickAmount={quickAmount}
                    onToggleFavorite={toggleFavorite}
                    onRateTypeChange={setRateType}
                    onBaseCurrencyChange={setBaseCurrency}
                  />
                )}
              </div>

              {mode === 'single' && <ConversionHistory history={history} />}
            </div>

            <div className="space-y-4 md:space-y-6">
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

          {/* FAQ 精選摘要（對齊首頁 JSON-LD，提升 Rich Result 一致性） */}
          <section className="mt-10">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  ?
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">常見問題精選</h2>
                  <p className="text-sm text-slate-500">首頁摘要，完整內容請見 FAQ 頁面</p>
                </div>
              </div>
              <dl className="space-y-4">
                {HOMEPAGE_FAQ.map((item) => (
                  <div
                    key={item.question}
                    className="border border-slate-100 rounded-2xl p-4 md:p-5 hover:shadow-sm transition-shadow bg-gradient-to-r from-slate-50 to-white"
                  >
                    <dt className="text-base md:text-lg font-semibold text-slate-800 mb-1">
                      {item.question}
                    </dt>
                    <dd className="text-sm md:text-base text-slate-600 leading-relaxed">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <Link
                  to="/faq/"
                  className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  查看完整 FAQ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* 數據來源與更新時間 - 簡潔卡片設計 */}
          {!ratesLoading && lastUpdate && (
            <section className="mt-6">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl shadow-lg p-4 md:p-5">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                  <a
                    href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
                  >
                    <svg
                      className="w-4 h-4 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">臺灣銀行牌告匯率</span>
                    <svg
                      className="w-3 h-3 text-white/60 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <span className="hidden sm:block text-white/30">|</span>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>更新 {formattedLastUpdate}</span>
                  </div>
                  <span className="hidden sm:block text-white/30">|</span>
                  <div className="flex items-center gap-1.5 text-sm text-white/70">
                    <VersionDisplay />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default RateWise;
