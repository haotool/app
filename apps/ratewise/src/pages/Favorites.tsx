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
import { appPageTokens, contentPageTokens } from '../config/design-tokens';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { CurrencyCode, ConversionHistoryEntry } from '../features/ratewise/types';
import { useConverterStore } from '../stores/converterStore';
import { getAllCurrenciesSorted } from './favorites-utils';

export default function Favorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTestEnv = import.meta.env.MODE === 'test';
  const [isHydrated, setIsHydrated] = useState(isTestEnv);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');

  // rateType 共用 converterStore，避免本頁與 RateWise/MultiConverter 之間漂移。
  const rateType = useConverterStore((state) => state.rateType);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration marker
    setIsHydrated(true);
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
  } = useCurrencyConverter({ exchangeRates, details, rateType, mode: 'single' });

  const allCurrencies = getAllCurrenciesSorted(favorites);
  const totalCurrencies = allCurrencies.length;
  const historyCount = history.length;

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      const draggedCode = allCurrencies[result.source.index];
      if (!draggedCode || draggedCode === 'TWD') return;

      // `allCurrencies` 的第 0 筆固定為 TWD，收藏索引需扣除該保留位。
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
          <div className={`${contentPageTokens.article.cardLoose} w-full max-w-lg text-center`}>
            <AlertCircle className="text-destructive mx-auto" size={48} />
            <h1 className="text-2xl font-bold text-text mt-4">{t('errors.loadingFailed')}</h1>
            <p className="text-text-muted mt-2 mb-6">{t('errors.dataLoadFailed')}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={contentPageTokens.buttons.primaryWide}
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
      <div className={`flex-1 ${contentPageTokens.shell}`}>
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start">
          <div className="min-w-0">
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
                      type="button"
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
                      <span className="text-xs font-semibold">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {activeTab === 'favorites' && (
              <section>
                <div className="flex items-center justify-between px-2 mb-3">
                  <div className={contentPageTokens.sectionHeader.row}>
                    <Star className="w-3.5 h-3.5" />
                    <h2 className={contentPageTokens.sectionHeader.eyebrow}>
                      {t('favorites.allCurrencies')}
                    </h2>
                  </div>
                  {favorites.length > 0 && (
                    <span className="text-xs font-medium text-text-muted">
                      {t('favorites.dragToReorder')}
                    </span>
                  )}
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="all-currencies-list">
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`-m-1 space-y-2 rounded-control p-1 transition-colors duration-200 ${
                          snapshot.isDraggingOver ? 'bg-surface-elevated' : ''
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
                                  className={`${contentPageTokens.article.card} flex items-center gap-3 group ${
                                    snapshot.isDragging
                                      ? 'z-50 scale-[1.01] bg-surface shadow-floating ring-1 ring-primary/20'
                                      : 'hover:shadow-soft'
                                  }`}
                                >
                                  {isTWD ? (
                                    <div
                                      className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center"
                                      aria-hidden="true"
                                      data-testid="twd-star-fixed"
                                    >
                                      <Star
                                        className="text-favorite"
                                        size={18}
                                        fill="currentColor"
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-control p-2 transition hover:scale-110 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

                                  {isTWD ? (
                                    <div
                                      className="flex min-h-11 min-w-0 flex-1 cursor-default items-center gap-3"
                                      data-testid="twd-info"
                                    >
                                      <span className="w-8 flex-shrink-0 text-center text-2xl leading-none">
                                        {CURRENCY_DEFINITIONS[code]?.flag}
                                      </span>
                                      <div className="min-w-0 text-left">
                                        <div className="text-sm font-bold">{code}</div>
                                        <div className="text-xs text-text-muted">
                                          {t(`currencies.${code}`) ||
                                            CURRENCY_DEFINITIONS[code]?.name}
                                          <span className="ml-1 text-text-muted">
                                            · {t('multiConverter.baseCurrency')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      {...(provided.dragHandleProps ?? {})}
                                      type="button"
                                      className="flex min-h-11 min-w-0 flex-1 cursor-grab touch-manipulation items-center gap-3 rounded-control text-left active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                      aria-label={t('favorites.dragHandle')}
                                      data-testid={`drag-zone-${code}`}
                                    >
                                      <span className="w-8 flex-shrink-0 text-center text-2xl leading-none">
                                        {CURRENCY_DEFINITIONS[code]?.flag}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="text-sm font-bold">{code}</div>
                                        <div className="text-xs text-text-muted">
                                          {t(`currencies.${code}`) ||
                                            CURRENCY_DEFINITIONS[code]?.name}
                                        </div>
                                      </div>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="mr-[-0.5rem] flex min-h-11 flex-shrink-0 cursor-pointer items-center gap-2 rounded-control px-3 py-2 transition-colors hover:bg-primary/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    onClick={() =>
                                      !snapshot.isDragging && handleFavoriteClick(code)
                                    }
                                    aria-label={`${t('favorites.goToConvert')} ${code}`}
                                  >
                                    <span className="text-xs font-semibold opacity-60 group-hover:opacity-100 group-hover:text-primary transition">
                                      {t('favorites.clickToConvert')}
                                    </span>
                                  </button>
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

            {activeTab === 'history' && (
              <section>
                <div className="flex items-center justify-between px-2 mb-3">
                  <div className={contentPageTokens.sectionHeader.row}>
                    <Clock className="w-3.5 h-3.5" />
                    <h2 className={contentPageTokens.sectionHeader.eyebrow}>
                      {t('favorites.history')}
                    </h2>
                  </div>
                  {historyCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="flex min-h-11 items-center gap-1 rounded-control px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                    >
                      <Trash2 size={12} />
                      {t('common.clearAll')}
                    </button>
                  )}
                </div>

                {historyCount === 0 ? (
                  <div className={`${contentPageTokens.article.cardLoose} text-center`}>
                    <Clock className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
                    <h2 className="text-sm font-bold text-text mb-2">{t('favorites.noHistory')}</h2>
                    <p className="mb-4 text-xs text-text-muted opacity-60">
                      {t('favorites.noHistoryHint')}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className={contentPageTokens.buttons.primary}
                    >
                      {t('favorites.goToConvert')}
                    </button>
                  </div>
                ) : (
                  <ConversionHistory history={history} onReconvert={handleReconvert} />
                )}
              </section>
            )}
          </div>

          <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6">
            <section className={appPageTokens.infoCard}>
              <div className={`${contentPageTokens.sectionHeader.row} mb-0 px-0`}>
                {activeTab === 'favorites' ? (
                  <Star className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span className={contentPageTokens.sectionHeader.eyebrow}>
                  {activeTab === 'favorites' ? t('favorites.title') : t('favorites.history')}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className={appPageTokens.statRow}>
                  <span className={appPageTokens.tinyMeta}>
                    {activeTab === 'favorites'
                      ? t('favorites.allCurrencies')
                      : t('favorites.history')}
                  </span>
                  <span className="text-lg font-semibold text-text">
                    {activeTab === 'favorites' ? totalCurrencies : historyCount}
                  </span>
                </div>
                <div className={appPageTokens.statRow}>
                  <span className={appPageTokens.tinyMeta}>{t('favorites.title')}</span>
                  <span className="text-lg font-semibold text-text">{favorites.length}</span>
                </div>
              </div>
            </section>

            <section className={appPageTokens.infoCard}>
              <p className="text-xs leading-relaxed text-text-muted">
                {activeTab === 'favorites'
                  ? t('favorites.dragToReorder')
                  : historyCount === 0
                    ? t('favorites.noHistoryHint')
                    : t('favorites.clickToConvert')}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className={contentPageTokens.buttons.primaryWide}
                >
                  {t('favorites.goToConvert')}
                </button>

                {activeTab === 'history' && historyCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className={contentPageTokens.buttons.dangerQuiet}
                  >
                    {t('common.clearAll')}
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
const pageSeo = APP_ONLY_PAGE_SEO.favorites;
