/**
 * E3 v2 趨勢 bottom sheet：65vh、7D/30D/90D 切換、min/max 標記、長按 crosshair（chart 內建）。
 * 基準誠實標註：資料不足期間不推估，顯示實際可用天數。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useMemo, useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transitions } from '../../../../config/animations';
import { useBodyScrollLock } from '../../../calculator/hooks/useBodyScrollLock';
import { formatExchangeRate } from '../../../../utils/currencyFormatter';
import type { MiniTrendDataPoint } from '../MiniTrendChart';
import { TrendChartSkeleton } from '../TrendChartSkeleton';
import type { CurrencyCode } from '../../types';

const MiniTrendChart = lazy(() =>
  import('../MiniTrendChart').then((m) => ({ default: m.MiniTrendChart })),
);

type TrendRange = '7d' | '30d' | '90d';

const RANGE_DAYS: Record<TrendRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

export interface TrendSheetProps {
  isOpen: boolean;
  onClose: () => void;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  /** 已排序（舊→新）的完整趨勢資料。 */
  data: MiniTrendDataPoint[];
  basisLabel: string;
}

export function TrendSheet({
  isOpen,
  onClose,
  fromCurrency,
  toCurrency,
  data,
  basisLabel,
}: TrendSheetProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<TrendRange>('30d');
  useBodyScrollLock(isOpen);

  const displayed = useMemo(() => data.slice(-RANGE_DAYS[range]), [data, range]);

  const stats = useMemo(() => {
    const first = displayed[0];
    if (!first) return null;
    let min = first;
    let max = first;
    for (const point of displayed) {
      if (point.rate < min.rate) min = point;
      if (point.rate > max.rate) max = point;
    }
    return { min, max };
  }, [displayed]);

  if (typeof document === 'undefined') {
    return null;
  }

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number } },
  ) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  const rangeLabels: Record<TrendRange, string> = {
    '7d': t('converterV2.range7d'),
    '30d': t('converterV2.range30d'),
    '90d': t('converterV2.range90d'),
  };

  const isDataShort = displayed.length > 0 && data.length < RANGE_DAYS[range];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 h-[65vh] bg-surface rounded-t-3xl shadow-2xl flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={transitions.keyboardSheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label={t('converterV2.trendTitle', { from: fromCurrency, to: toCurrency })}
            data-testid="converter-v2-trend-sheet"
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-neutral-darker rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-lg font-semibold text-neutral-text">
                {t('converterV2.trendTitle', { from: fromCurrency, to: toCurrency })}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center text-neutral-text-muted hover:text-neutral-text-secondary transition-colors"
                aria-label={t('converterV2.close')}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 7D/30D/90D 切換 */}
            <div
              className="mx-5 grid grid-cols-3 gap-1 rounded-xl bg-surface-elevated p-1"
              role="group"
              aria-label={t('converterV2.trendTitle', { from: fromCurrency, to: toCurrency })}
            >
              {(Object.keys(RANGE_DAYS) as TrendRange[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  aria-pressed={range === key}
                  data-testid={`converter-v2-trend-range-${key}`}
                  className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
                    range === key
                      ? 'bg-primary text-white'
                      : 'text-neutral-text-secondary hover:bg-primary/10'
                  }`}
                >
                  {rangeLabels[key]}
                </button>
              ))}
            </div>

            {/* min/max 標記 */}
            <div className="flex items-center gap-3 px-5 pt-3 pb-1 text-xs tabular-nums">
              {stats ? (
                <>
                  <span className="text-neutral-text-secondary">
                    {t('converterV2.trendMin')}{' '}
                    <span className="font-semibold text-danger">
                      {formatExchangeRate(stats.min.rate)}
                    </span>{' '}
                    ({stats.min.date.slice(5)})
                  </span>
                  <span className="text-neutral-text-secondary">
                    {t('converterV2.trendMax')}{' '}
                    <span className="font-semibold text-success">
                      {formatExchangeRate(stats.max.rate)}
                    </span>{' '}
                    ({stats.max.date.slice(5)})
                  </span>
                </>
              ) : (
                <span className="text-neutral-text-secondary">{t('converterV2.trendEmpty')}</span>
              )}
            </div>

            {/* 主圖表：長按 crosshair 由 lightweight-charts trackingMode 內建 */}
            <div className="flex-1 min-h-0 px-3">
              {displayed.length >= 2 ? (
                <Suspense fallback={<TrendChartSkeleton />}>
                  <MiniTrendChart data={displayed} currencyCode={toCurrency} />
                </Suspense>
              ) : (
                <TrendChartSkeleton />
              )}
            </div>

            {/* 基準誠實標註 */}
            <div className="px-5 pb-6 pt-2 text-center text-[11px] text-neutral-text-muted">
              <div>{t('converterV2.trendBasisNote', { basis: basisLabel })}</div>
              {isDataShort && (
                <div data-testid="converter-v2-trend-honest-note">
                  {t('converterV2.trendHonestRange', { days: data.length })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
