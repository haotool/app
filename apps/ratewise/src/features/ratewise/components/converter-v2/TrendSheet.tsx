/**
 * E3 v2 趨勢 bottom sheet：65vh、7D/30D/90D 切換、min/max 標記、長按 crosshair（chart 內建）。
 * 基準誠實標註：資料不足期間不推估，顯示實際可用天數。
 * E1 收斂：殼層改用 BottomSheet primitive、範圍切換改用 SegmentedControl（radiogroup 語意）。
 * @see .claude/prds/ratewise-e1-design-system-design.md
 */

import { useMemo, useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../../../components/BottomSheet';
import { SegmentedControl } from '../../../../components/SegmentedControl';
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

  const rangeLabels: Record<TrendRange, string> = {
    '7d': t('converterV2.range7d'),
    '30d': t('converterV2.range30d'),
    '90d': t('converterV2.range90d'),
  };

  const isDataShort = displayed.length > 0 && data.length < RANGE_DAYS[range];
  const title = t('converterV2.trendTitle', { from: fromCurrency, to: toCurrency });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={title}
      title={title}
      closeLabel={t('converterV2.close')}
      size="fixed"
      testId="converter-v2-trend-sheet"
    >
      {/* 7D/30D/90D 切換（radiogroup 語意） */}
      <SegmentedControl
        value={range}
        onChange={setRange}
        ariaLabel={title}
        className="mx-5"
        options={(Object.keys(RANGE_DAYS) as TrendRange[]).map((key) => ({
          value: key,
          label: rangeLabels[key],
          testId: `converter-v2-trend-range-${key}`,
        }))}
      />

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
      <div className="px-5 pb-6 pt-2 text-center text-2xs text-neutral-text-muted">
        <div>{t('converterV2.trendBasisNote', { basis: basisLabel })}</div>
        {isDataShort && (
          <div data-testid="converter-v2-trend-honest-note">
            {t('converterV2.trendHonestRange', { days: data.length })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
