/**
 * Multi-Currency Converter Page
 *
 * 多幣別轉換器頁面 - 同時顯示多個貨幣的換算結果
 * 使用 SSOT design tokens 確保主題一致性
 */

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { MultiConverter as MultiConverterComponent } from '../features/ratewise/components/MultiConverter';
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { useCurrencyConverter } from '../features/ratewise/hooks/useCurrencyConverter';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { formatDisplayTime } from '../utils/timeFormatter';
import type { RateType, CurrencyCode } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

export default function MultiConverter() {
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
    favorites,
    multiAmounts,
    sortedCurrencies,
    handleMultiAmountChange,
    quickAmount,
    toggleFavorite,
    setBaseCurrency,
    baseCurrency,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

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

  if (!isHydrated) {
    return <SkeletonLoader />;
  }

  if (ratesLoading && !isTestEnv) {
    return <SkeletonLoader />;
  }

  if (ratesError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-border/50">
          <AlertCircle className="text-destructive mx-auto" size={48} />
          <h1 className="text-2xl font-bold text-text mt-4">匯率載入失敗</h1>
          <p className="text-text-muted mt-2 mb-6">無法獲取最新匯率資料，請檢查網路連線後重試。</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw size={18} />
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden pb-20">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-text">多幣別轉換</h1>
        <p className="text-xs text-text-muted mt-1">點擊貨幣行切換基準 · 點擊金額開啟計算機</p>
      </div>

      {/* Multi Converter Component */}
      <div className="flex-1 overflow-hidden px-4 flex flex-col min-h-0">
        <MultiConverterComponent
          sortedCurrencies={sortedCurrencies}
          multiAmounts={multiAmounts}
          baseCurrency={baseCurrency}
          favorites={favorites}
          rateType={rateType}
          details={details}
          onAmountChange={handleMultiAmountChange}
          onQuickAmount={handleQuickAmount}
          onToggleFavorite={toggleFavorite}
          onRateTypeChange={setRateType}
          onBaseCurrencyChange={handleBaseCurrencyChange}
        />
      </div>

      {/* Footer - Update Time */}
      {!ratesLoading && lastUpdate && (
        <div className="flex-shrink-0 px-4 py-2 text-center">
          <span className="text-xs text-text-muted">
            {formatDisplayTime(lastUpdate, lastFetchedAt)}
          </span>
        </div>
      )}
    </div>
  );
}
