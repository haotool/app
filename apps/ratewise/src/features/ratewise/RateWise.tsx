import { Grid, Maximize2 } from 'lucide-react';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useExchangeRates } from './hooks/useExchangeRates';
import { SingleConverter } from './components/SingleConverter';
import { MultiConverter } from './components/MultiConverter';
import { FavoritesList } from './components/FavoritesList';
import { CurrencyList } from './components/CurrencyList';
import { ConversionHistory } from './components/ConversionHistory';

const RateWise = () => {
  // Load real-time exchange rates
  const { rates: exchangeRates, isLoading: ratesLoading, lastUpdate, source } = useExchangeRates();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
            好工具匯率
          </h1>
          <p className="text-sm text-gray-600">
            {ratesLoading ? '載入即時匯率中...' : '即時匯率換算 · 精準可靠'}
          </p>
          {!ratesLoading && lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              {source} · 更新時間: {lastUpdate}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:h-auto h-[calc(100vh-180px)] flex flex-col">
              <div className="flex justify-center mb-4">{modeToggleButton}</div>

              {mode === 'single' ? (
                <SingleConverter
                  fromCurrency={fromCurrency}
                  toCurrency={toCurrency}
                  fromAmount={fromAmount}
                  toAmount={toAmount}
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
            <FavoritesList favorites={favorites} trend={trend} />
            <CurrencyList
              favorites={favorites}
              trend={trend}
              onToggleFavorite={toggleFavorite}
              onRefreshTrends={generateTrends}
            />
          </div>
        </div>

        <div className="mt-4 md:mt-8 text-center text-xs md:text-sm text-gray-500">
          <p>匯率資料參考台灣銀行牌告匯率（本行賣出現金），實際交易請以銀行公告為準</p>
        </div>
      </div>
    </div>
  );
};

export default RateWise;
