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
                {/* 行動版使用較小尺寸 */}
                <source
                  type="image/avif"
                  srcSet="/optimized/logo-112w.avif"
                  media="(max-width: 767px)"
                />
                <source
                  type="image/webp"
                  srcSet="/optimized/logo-112w.webp"
                  media="(max-width: 767px)"
                />
                {/* 電腦版使用較大尺寸 */}
                <source type="image/avif" srcSet="/optimized/logo-192w.avif" />
                <source type="image/webp" srcSet="/optimized/logo-192w.webp" />
                <img
                  alt="RateWise Logo"
                  className="w-16 h-16 md:w-20 md:h-20"
                  width="112"
                  height="112"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  src="/logo.png"
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

          {/* 行動版簡潔 footer - 電腦版使用 Footer 組件 */}
          <footer className="md:hidden mt-12 -mx-3 -mb-3 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
              {/* 數據來源與更新時間 - 現代化簡約設計 */}
              {!ratesLoading && lastUpdate && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
                  <a
                    href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
                  >
                    <svg
                      className="w-4 h-4 text-white group-hover:scale-110 transition-transform"
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
                    <span className="text-sm font-medium text-white">
                      Taiwan Bank (臺灣銀行牌告匯率)
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform"
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
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>更新時間 {formattedLastUpdate}</span>
                  </div>
                </div>
              )}

              {/* 免責聲明 - 簡化設計 */}
              <div className="text-center mb-6">
                <p className="text-xs text-white/70 leading-relaxed">
                  本服務匯率資料參考臺灣銀行牌告匯率（現金與即期賣出價）·
                  實際交易匯率以各銀行公告為準
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-white/80 mb-6">
                <Link
                  to="/faq/"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
                >
                  <span aria-hidden="true" className="text-white/50">
                    ?
                  </span>
                  常見問題
                </Link>
                <Link
                  to="/about/"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
                >
                  <span aria-hidden="true" className="text-white/50">
                    i
                  </span>
                  關於我們
                </Link>
              </div>

              {/* 分隔線 */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

              {/* 版權與品牌 - 極簡設計 */}
              <div className="flex flex-col items-center justify-center gap-3 text-sm">
                {/* 品牌名稱與版本 */}
                <div className="flex items-center gap-2 text-white/90">
                  {/* 匯率趨勢圖標 */}
                  <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold">匯率好工具</span>
                  <span className="text-white/50">•</span>
                  <VersionDisplay />
                  <span className="text-white/50">•</span>
                  <span className="text-white/70">© {new Date().getFullYear()}</span>
                </div>

                {/* 作者資訊 */}
                <div className="flex items-center gap-1.5 text-white/80">
                  <span>By</span>
                  <a
                    href="https://www.threads.net/@azlife_1224"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
                  >
                    azlife_1224
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
};

export default RateWise;
