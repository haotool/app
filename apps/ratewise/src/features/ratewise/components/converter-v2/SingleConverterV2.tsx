/**
 * E3 v2「等值雙列」單幣別換算：兩列對等可編輯、divider 內嵌 swap、rate chip、常駐計算機。
 * 無 from/to 概念，方向由「最後編輯的列」隱式決定。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useMemo, useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import type { SingleConverterProps } from '../SingleConverter';
import type { CurrencyCode, RateType } from '../../types';
import { CURRENCY_DEFINITIONS, DEFAULT_RATE_MODE, DEFAULT_RATE_SOURCE } from '../../constants';
import { formatExchangeRate, formatAmountDisplay } from '../../../../utils/currencyFormatter';
import {
  getUnitExchangeRate,
  type RateTypeAvailability,
} from '../../../../utils/exchangeRateCalculation';
import { ConverterKeypad } from './ConverterKeypad';
import { CurrencyPickerSheet } from './CurrencyPickerSheet';
import { TrendSheet } from './TrendSheet';
import { useConverterTrend } from './useConverterTrend';
import { TrendChartSkeleton } from '../TrendChartSkeleton';

const MiniTrendChart = lazy(() =>
  import('../MiniTrendChart').then((m) => ({ default: m.MiniTrendChart })),
);

// 一次抓滿 sheet 最大範圍（實際回傳受資料源可用天數限制，不足不推估）。
const TREND_FETCH_DAYS = 90;
// sparkline 常態顯示 30 天。
const SPARKLINE_DAYS = 30;

type RowField = 'from' | 'to';

interface CurrencyRowProps {
  field: RowField;
  currency: CurrencyCode;
  amount: string;
  isActive: boolean;
  onOpenPicker: (field: RowField) => void;
  onActivate: (field: RowField) => void;
}

function CurrencyRow({
  field,
  currency,
  amount,
  isActive,
  onOpenPicker,
  onActivate,
}: CurrencyRowProps) {
  const { t } = useTranslation();
  const display = formatAmountDisplay(amount, currency) || '0';

  return (
    <div
      data-testid={`converter-v2-row-${field}`}
      className={`flex items-center gap-3 px-4 py-3 short:py-1.5 transition-colors ${
        isActive ? 'bg-primary/5' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenPicker(field)}
        data-testid={`converter-v2-currency-${field}`}
        aria-label={`${t('converterV2.selectCurrency')} (${currency})`}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-surface-elevated px-3 text-base font-semibold text-text transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span aria-hidden="true">{CURRENCY_DEFINITIONS[currency].flag}</span>
        <span>{currency}</span>
        <svg
          className="w-3.5 h-3.5 text-neutral-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onActivate(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate(field);
          }
        }}
        data-testid={`converter-v2-amount-${field}`}
        aria-label={`${t('converterV2.rowLabel', { code: currency })}: ${display}`}
        aria-pressed={isActive}
        className={`flex-1 min-w-0 min-h-[44px] flex items-center justify-end rounded-xl px-2 text-right font-bold tabular-nums leading-tight cursor-pointer whitespace-nowrap overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-[font-size,color,box-shadow] duration-200 ${
          isActive
            ? 'text-[32px] short:text-[26px] text-text ring-2 ring-primary/40'
            : 'text-[28px] short:text-[22px] text-neutral-text-secondary'
        }`}
      >
        {display}
      </div>
    </div>
  );
}

export const SingleConverterV2 = ({
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRates,
  details,
  rateType,
  rateMode = DEFAULT_RATE_MODE,
  rateTypeAvailability = { spot: true, cash: true } satisfies RateTypeAvailability,
  onFromCurrencyChange,
  onToCurrencyChange,
  onFromAmountChange,
  onToAmountChange,
  onSwapCurrencies,
  onRateTypeChange,
  rateSource = DEFAULT_RATE_SOURCE,
  moneyBoxRate = null,
  exchangeShopCurrency = null,
}: SingleConverterProps) => {
  const { t } = useTranslation();
  const [activeRow, setActiveRow] = useState<RowField>('from');
  const [pickerFor, setPickerFor] = useState<RowField | null>(null);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  // swap 或切列時遞增，強制 keypad remount 重置表達式為活躍列現值。
  const [keypadSession, setKeypadSession] = useState(0);

  const trend = useConverterTrend({
    fromCurrency,
    toCurrency,
    rateSource,
    moneyBoxRate,
    exchangeShopCurrency,
    maxDays: TREND_FETCH_DAYS,
  });
  const sparklineData = useMemo(() => trend.data.slice(-SPARKLINE_DAYS), [trend.data]);
  const sparklineChange = useMemo(() => {
    const first = sparklineData[0]?.rate;
    const last = sparklineData.at(-1)?.rate;
    if (first === undefined || last === undefined || first === 0) return null;
    return ((last - first) / first) * 100;
  }, [sparklineData]);

  const exchangeRate = getUnitExchangeRate(
    fromCurrency,
    toCurrency,
    details,
    rateType,
    rateMode,
    exchangeRates,
    { rateSource, exchangeShopRate: moneyBoxRate },
  );

  const activeAmount = activeRow === 'from' ? fromAmount : toAmount;
  const keypadSeed = (() => {
    const parsed = parseFloat(activeAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  const handleActivateRow = (field: RowField) => {
    if (field === activeRow) return;
    setActiveRow(field);
    setKeypadSession((session) => session + 1);
  };

  const handleKeypadValue = (value: number) => {
    if (activeRow === 'from') {
      onFromAmountChange(value.toString());
    } else {
      onToAmountChange(value.toString());
    }
  };

  const handleSwap = () => {
    onSwapCurrencies();
    setKeypadSession((session) => session + 1);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handlePickCurrency = (code: CurrencyCode) => {
    if (pickerFor === 'from') {
      onFromCurrencyChange(code);
    } else if (pickerFor === 'to') {
      onToCurrencyChange(code);
    }
    setPickerFor(null);
  };

  // rate chip 基準標註：換錢所來源優先，其餘依 cash/spot 誠實標示銀行賣出語意。
  const basisLabel =
    rateSource === 'exchange-shop' && exchangeShopCurrency
      ? t('converterV2.rateBasisExchangeShop')
      : rateType === 'cash'
        ? t('converterV2.rateBasisCash')
        : t('converterV2.rateBasisSpot');

  const handleToggleBasis = () => {
    const nextType: RateType = rateType === 'cash' ? 'spot' : 'cash';
    if (!rateTypeAvailability[nextType]) return;
    onRateTypeChange(nextType);
  };

  return (
    <div className="flex flex-col gap-3 short:gap-2" data-testid="converter-v2">
      {/* 等值雙列：上下緊貼、完全對等，divider 內嵌 32px swap 鈕 */}
      <div className="rounded-2xl border border-border/60 bg-surface overflow-hidden">
        <CurrencyRow
          field="from"
          currency={fromCurrency}
          amount={fromAmount}
          isActive={activeRow === 'from'}
          onOpenPicker={setPickerFor}
          onActivate={handleActivateRow}
        />
        <div className="relative flex items-center px-4" data-testid="converter-v2-divider">
          <div className="h-px flex-1 bg-border/60" />
          <button
            type="button"
            onClick={handleSwap}
            data-testid="converter-v2-swap"
            aria-label={t('converterV2.swapCurrencies')}
            className="mx-2 -my-1 flex h-11 w-11 shrink-0 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
          >
            {/* 視覺 32px 圓形，觸控熱區 44px；白字表面錨定 primary-strong 保 AA。 */}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-strong text-white transition-transform active:scale-95">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </span>
          </button>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <CurrencyRow
          field="to"
          currency={toCurrency}
          amount={toAmount}
          isActive={activeRow === 'to'}
          onOpenPicker={setPickerFor}
          onActivate={handleActivateRow}
        />
      </div>

      {/* rate chip：一行匯率資訊，tap 切換現金／即期 */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleToggleBasis}
          data-testid="converter-v2-rate-chip"
          aria-label={t('converterV2.toggleRateBasis')}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-surface-elevated px-4 text-sm font-semibold tabular-nums text-neutral-text-secondary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span className="text-text">
            1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
          </span>
          <span aria-hidden="true">・</span>
          <span className="text-primary">{basisLabel}</span>
        </button>
      </div>

      {/* sparkline：72px 常態趨勢＋漲跌 chip，tap 展開 65vh 趨勢 sheet */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsTrendOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsTrendOpen(true);
          }
        }}
        data-testid="converter-v2-sparkline"
        aria-label={t('converterV2.trendOpen')}
        className="w-full cursor-pointer rounded-2xl border border-border/60 bg-surface px-3 pt-2 pb-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="flex min-h-[24px] items-center justify-between">
          <span className="text-xs text-neutral-text-secondary">
            {t('converterV2.trendTitle', { from: fromCurrency, to: toCurrency })}
          </span>
          {sparklineChange !== null && (
            <span
              data-testid="converter-v2-trend-change"
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                sparklineChange >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              <span aria-hidden="true">{sparklineChange >= 0 ? '▲' : '▼'}</span>
              {Math.abs(sparklineChange).toFixed(2)}%
            </span>
          )}
        </div>
        <div className="h-[72px] short:h-[48px] pointer-events-none">
          {sparklineData.length >= 2 ? (
            <Suspense fallback={<TrendChartSkeleton />}>
              <MiniTrendChart data={sparklineData} currencyCode={toCurrency} />
            </Suspense>
          ) : (
            <TrendChartSkeleton />
          )}
        </div>
      </div>

      {/* 常駐計算機：輸入目標＝活躍列；key remount 重置種子，掛載為唯讀、僅實際按鍵才回寫。
          實體鍵盤（#587）於任一 sheet 開啟時停用，避免與 sheet 內搜尋、Esc 語意衝突。 */}
      <ConverterKeypad
        key={`${activeRow}-${keypadSession}`}
        initialValue={keypadSeed}
        onValueChange={handleKeypadValue}
        keyboardEnabled={pickerFor === null && !isTrendOpen}
      />

      <CurrencyPickerSheet
        isOpen={pickerFor !== null}
        selected={pickerFor === 'to' ? toCurrency : fromCurrency}
        onSelect={handlePickCurrency}
        onClose={() => setPickerFor(null)}
      />

      <TrendSheet
        isOpen={isTrendOpen}
        onClose={() => setIsTrendOpen(false)}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        data={trend.data}
        basisLabel={basisLabel}
      />
    </div>
  );
};
