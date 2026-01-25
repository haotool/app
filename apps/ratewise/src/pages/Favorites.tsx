/**
 * Favorites & History Page - ParkKeeper Design Style
 * 收藏與歷史記錄頁面 - ParkKeeper 設計風格
 *
 * @description Favorites and conversion history page with ParkKeeper design style.
 *              Supports drag-and-drop reordering for favorite currencies using @hello-pangea/dnd.
 *              All currencies are displayed in a unified list with favorites at the top.
 *              收藏與歷史記錄頁面，採用 ParkKeeper 設計風格。
 *              支援拖曳排序收藏貨幣（@hello-pangea/dnd）。
 *              所有幣別以統一列表顯示，收藏在最上方。
 * @version 2.2.0
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { AlertCircle, RefreshCw, Star, Clock, Trash2, GripVertical } from 'lucide-react';
import { ConversionHistory } from '../features/ratewise/components/ConversionHistory';
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { useCurrencyConverter } from '../features/ratewise/hooks/useCurrencyConverter';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { RateType, CurrencyCode, ConversionHistoryEntry } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

/**
 * Get all available currency codes sorted: favorites first, then rest alphabetically
 * 取得所有可用幣別代碼並排序：收藏優先，其餘按字母順序
 *
 * @param favorites - Array of favorite currency codes / 收藏幣別代碼陣列
 * @returns Sorted array of currency codes / 排序後的幣別代碼陣列
 */
function getAllCurrenciesSorted(favorites: CurrencyCode[]): CurrencyCode[] {
  const allCodes = Object.keys(CURRENCY_DEFINITIONS).filter(
    (code) => code !== 'TWD',
  ) as CurrencyCode[];
  const favSet = new Set(favorites);

  // Favorites in their saved order, then non-favorites alphabetically
  const nonFavorites = allCodes.filter((code) => !favSet.has(code)).sort();
  return [...favorites, ...nonFavorites];
}

export default function Favorites() {
  const { t } = useTranslation();
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
    reorderFavorites,
    clearAllHistory,
    reconvertFromHistory,
    setFromCurrency,
    setToCurrency,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  /** 處理拖曳結束事件 */
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      const newOrder = Array.from(favorites);
      const [removed] = newOrder.splice(result.source.index, 1);

      // 確保移除的元素存在
      if (!removed) return;

      newOrder.splice(result.destination.index, 0, removed);
      reorderFavorites(newOrder);
    },
    [favorites, reorderFavorites],
  );

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
          <h1 className="text-2xl font-bold text-text mt-4">{t('errors.loadingFailed')}</h1>
          <p className="text-text-muted mt-2 mb-6">{t('errors.dataLoadFailed')}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw size={18} />
            {t('errors.reload')}
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
              <span className="text-[10px] font-bold">{t('favorites.title')}</span>
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
              <span className="text-[10px] font-bold">{t('favorites.history')}</span>
            </button>
          </div>
        </section>

        {/* 所有貨幣區塊 - 收藏在上方，支援拖曳排序 */}
        {activeTab === 'favorites' && (
          <section>
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-2 opacity-40">
                <Star className="w-3.5 h-3.5" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {t('favorites.allCurrencies')}
                </h3>
              </div>
              {favorites.length > 0 && (
                <span className="text-[10px] opacity-40 font-medium">
                  {t('favorites.dragToReorder')}
                </span>
              )}
            </div>

            {/* Favorites Section - Draggable */}
            {favorites.length > 0 && (
              <div className="mb-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="favorites-list">
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 transition-colors duration-200 rounded-xl ${
                          snapshot.isDraggingOver ? 'bg-primary/5' : ''
                        }`}
                      >
                        {favorites.map((code, index) => (
                          <Draggable key={code} draggableId={code} index={index}>
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`card p-4 flex items-center justify-between group transition-all duration-200 ${
                                  snapshot.isDragging
                                    ? 'shadow-lg scale-[1.02] bg-surface ring-2 ring-primary/30'
                                    : 'hover:shadow-md cursor-pointer active:scale-[0.99]'
                                }`}
                                onClick={() => !snapshot.isDragging && handleFavoriteClick(code)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') handleFavoriteClick(code);
                                }}
                              >
                                {/* 拖曳手柄 */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="mr-2 cursor-grab active:cursor-grabbing touch-none"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={t('favorites.dragHandle')}
                                >
                                  <GripVertical
                                    size={16}
                                    className="text-text-muted opacity-40 group-hover:opacity-70 transition"
                                  />
                                </div>

                                <div className="flex items-center gap-3 flex-1">
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
                                    aria-label={`${t('favorites.removeFavorite')} ${code}`}
                                  >
                                    <Star className="text-favorite" size={18} fill="currentColor" />
                                  </div>
                                  <span className="text-2xl">
                                    {CURRENCY_DEFINITIONS[code]?.flag}
                                  </span>
                                  <div>
                                    <div className="font-bold text-sm">{code}</div>
                                    <div className="text-[10px] opacity-60">
                                      {t(`currencies.${code}`) || CURRENCY_DEFINITIONS[code]?.name}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {trend[code] === 'up' && (
                                    <span className="text-success text-xs">↑</span>
                                  )}
                                  {trend[code] === 'down' && (
                                    <span className="text-destructive text-xs">↓</span>
                                  )}
                                  <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 group-hover:text-primary transition">
                                    {t('favorites.clickToConvert')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            {/* All Other Currencies Section */}
            <div className="space-y-2">
              {getAllCurrenciesSorted(favorites)
                .filter((code) => !favorites.includes(code))
                .map((code) => (
                  <div
                    key={code}
                    className="card p-4 flex items-center justify-between group transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.99]"
                    onClick={() => handleFavoriteClick(code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleFavoriteClick(code);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
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
                        aria-label={`${t('favorites.addFavorite')} ${code}`}
                      >
                        <Star
                          className="text-text-muted opacity-30 hover:opacity-60 hover:text-favorite transition"
                          size={18}
                        />
                      </div>
                      <span className="text-2xl">{CURRENCY_DEFINITIONS[code]?.flag}</span>
                      <div>
                        <div className="font-bold text-sm">{code}</div>
                        <div className="text-[10px] opacity-60">
                          {t(`currencies.${code}`) || CURRENCY_DEFINITIONS[code]?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {trend[code] === 'up' && <span className="text-success text-xs">↑</span>}
                      {trend[code] === 'down' && (
                        <span className="text-destructive text-xs">↓</span>
                      )}
                      <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 group-hover:text-primary transition">
                        {t('favorites.clickToConvert')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 轉換歷史區塊 */}
        {activeTab === 'history' && (
          <section>
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-2 opacity-40">
                <Clock className="w-3.5 h-3.5" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {t('favorites.history')}
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition font-bold"
                >
                  <Trash2 size={12} />
                  {t('common.clearAll')}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="card p-8 text-center">
                <Clock className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
                <h2 className="text-sm font-bold text-text mb-2">{t('favorites.noHistory')}</h2>
                <p className="text-[10px] text-text-muted mb-4 opacity-60">
                  {t('favorites.noHistoryHint')}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs transition hover:bg-primary-hover active:scale-[0.98]"
                >
                  {t('favorites.goToConvert')}
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
