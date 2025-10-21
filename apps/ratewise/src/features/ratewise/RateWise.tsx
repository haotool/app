import { Grid, Maximize2, AlertCircle, RefreshCw } from 'lucide-react';
import { useRef } from 'react';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useExchangeRates } from './hooks/useExchangeRates';
import { SingleConverter } from './components/SingleConverter';
import { MultiConverter } from './components/MultiConverter';
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { ConversionHistory } from './components/ConversionHistory';
import { SEOHelmet } from '../../components/SEOHelmet';
import { VersionDisplay } from '../../components/VersionDisplay';
import { ThreadsIcon } from '../../components/ThreadsIcon';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../../components/PullToRefreshIndicator';

const RateWise = () => {
  // Main container ref for pull-to-refresh
  const mainRef = useRef<HTMLElement>(null);

  // Load real-time exchange rates
  const {
    rates: exchangeRates,
    isLoading: ratesLoading,
    error: ratesError,
    lastUpdate,
    refresh,
  } = useExchangeRates();

  // Pull-to-refresh functionality
  const { pullDistance, isRefreshing, canTrigger } = usePullToRefresh(mainRef, refresh);

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
    handleFromAmountChange,
    handleToAmountChange,
    handleMultiAmountChange,
    quickAmount,
    swapCurrencies,
    toggleFavorite,
    addToHistory,
    generateTrends,
  } = useCurrencyConverter({ exchangeRates });

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
    <div className="inline-flex bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => setMode('single')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          mode === 'single'
            ? 'bg-white text-blue-600 shadow-md'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <Maximize2 size={18} />
        <span className="text-sm font-medium">單幣別</span>
      </button>
      <button
        onClick={() => setMode('multi')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          mode === 'multi'
            ? 'bg-white text-purple-600 shadow-md'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <Grid size={18} />
        <span className="text-sm font-medium">多幣別</span>
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

      <SEOHelmet
        howTo={{
          name: '如何使用 RateWise 進行匯率換算',
          description: '三步驟輕鬆完成即時匯率換算，支援 30+ 種貨幣快速轉換',
          steps: [
            {
              name: '選擇貨幣',
              text: '從下拉選單中選擇您要換算的來源貨幣和目標貨幣。RateWise 支援超過 30 種主要貨幣，包括 TWD、USD、JPY、EUR、GBP 等。',
            },
            {
              name: '輸入金額',
              text: '在輸入框中輸入您想要換算的金額。系統會即時計算並顯示換算結果，數據來源為臺灣銀行牌告匯率。',
            },
            {
              name: '查看結果',
              text: '換算結果會立即顯示在畫面上。您還可以查看歷史匯率趨勢圖，了解過去一段時間的匯率變化走勢。',
            },
          ],
        }}
      />
      <main
        ref={mainRef}
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-8"
        style={{ overscrollBehaviorY: 'contain' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
              匯率好工具
            </h1>
            <p className="text-sm text-gray-600">
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
                    onFromCurrencyChange={setFromCurrency}
                    onToCurrencyChange={setToCurrency}
                    onFromAmountChange={handleFromAmountChange}
                    onToAmountChange={handleToAmountChange}
                    onQuickAmount={quickAmount}
                    onSwapCurrencies={swapCurrencies}
                    onAddToHistory={addToHistory}
                  />
                ) : (
                  <MultiConverter
                    sortedCurrencies={sortedCurrencies}
                    multiAmounts={multiAmounts}
                    baseCurrency={baseCurrency}
                    favorites={favorites}
                    onAmountChange={handleMultiAmountChange}
                    onQuickAmount={quickAmount}
                    onToggleFavorite={toggleFavorite}
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

          <footer className="mt-12 -mx-3 md:-mx-8 -mb-3 md:-mb-8 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
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
                    <span>
                      更新時間{' '}
                      {(() => {
                        const parts = lastUpdate.split(' ');
                        if (parts.length === 2 && parts[0] && parts[1]) {
                          const datePart = parts[0];
                          const timePart = parts[1];
                          const dateComponents = datePart.split('-');
                          if (dateComponents.length === 3) {
                            const month = dateComponents[1];
                            const day = dateComponents[2];
                            return `${month}/${day} ${timePart}`;
                          }
                        }
                        return lastUpdate.split(' ')[1] ?? lastUpdate;
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* 免責聲明 - 簡化設計 */}
              <div className="text-center mb-6">
                <p className="text-xs text-white/70 leading-relaxed">
                  本服務匯率資料參考臺灣銀行牌告匯率（本行賣出現金）· 實際交易匯率以各銀行公告為準
                </p>
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
                  <ThreadsIcon className="w-4 h-4" />
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
