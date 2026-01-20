/**
 * Favorites & History Page - ParkKeeper 風格
 *
 * @description 收藏與歷史記錄頁面，採用 ParkKeeper 設計風格
 *              SSOT: 設計來自 Settings.tsx 風格參考
 * @version 2.0.0
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
        <div className="card p-8 max-w-md w-full text-center">
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
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Tab 切換區塊 - 參考 Settings 語言切換風格 */}
        <section className="mb-6">
          <div className="bg-surface-soft rounded-[20px] p-1.5 flex gap-1 relative shadow-inner">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 relative z-10 transition-all duration-200 ease-out ${
                activeTab === 'favorites'
                  ? 'hover:scale-[1.02] active:scale-[0.98]'
                  : 'opacity-60 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {activeTab === 'favorites' && (
                <div className="absolute inset-0 rounded-2xl shadow-sm z-[-1] bg-[rgb(var(--color-surface))]" />
              )}
              <Star size={18} className={activeTab === 'favorites' ? 'text-primary' : ''} />
              <span className="text-[10px] font-bold">常用貨幣</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 relative z-10 transition-all duration-200 ease-out ${
                activeTab === 'history'
                  ? 'hover:scale-[1.02] active:scale-[0.98]'
                  : 'opacity-60 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {activeTab === 'history' && (
                <div className="absolute inset-0 rounded-2xl shadow-sm z-[-1] bg-[rgb(var(--color-surface))]" />
              )}
              <Clock size={18} className={activeTab === 'history' ? 'text-primary' : ''} />
              <span className="text-[10px] font-bold">轉換歷史</span>
            </button>
          </div>
        </section>

        {/* 常用貨幣區塊 */}
        {activeTab === 'favorites' && (
          <section>
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <Star className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">常用貨幣</h3>
            </div>

            {favorites.length === 0 ? (
              <div className="card p-8 text-center">
                <Star className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
                <h2 className="text-sm font-bold text-text mb-2">尚無常用貨幣</h2>
                <p className="text-[10px] text-text-muted mb-4 opacity-60">
                  在單幣別或多幣別頁面中點擊 ⭐ 加入常用貨幣
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs transition hover:bg-primary-hover active:scale-[0.98]"
                >
                  前往換算
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map((code) => (
                  <div
                    key={code}
                    className="card p-4 flex items-center justify-between group hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
                    onClick={() => handleFavoriteClick(code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleFavoriteClick(code);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(code);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            toggleFavorite(code);
                          }
                        }}
                        className="hover:scale-110 transition cursor-pointer"
                        aria-label={`移除 ${code} 從常用`}
                      >
                        <Star className="text-favorite" size={18} fill="currentColor" />
                      </div>
                      <span className="text-2xl">{CURRENCY_DEFINITIONS[code]?.flag}</span>
                      <div>
                        <div className="font-bold text-sm">{code}</div>
                        <div className="text-[10px] opacity-60">
                          {CURRENCY_DEFINITIONS[code]?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend[code] === 'up' && <span className="text-success text-xs">↑</span>}
                      {trend[code] === 'down' && (
                        <span className="text-destructive text-xs">↓</span>
                      )}
                      <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 group-hover:text-primary transition">
                        換算 →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 轉換歷史區塊 */}
        {activeTab === 'history' && (
          <section>
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-2 opacity-40">
                <Clock className="w-3.5 h-3.5" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">轉換歷史</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition font-bold"
                >
                  <Trash2 size={12} />
                  清除全部
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="card p-8 text-center">
                <Clock className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
                <h2 className="text-sm font-bold text-text mb-2">尚無轉換記錄</h2>
                <p className="text-[10px] text-text-muted mb-4 opacity-60">
                  開始使用匯率換算，記錄會自動保存
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs transition hover:bg-primary-hover active:scale-[0.98]"
                >
                  前往換算
                </button>
              </div>
            ) : (
              <ConversionHistory
                history={history}
                onReconvert={handleReconvert}
                onClearAll={clearAllHistory}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
