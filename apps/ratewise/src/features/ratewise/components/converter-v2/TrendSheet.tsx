/**
 * E3 v2 趨勢 bottom sheet：65vh、7D/30D/90D 切換、min/max 標記、長按 crosshair（chart 內建）。
 * 基準誠實標註：資料不足期間不推估，顯示實際可用天數。
 * E1 收斂：殼層改用 BottomSheet primitive、範圍切換改用 SegmentedControl（radiogroup 語意）。
 * E8 缺口 8：基準切換（現金／即期，值-標籤由父層 resolveTrendSeries 同源）＋幣別攻略連結。
 * @see .claude/prds/ratewise-e1-design-system-design.md
 * @see .claude/prds/converter-v2-completeness-design.md
 */

import { useMemo, useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BottomSheet } from '../../../../components/BottomSheet';
import { SegmentedControl } from '../../../../components/SegmentedControl';
import { formatExchangeRate } from '../../../../utils/currencyFormatter';
import type { MiniTrendDataPoint } from '../MiniTrendChart';
import { TrendChartSkeleton } from '../TrendChartSkeleton';
import type { CurrencyCode, RateType } from '../../types';

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
  /** 已排序（舊→新）的完整趨勢資料（跟隨 sheet 選擇的基準）。 */
  data: MiniTrendDataPoint[];
  basisLabel: string;
  /** sheet 內選擇的趨勢基準（E8 缺口 8）；實際採用序列可能誠實回落，標註以 basisLabel 為準。 */
  basis: RateType;
  onBasisChange: (basis: RateType) => void;
  /** 換錢所來源無現金／即期語意，隱藏基準切換。 */
  showBasisToggle: boolean;
  /** 幣別攻略落地頁路徑（seo-paths SSOT 判斷存在才提供）；null 不渲染連結。 */
  guidePath: string | null;
  guideCode: CurrencyCode;
}

export function TrendSheet({
  isOpen,
  onClose,
  fromCurrency,
  toCurrency,
  data,
  basisLabel,
  basis,
  onBasisChange,
  showBasisToggle,
  guidePath,
  guideCode,
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
      {/* 7D/30D/90D 切換（radiogroup 語意）；aria 名稱與 dialog 標題區分，避免重複可及名稱 */}
      <SegmentedControl
        value={range}
        onChange={setRange}
        ariaLabel={t('converterV2.trendRangeLabel')}
        className="mx-5"
        options={(Object.keys(RANGE_DAYS) as TrendRange[]).map((key) => ({
          value: key,
          label: rangeLabels[key],
          testId: `converter-v2-trend-range-${key}`,
        }))}
      />

      {/* min/max 標記＋基準切換（E8 缺口 8）：窄視口避免同列擠壓，min/max 收縮截尾、切換鈕不縮。 */}
      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-1 text-xs tabular-nums">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          {stats ? (
            <>
              <span className="whitespace-nowrap text-neutral-text-secondary">
                {t('converterV2.trendMin')}{' '}
                <span className="font-semibold text-danger">
                  {formatExchangeRate(stats.min.rate)}
                </span>{' '}
                ({stats.min.date.slice(5, 10)})
              </span>
              <span className="whitespace-nowrap text-neutral-text-secondary">
                {t('converterV2.trendMax')}{' '}
                <span className="font-semibold text-success">
                  {formatExchangeRate(stats.max.rate)}
                </span>{' '}
                ({stats.max.date.slice(5, 10)})
              </span>
            </>
          ) : (
            <span className="text-neutral-text-secondary">{t('converterV2.trendEmpty')}</span>
          )}
        </div>
        {/* 基準切換：值-標籤同步由父層 resolveTrendSeries 保證（即期缺失誠實回落現金）。 */}
        {showBasisToggle && (
          <div className="shrink-0">
            <SegmentedControl
              value={basis}
              onChange={onBasisChange}
              ariaLabel={t('converterV2.trendBasisSwitchLabel')}
              size="sm"
              options={[
                {
                  value: 'cash',
                  label: t('singleConverter.cashRate'),
                  testId: 'converter-v2-trend-basis-cash',
                },
                {
                  value: 'spot',
                  label: t('singleConverter.spotRate'),
                  testId: 'converter-v2-trend-basis-spot',
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* 主圖表：長按 crosshair 由 lightweight-charts trackingMode 內建；
          basisLabel 傳入後圖角常駐標註＋hover/touch tooltip 顯示基準與數據點值（E8 缺口 8）。 */}
      <div className="flex-1 min-h-0 px-3">
        {displayed.length >= 2 ? (
          <Suspense fallback={<TrendChartSkeleton />}>
            <MiniTrendChart data={displayed} currencyCode={toCurrency} basisLabel={basisLabel} />
          </Suspense>
        ) : (
          <TrendChartSkeleton />
        )}
      </div>

      {/* 基準誠實標註＋幣別攻略連結（E8 缺口 8：pair 落地頁存在才顯示） */}
      <div className="px-5 pb-6 pt-2 text-center text-2xs text-neutral-text-muted">
        {guidePath && (
          <Link
            to={guidePath}
            onClick={onClose}
            data-testid="converter-v2-trend-guide-link"
            className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-primary-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
          >
            {t('converterV2.trendGuideLink', { code: guideCode })}
          </Link>
        )}
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
