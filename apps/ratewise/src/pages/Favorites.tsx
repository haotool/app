/**
 * Favorites & History Page - ParkKeeper Design Style
 * 收藏與歷史記錄頁面 - ParkKeeper 設計風格
 *
 * @description Favorites and conversion history page with ParkKeeper design style.
 *              All currencies support drag-and-drop with smooth spring animations.
 *              Dragging a non-favorite currency automatically adds it to favorites.
 *              收藏與歷史記錄頁面，採用 ParkKeeper 設計風格。
 *              所有貨幣支援拖曳，具有流暢的彈簧動畫。
 *              拖曳非收藏貨幣時自動加入收藏。
 * @version 3.0.0
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
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, Star, Clock, Trash2 } from 'lucide-react';
import { segmentedSwitch, transitions } from '../config/animations';
import { ConversionHistory } from '../features/ratewise/components/ConversionHistory';
import { SEOHelmet } from '../components/SEOHelmet';
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { useCurrencyConverter } from '../features/ratewise/hooks/useCurrencyConverter';
import { FavoritesSkeleton } from '../components/SkeletonLoader';
import { APP_ONLY_PAGE_SEO } from '../config/seo-metadata';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { RateType, CurrencyCode, ConversionHistoryEntry } from '../features/ratewise/types';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';
import { getAllCurrenciesSorted } from './favorites-utils';

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
    toggleFavorite,
    reorderFavorites,
    clearAllHistory,
    reconvertFromHistory,
    setFromCurrency,
    setToCurrency,
  } = useCurrencyConverter({ exchangeRates, details, rateType });

  /** 取得所有貨幣列表（已收藏 + 未收藏） */
  const allCurrencies = getAllCurrenciesSorted(favorites);

  /**
   * 處理拖曳結束事件
   *
   * allCurrencies[0] 永遠是 TWD（isDragDisabled），
   * 故 source/destination.index >= 1，需 -1 轉換成 favorites 陣列的索引。
   *
   * - 拖曳已收藏貨幣：重新排序
   * - 拖曳未收藏貨幣：自動加入收藏並置於目標位置
   */
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      const draggedCode = allCurrencies[result.source.index];
      // TWD 不可拖曳（isDragDisabled），此處為防禦性檢查
      if (!draggedCode || draggedCode === 'TWD') return;

      // allCurrencies 中 index 0 = TWD，favorites 索引 = allCurrencies 索引 - 1
      const destFavIndex = Math.max(0, result.destination.index - 1);

      const isFav = favorites.includes(draggedCode);
      let newFavorites: CurrencyCode[];

      if (isFav) {
        // 已收藏：重新排序
        const favIndex = favorites.indexOf(draggedCode);
        newFavorites = [...favorites];
        newFavorites.splice(favIndex, 1);
        newFavorites.splice(Math.min(destFavIndex, newFavorites.length), 0, draggedCode);
      } else {
        // 未收藏：拖曳即加入收藏
        newFavorites = [...favorites];
        newFavorites.splice(Math.min(destFavIndex, newFavorites.length), 0, draggedCode);
      }

      reorderFavorites(newFavorites);
    },
    [allCurrencies, favorites, reorderFavorites],
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

  // SSG Fix: SEOHelmet 必須在所有 early return 之前，確保 SSG 時能正確渲染 meta tags
  // @see https://vite-react-ssg.netlify.app/docs/components — Head 獨立於渲染狀態
  const seoHelmet = (
    <SEOHelmet
      title={pageSeo.title}
      description={pageSeo.description}
      pathname={pageSeo.pathname}
      robots={pageSeo.robots}
    />
  );

  if (!isHydrated) {
    return (
      <>
        {seoHelmet}
        <h1 className="sr-only">{pageSeo.title}</h1>
        <FavoritesSkeleton />
      </>
    );
  }

  if (ratesLoading && !isTestEnv) {
    return (
      <>
        {seoHelmet}
        <h1 className="sr-only">{pageSeo.title}</h1>
        <FavoritesSkeleton />
      </>
    );
  }

  if (ratesError) {
    return (
      <>
        {seoHelmet}
        <div className="flex-1 flex items-center justify-center p-4">
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
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {seoHelmet}
      <h1 className="sr-only">{pageSeo.title}</h1>
      <div className="flex-1 px-3 sm:px-5 py-6 max-w-md mx-auto w-full">
        {/* Tab 切換區塊 - Segmented Switch SSOT 動畫 */}
        <section className="mb-6">
          <div className={segmentedSwitch.containerClass}>
            {(
              [
                { value: 'favorites' as const, icon: Star, label: t('favorites.title') },
                { value: 'history' as const, icon: Clock, label: t('favorites.history') },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.value;
              const TabIcon = tab.icon;
              return (
                <motion.button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  whileHover={{ ...segmentedSwitch.item.whileHover, opacity: 1 }}
                  whileTap={segmentedSwitch.item.whileTap}
                  animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
                  transition={transitions.default}
                  className={`${segmentedSwitch.itemBaseClass} flex-col gap-1`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.div
                      layoutId="favorites-tab-indicator"
                      className={segmentedSwitch.indicatorClass}
                      transition={segmentedSwitch.indicator}
                    />
                  )}
                  <motion.div
                    animate={{ scale: isActive ? segmentedSwitch.activeIconScale : 1 }}
                    transition={transitions.default}
                  >
                    <TabIcon size={18} className={isActive ? 'text-primary' : ''} />
                  </motion.div>
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </motion.button>
              );
            })}
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

            {/* 所有貨幣統一拖曳區域 */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="all-currencies-list">
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 transition-colors duration-200 rounded-xl p-1 -m-1 ${
                      snapshot.isDraggingOver ? 'bg-primary/5' : ''
                    }`}
                  >
                    {allCurrencies.map((code, index) => {
                      const isTWD = code === 'TWD';
                      const isFavorite = favorites.includes(code);
                      return (
                        <Draggable
                          key={code}
                          draggableId={code}
                          index={index}
                          isDragDisabled={isTWD}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={provided.draggableProps.style}
                              data-testid={`currency-row-${code}`}
                              className={`card p-4 flex items-center gap-3 group ${
                                snapshot.isDragging
                                  ? 'shadow-2xl scale-[1.02] bg-surface ring-2 ring-primary/40 z-50'
                                  : 'hover:shadow-md'
                              }`}
                            >
                              {/* 左側：星星欄位
                               *
                               * TWD  → 固定實心星（裝飾用，非互動元素）
                               * 其他 → 可切換收藏的按鈕
                               */}
                              {isTWD ? (
                                <div
                                  className="w-7 flex-shrink-0 flex items-center justify-center"
                                  aria-hidden="true"
                                  data-testid="twd-star-fixed"
                                >
                                  <Star className="text-favorite" size={18} fill="currentColor" />
                                </div>
                              ) : (
                                <button
                                  className="w-7 flex-shrink-0 flex items-center justify-center p-0.5 hover:scale-110 transition"
                                  onClick={() => toggleFavorite(code)}
                                  aria-label={
                                    isFavorite
                                      ? `${t('favorites.removeFavorite')} ${code}`
                                      : `${t('favorites.addFavorite')} ${code}`
                                  }
                                  data-testid={`star-toggle-${code}`}
                                >
                                  <Star
                                    className={
                                      isFavorite
                                        ? 'text-favorite'
                                        : 'text-text-muted opacity-30 hover:opacity-60 hover:text-favorite transition'
                                    }
                                    size={18}
                                    fill={isFavorite ? 'currentColor' : 'none'}
                                  />
                                </button>
                              )}

                              {/* 中間：貨幣資訊 + 拖曳區域
                               *
                               * TWD  → cursor-default（不可拖）
                               * 其他 → dragHandleProps 套用於此區塊
                               *        使用者在 [幣別名稱] 與 [換算] 之間的任意空白處拖曳
                               *
                               * IMPORTANT: 移除 touch-none 以允許頁面滾動
                               * @hello-pangea/dnd 會自行處理觸控事件的區分（滾動 vs 拖曳）
                               * 使用 touch-manipulation 啟用瀏覽器最佳化觸控處理
                               *
                               * @see https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/how-we-use-dom-events.md
                               */}
                              <div
                                {...(isTWD ? {} : provided.dragHandleProps)}
                                className={`flex items-center gap-3 flex-1 min-w-0 ${
                                  isTWD
                                    ? 'cursor-default'
                                    : 'cursor-grab active:cursor-grabbing touch-manipulation'
                                }`}
                                aria-label={isTWD ? undefined : t('favorites.dragHandle')}
                                data-testid={isTWD ? 'twd-info' : `drag-zone-${code}`}
                              >
                                {/* 國旗 */}
                                <span className="text-2xl w-8 text-center leading-none flex-shrink-0">
                                  {CURRENCY_DEFINITIONS[code]?.flag}
                                </span>
                                {/* 幣別名稱 */}
                                <div className="min-w-0">
                                  <div className="font-bold text-sm">{code}</div>
                                  <div className="text-[10px] opacity-60">
                                    {t(`currencies.${code}`) || CURRENCY_DEFINITIONS[code]?.name}
                                    {isTWD && (
                                      <span className="ml-1 opacity-50">
                                        · {t('favorites.baseCurrency') || '基準幣'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 右側：換算按鈕 → 進入單幣別換算頁 */}
                              <div
                                className="flex items-center gap-2 cursor-pointer px-2 py-1 -mr-2 rounded-lg hover:bg-primary/10 active:scale-[0.97] transition flex-shrink-0"
                                onClick={() => !snapshot.isDragging && handleFavoriteClick(code)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') handleFavoriteClick(code);
                                }}
                                aria-label={`${t('favorites.goToConvert')} ${code}`}
                              >
                                <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 group-hover:text-primary transition">
                                  {t('favorites.clickToConvert')}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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
const pageSeo = APP_ONLY_PAGE_SEO.favorites;
