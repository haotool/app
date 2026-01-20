/**
 * Favorites & History Page
 *
 * 收藏與歷史記錄頁面
 * 使用 SSOT design tokens 確保主題一致性
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, Star, Clock, Trash2 } from 'lucide-react';
import { ConversionHistory } from '../features/ratewise/components/ConversionHistory';
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { useCurrencyConverter } from '../features/ratewise/hooks/useCurrencyConverter';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { RateType, CurrencyCode, ConversionHistoryEntry } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

export default function Favorites() {
  const navigate = useNavigate();
  const isTestEnv = import.meta.env.MODE === 'test';
  const [isHydrated, setIsHydrated] = useState(isTestEnv);
  const [rateType, setRateType] = useState<RateType>('spot');
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');

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

  const {
    rates: exchangeRates,
    details,
    isLoading: ratesLoading,
    error: ratesError,
  } = useExchangeRates();

  const {
    favorites,
    history,
    trend,
    toggleFavorite,
    clearAllHistory,
    reconvertFromHistory,
    setFromCurrency,
    setToCurrency,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  const handleReconvert = useCallback(
    (entry: ConversionHistoryEntry) => {
      reconvertFromHistory(entry);
      navigate('/');
    },
    [reconvertFromHistory, navigate],
  );

  const handleFavoriteClick = useCallback(
    (code: CurrencyCode) => {
      setFromCurrency('TWD');
      setToCurrency(code);
      navigate('/');
    },
    [setFromCurrency, setToCurrency, navigate],
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
          <h1 className="text-2xl font-bold text-text mt-4">載入失敗</h1>
          <p className="text-text-muted mt-2 mb-6">無法載入資料，請重試。</p>
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
      {/* Header with Tabs */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex gap-2 bg-surface-soft rounded-xl p-1">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'favorites'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            <Star size={16} />
            常用貨幣
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            <Clock size={16} />
            轉換歷史
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 no-scrollbar">
        {activeTab === 'favorites' ? (
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <div className="bg-surface rounded-xl p-8 text-center border border-border/30">
                <Star className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-bold text-text mb-2">尚無常用貨幣</h2>
                <p className="text-sm text-text-muted mb-4">
                  在單幣別或多幣別頁面中點擊 ⭐ 加入常用貨幣
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold transition hover:bg-primary-hover"
                >
                  前往換算
                </button>
              </div>
            ) : (
              favorites.map((code) => (
                <div
                  key={code}
                  className="w-full flex items-center justify-between p-4 bg-surface rounded-xl border border-border/30 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(code);
                      }}
                      className="hover:scale-110 transition"
                      aria-label={`移除 ${code} 從常用`}
                    >
                      <Star className="text-favorite" size={20} fill="currentColor" />
                    </button>
                    <span className="text-2xl">{CURRENCY_DEFINITIONS[code]?.flag}</span>
                    <button onClick={() => handleFavoriteClick(code)} className="text-left">
                      <div className="font-semibold text-text">{code}</div>
                      <div className="text-xs text-text-muted">
                        {CURRENCY_DEFINITIONS[code]?.name}
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={() => handleFavoriteClick(code)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {trend[code] === 'up' && <span className="text-success text-sm">↑</span>}
                    {trend[code] === 'down' && <span className="text-destructive text-sm">↓</span>}
                    <span className="text-sm font-medium text-text-muted group-hover:text-primary transition">
                      點擊換算 →
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-surface rounded-xl p-8 text-center border border-border/30">
                <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-bold text-text mb-2">尚無轉換記錄</h2>
                <p className="text-sm text-text-muted mb-4">開始使用匯率換算，記錄會自動保存</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold transition hover:bg-primary-hover"
                >
                  前往換算
                </button>
              </div>
            ) : (
              <>
                {/* Clear All Button */}
                <div className="flex justify-end">
                  <button
                    onClick={clearAllHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                    清除全部
                  </button>
                </div>

                {/* History List */}
                <ConversionHistory
                  history={history}
                  onReconvert={handleReconvert}
                  onClearAll={clearAllHistory}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
