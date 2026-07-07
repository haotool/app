/**
 * E3 v2「等值雙列」單幣別換算：兩列對等可編輯、divider 內嵌 swap、rate chip、常駐計算機。
 * 無 from/to 概念，方向由「最後編輯的列」隱式決定。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  lazy,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import type { SingleConverterProps } from '../SingleConverter';
import type { CurrencyCode, RateType } from '../../types';
import { isCurrencyPagePath, isReverseCurrencyPagePath } from '../../../../config/seo-paths';
import {
  CURRENCY_DEFINITIONS,
  CURRENCY_QUICK_AMOUNTS,
  DEFAULT_RATE_MODE,
  DEFAULT_RATE_SOURCE,
} from '../../constants';
import { formatExchangeRate, formatAmountDisplay } from '../../../../utils/currencyFormatter';
import {
  getReciprocalExchangeRate,
  getUnitExchangeRateWithBasis,
  type RateTypeAvailability,
  type UnitRateBasis,
} from '../../../../utils/exchangeRateCalculation';
import { copyToClipboard, formatConversionForCopy } from '../../../../utils/clipboard';
import { useToast } from '../../../../components/Toast';
import { lightHaptic } from '../../../calculator/utils/haptics';
import { RateTypeTooltip } from '../../../../components/RateTypeTooltip';
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

// #590：金額自適應縮放下限；低於此值代表版面異常，寧可截尾也不再縮小到不可讀。
const MIN_AMOUNT_FIT_SCALE = 0.5;
// 縮放抖動容差：避免量測捨入造成 setState 往返。
const FIT_SCALE_EPSILON = 0.005;
// E8 缺口 6：長按複製觸發時長，對齊 keypad 長按清空與 v1 歷史長按慣例。
const LONG_PRESS_COPY_MS = 500;
// E8 缺口 2：輸入停頓多久視為換算 settle，寫入歷史記錄。
const HISTORY_SETTLE_MS = 2000;

interface CurrencyRowProps {
  field: RowField;
  currency: CurrencyCode;
  amount: string;
  isActive: boolean;
  onOpenPicker: (field: RowField) => void;
  onActivate: (field: RowField) => void;
  /** 長按（或桌面右鍵）金額列時複製換算結果（E8 缺口 6）。 */
  onCopyResult: () => void;
  /** 計算進行中的迷你運算式（E8 缺口 5）；僅活躍列顯示，overlay 定位不佔版面高度。 */
  liveExpression?: string | null;
}

function CurrencyRow({
  field,
  currency,
  amount,
  isActive,
  onOpenPicker,
  onActivate,
  onCopyResult,
  liveExpression = null,
}: CurrencyRowProps) {
  const { t } = useTranslation();
  const display = formatAmountDisplay(amount, currency) || '0';
  const amountBoxRef = useRef<HTMLDivElement>(null);
  const amountTextRef = useRef<HTMLSpanElement>(null);
  const [fitScale, setFitScale] = useState(1);
  // 長按複製（S1 transient activation 結構）：500ms 計時器只「標記意圖」與視覺回饋；
  // 實際 writeText 於 pointerup／contextmenu 使用者手勢同步 context 內執行，
  // 避免 setTimeout callback 脫離 user activation 導致 Safari/iOS 剪貼簿權限失效。
  const copyLongPressTimerRef = useRef<number | null>(null);
  // 意圖已標記（500ms 到達）；沿用至 click 抑制活化切列。
  const copyArmedRef = useRef(false);
  // 本次手勢已執行複製；防 pointerup 與 contextmenu 雙路徑重複複製。
  const copyCommittedRef = useRef(false);
  const [isCopyArmed, setIsCopyArmed] = useState(false);

  const clearCopyLongPressTimer = () => {
    if (copyLongPressTimerRef.current !== null) {
      window.clearTimeout(copyLongPressTimerRef.current);
      copyLongPressTimerRef.current = null;
    }
  };

  const handleCopyPressStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // 僅主鍵／觸控啟動長按計時；右鍵走 contextmenu 等效路徑。
    if (e.button !== 0) return;
    copyArmedRef.current = false;
    copyCommittedRef.current = false;
    clearCopyLongPressTimer();
    copyLongPressTimerRef.current = window.setTimeout(() => {
      copyArmedRef.current = true;
      setIsCopyArmed(true);
    }, LONG_PRESS_COPY_MS);
  };

  // pointerup：意圖已標記時於手勢同步 context 內執行複製（transient activation 有效）。
  const handleCopyPressEnd = () => {
    clearCopyLongPressTimer();
    setIsCopyArmed(false);
    if (copyArmedRef.current && !copyCommittedRef.current) {
      copyCommittedRef.current = true;
      onCopyResult();
    }
  };

  // 指標離開／取消＝放棄本次長按（僅 pointerup 提交複製）。
  const handleCopyPressAbort = () => {
    clearCopyLongPressTimer();
    copyArmedRef.current = false;
    setIsCopyArmed(false);
  };

  useEffect(() => clearCopyLongPressTimer, []);

  // #590：大金額 fit-to-container——以 transform 縮放（offsetWidth 不受 transform 影響，
  // 單次量測即收斂），right origin 保持右對齊且必保最高位可見。
  useLayoutEffect(() => {
    const box = amountBoxRef.current;
    const text = amountTextRef.current;
    if (!box || !text) return;

    const measure = () => {
      const styles = window.getComputedStyle(box);
      const available =
        box.clientWidth -
        (parseFloat(styles.paddingLeft) || 0) -
        (parseFloat(styles.paddingRight) || 0);
      const needed = text.offsetWidth;
      if (available <= 0 || needed <= 0) return;
      const next = Math.max(MIN_AMOUNT_FIT_SCALE, Math.min(1, available / needed));
      setFitScale((prev) => (Math.abs(prev - next) > FIT_SCALE_EPSILON ? next : prev));
    };

    measure();
    // 容器 resize（旋轉、視口變化）與文字尺寸變化（active 字級 transition）都需重量。
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(text);
    return () => observer.disconnect();
  }, [display, isActive]);

  return (
    <div
      data-testid={`converter-v2-row-${field}`}
      className={`relative flex items-center gap-3 px-4 py-3 compact:py-1.5 short:py-1 transition-colors ${
        isActive ? 'bg-primary/5' : ''
      }`}
    >
      {/* E8 缺口 5：迷你運算式列——absolute overlay 疊在列頂緣，顯示/隱藏零位移（CLS 0）。
          justify-end＋overflow-hidden：超長表達式左緣截尾，最新輸入（右端）必可見。 */}
      {isActive && liveExpression && (
        <div
          data-testid="converter-v2-expression"
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-0 left-24 flex h-4 items-center justify-end overflow-hidden whitespace-nowrap text-2xs font-medium tabular-nums text-neutral-text-muted"
        >
          {liveExpression}
        </div>
      )}
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
        ref={amountBoxRef}
        role="button"
        tabIndex={0}
        onClick={() => {
          // 長按意圖已標記時抑制活化，避免複製鬆手誤切活躍列。
          if (copyArmedRef.current) {
            copyArmedRef.current = false;
            copyCommittedRef.current = false;
            return;
          }
          onActivate(field);
        }}
        onPointerDown={handleCopyPressStart}
        onPointerUp={handleCopyPressEnd}
        onPointerLeave={handleCopyPressAbort}
        onPointerCancel={handleCopyPressAbort}
        onContextMenu={(e) => {
          // 桌面右鍵等效複製（contextmenu 為使用者手勢，activation 有效）；
          // Android 長按派發 contextmenu 時若意圖已標記，亦在此提交避免 pointercancel 漏掉。
          e.preventDefault();
          clearCopyLongPressTimer();
          if (!copyCommittedRef.current) {
            copyCommittedRef.current = true;
            setIsCopyArmed(false);
            onCopyResult();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate(field);
          }
        }}
        data-testid={`converter-v2-amount-${field}`}
        data-copy-armed={isCopyArmed || undefined}
        aria-label={`${t('converterV2.rowLabel', { code: currency })}: ${display}`}
        aria-pressed={isActive}
        // select-none＋touch-callout none：消除長按複製與原生文字選取／放大鏡的手勢衝突（S2）。
        className={`flex-1 min-w-0 min-h-[44px] flex items-center justify-end rounded-xl px-2 text-right font-bold tabular-nums leading-tight cursor-pointer whitespace-nowrap overflow-hidden select-none [-webkit-touch-callout:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-[font-size,color,box-shadow,background-color] duration-200 ${
          isActive
            ? 'text-[32px] short:text-[26px] text-text ring-2 ring-primary/40'
            : 'text-[28px] short:text-[22px] text-neutral-text-secondary'
        } ${isCopyArmed ? 'bg-primary/10' : ''}`}
      >
        <span
          ref={amountTextRef}
          data-testid={`converter-v2-amount-text-${field}`}
          className="inline-block"
          style={
            fitScale < 1
              ? { transform: `scale(${fitScale})`, transformOrigin: 'right center' }
              : undefined
          }
        >
          {display}
        </span>
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
  onAddToHistory,
  onRateTypeChange,
  onRateSourceChange,
  rateSource = DEFAULT_RATE_SOURCE,
  moneyBoxRate = null,
  exchangeShopCurrency = null,
}: SingleConverterProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeRow, setActiveRow] = useState<RowField>('from');
  const [pickerFor, setPickerFor] = useState<RowField | null>(null);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  // swap 或切列時遞增，強制 keypad remount 重置表達式為活躍列現值。
  const [keypadSession, setKeypadSession] = useState(0);
  // E8 缺口 4：rate chip 顯示方向翻轉（僅顯示層，不改變計價基準與換算引擎）。
  const [isRateFlipped, setIsRateFlipped] = useState(false);
  // E8 缺口 5：計算進行中的原始表達式（含運算子才視為進行中）；settle／語意變更後清空。
  const [liveExpression, setLiveExpression] = useState<string | null>(null);
  // E8 缺口 10（#620）：最近一次 settle 的換算快照，供 aria-live 播報（非逐鍵）。
  const [settledSnapshot, setSettledSnapshot] = useState<{
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    fromAmount: string;
    toAmount: string;
  } | null>(null);

  // E8 缺口 2：換算 settle（輸入停頓 2s／切列／離開）寫入既有歷史 store。
  // dirty 僅在使用者實際輸入（keypad 回寫、快速金額）後為真；flush 共用 v1 addToHistory API。
  const settleTimerRef = useRef<number | null>(null);
  const settleDirtyRef = useRef(false);
  // B1 去重：最近一筆「自動寫入」的識別鍵（from|to|amount）；手動寫入不在此追蹤範圍。
  const lastAutoWrittenKeyRef = useRef<string | null>(null);
  const onAddToHistoryRef = useRef(onAddToHistory);
  // settle 於 timer／unmount 觸發，以 latest ref 讀取當下最新換算快照與寫入函式。
  const settleSnapshotRef = useRef({ fromCurrency, toCurrency, fromAmount, toAmount });
  useEffect(() => {
    onAddToHistoryRef.current = onAddToHistory;
    settleSnapshotRef.current = { fromCurrency, toCurrency, fromAmount, toAmount };
  });

  const flushHistorySettle = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (!settleDirtyRef.current) return;
    settleDirtyRef.current = false;
    // E8 缺口 5：settle 即結束「計算進行中」，運算式列隱藏。
    setLiveExpression(null);
    const snapshot = settleSnapshotRef.current;
    // B1 守門 1：金額 0／空／非有限值不寫（含 backspace 清到 0 後停頓 2s 路徑）。
    const parsedAmount = parseFloat(snapshot.fromAmount);
    const parsedResult = parseFloat(snapshot.toAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) return;
    if (!Number.isFinite(parsedResult) || parsedResult === 0) return;
    // E8 缺口 10（#620）：settle 播報換算結果，與歷史寫入共用同一 settle 事件；
    // 置於去重守門之前——同值重輸入仍屬使用者輸入旅程，SR 回饋不因歷史去重而消失。
    setSettledSnapshot({ ...snapshot });
    // B1 守門 2：與上一筆自動寫入同值（from/to/amount）去重，避免重複紀錄。
    const entryKey = `${snapshot.fromCurrency}|${snapshot.toCurrency}|${snapshot.fromAmount}`;
    if (lastAutoWrittenKeyRef.current === entryKey) return;
    lastAutoWrittenKeyRef.current = entryKey;
    // 自動寫入不彈 toast（notify: false），避免每次停頓都打斷使用者。
    onAddToHistoryRef.current({ notify: false });
  }, []);

  // B2：語意變更（幣別／swap／基準切換）取消 pending settle——timer 跨語意變更後寫入的
  // 是變更後重算值，非使用者輸入當下的換算，語意已失真，寧可不寫（PM 裁決 cancel 而非 flush）。
  const cancelHistorySettle = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    settleDirtyRef.current = false;
    setLiveExpression(null);
  }, []);

  const scheduleHistorySettle = useCallback(() => {
    settleDirtyRef.current = true;
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(flushHistorySettle, HISTORY_SETTLE_MS);
  }, [flushHistorySettle]);

  // 離開（unmount）時 flush 未結算的換算，避免最後一筆遺失。
  useEffect(() => flushHistorySettle, [flushHistorySettle]);

  // E8 缺口 5：keypad 表達式回報。含運算子（首字元後）才視為「計算進行中」；
  // 純數字與掛載種子不顯示。進行中若已有 pending settle，運算子按鍵同步展延計時
  // （使用者仍在組式，不提前結算），維持與缺口 2 同一 settle 機制、無平行計時器。
  const handleExpressionChange = useCallback(
    (expression: string) => {
      const inProgress = /[+×÷]/.test(expression) || expression.slice(1).includes('-');
      setLiveExpression(inProgress ? expression.replace(/([+×÷-])/g, ' $1 ').trim() : null);
      if (inProgress && settleDirtyRef.current) {
        scheduleHistorySettle();
      }
    },
    [scheduleHistorySettle],
  );

  const trend = useConverterTrend({
    fromCurrency,
    toCurrency,
    rateSource,
    moneyBoxRate,
    exchangeShopCurrency,
    rateType,
    maxDays: TREND_FETCH_DAYS,
  });
  const sparklineData = useMemo(() => trend.data.slice(-SPARKLINE_DAYS), [trend.data]);
  const sparklineChange = useMemo(() => {
    const first = sparklineData[0]?.rate;
    const last = sparklineData.at(-1)?.rate;
    if (first === undefined || last === undefined || first === 0) return null;
    return ((last - first) / first) * 100;
  }, [sparklineData]);

  // E8 缺口 8：趨勢 sheet 內的基準切換（現金／即期）。選擇以 pair＋卡片基準為鍵：
  // pair 或卡片基準變更即回落跟隨卡片（render 期推導，免 effect 重置）。
  const [sheetBasisSelection, setSheetBasisSelection] = useState<{
    key: string;
    basis: RateType;
  } | null>(null);
  const sheetBasisKey = `${fromCurrency}|${toCurrency}|${rateType}`;
  const sheetBasis: RateType =
    sheetBasisSelection?.key === sheetBasisKey ? sheetBasisSelection.basis : rateType;
  const handleSheetBasisChange = useCallback(
    (basis: RateType) => setSheetBasisSelection({ key: sheetBasisKey, basis }),
    [sheetBasisKey],
  );
  // sheet 專屬序列：跟隨 sheet 選擇的基準；即期序列不足時 hook 內
  // resolveTrendSeries（#564）誠實回落現金並回傳實際採用基準，值與標註同源。
  const sheetTrend = useConverterTrend({
    fromCurrency,
    toCurrency,
    rateSource,
    moneyBoxRate,
    exchangeShopCurrency,
    rateType: sheetBasis,
    maxDays: TREND_FETCH_DAYS,
  });
  const sheetTrendRateType = sheetTrend.trendRateType ?? sheetBasis;

  // 匯率與實際採用 basis 由引擎一次回傳：值與標籤共用同一選價決策（QA-I D1 review）。
  const { rate: exchangeRate, side: rateSide } = getUnitExchangeRateWithBasis(
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
    // 切列視為 settle 邊界：先結算上一列的換算再切換。
    flushHistorySettle();
    setActiveRow(field);
    setKeypadSession((session) => session + 1);
  };

  const handleKeypadValue = (value: number) => {
    if (activeRow === 'from') {
      onFromAmountChange(value.toString());
    } else {
      onToAmountChange(value.toString());
    }
    scheduleHistorySettle();
  };

  // E8 缺口 1：快速金額點擊＝取代活躍列金額；remount keypad 重播種子並關閉回寫閘門，
  // 後續首顆數字鍵沿用 #633 取代語意（與紅線回歸一致）。
  const handleQuickAmount = (value: number) => {
    if (activeRow === 'from') {
      onFromAmountChange(value.toString());
    } else {
      onToAmountChange(value.toString());
    }
    setKeypadSession((session) => session + 1);
    scheduleHistorySettle();
  };

  // 快速金額跟隨活躍列幣別（v1 SSOT 常數，禁止複製數值）。
  const activeCurrency = activeRow === 'from' ? fromCurrency : toCurrency;
  const quickAmounts = CURRENCY_QUICK_AMOUNTS[activeCurrency] ?? CURRENCY_QUICK_AMOUNTS.TWD;

  // E8 缺口 6：長按／右鍵複製當前換算結果，格式與 toast 對齊 v1 歷史單擊複製慣例。
  const handleCopyResult = useCallback(async () => {
    const success = await copyToClipboard(
      formatConversionForCopy({
        amount: fromAmount,
        from: fromCurrency,
        result: toAmount,
        to: toCurrency,
      }),
    );
    if (success) {
      showToast(t('common.copied'), 'success');
    } else {
      showToast(t('conversionHistory.copyFailed'), 'error');
    }
  }, [fromAmount, fromCurrency, toAmount, toCurrency, showToast, t]);
  const handleCopyResultSync = useCallback(() => {
    void handleCopyResult();
  }, [handleCopyResult]);

  const handleSwap = () => {
    // B2：swap 為語意變更，取消 pending settle；S4：翻轉為 per-pair 檢視偏好，pair 變更即重置。
    cancelHistorySettle();
    setIsRateFlipped(false);
    onSwapCurrencies();
    setKeypadSession((session) => session + 1);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handlePickCurrency = (code: CurrencyCode) => {
    // 幣別實際變更才視為語意變更：B2 取消 pending settle、S4 重置翻轉態（per-pair 檢視偏好）。
    // 選回同幣別＝同 pair，pending 換算仍有效、翻轉態保留。
    const pairChanged =
      pickerFor === 'from' ? code !== fromCurrency : pickerFor === 'to' && code !== toCurrency;
    if (pairChanged) {
      cancelHistorySettle();
      setIsRateFlipped(false);
    }
    if (pickerFor === 'from') {
      onFromCurrencyChange(code);
    } else if (pickerFor === 'to') {
      onToCurrencyChange(code);
    }
    setPickerFor(null);
  };

  // rate chip 基準標註：換錢所來源優先，其餘直接消費引擎回傳的實際採用 basis。
  // mid：單一「中間價」標籤（引擎依當前 rateType 計價，fallback 可跨型，故不宣稱現金/即期）。
  // mixed（auto 交叉兩腿買/賣不一致）：只標 rate type，省略買/賣字樣，不過度宣稱（PM 裁決）。
  const resolveBankBasisLabel = (side: UnitRateBasis): string => {
    switch (side) {
      case 'mid':
        return t('converterV2.rateBasisMid');
      case 'mixed':
        return t(rateType === 'cash' ? 'singleConverter.cashRate' : 'singleConverter.spotRate');
      case 'buy':
        return t(
          rateType === 'cash' ? 'converterV2.rateBasisCashBuy' : 'converterV2.rateBasisSpotBuy',
        );
      case 'sell':
        return t(rateType === 'cash' ? 'converterV2.rateBasisCash' : 'converterV2.rateBasisSpot');
      default: {
        const exhaustive: never = side;
        return exhaustive;
      }
    }
  };
  const basisLabel =
    rateSource === 'exchange-shop' && exchangeShopCurrency
      ? t('converterV2.rateBasisExchangeShop')
      : resolveBankBasisLabel(rateSide);

  // E8 缺口 3：換錢所來源切換。支援幣別（exchangeShopCurrency 非空）才渲染切換鈕（零暴露）。
  const isExchangeShopActive = rateSource === 'exchange-shop' && !!exchangeShopCurrency;
  const canToggleRateSource = !!exchangeShopCurrency && !!onRateSourceChange;
  const handleToggleRateSource = () => {
    if (!onRateSourceChange) return;
    // B2：來源切換後兩列金額以新來源重算，pending settle 語意失真，取消不寫。
    cancelHistorySettle();
    onRateSourceChange(isExchangeShopActive ? 'bank' : 'exchange-shop');
  };

  // 趨勢 sheet 基準標註跟隨 sheet 實際採用序列（#564 誠實回落）：值與標籤同源。
  const sheetBasisLabel =
    rateSource === 'exchange-shop' && exchangeShopCurrency
      ? t('converterV2.rateBasisExchangeShop')
      : sheetTrendRateType === 'cash'
        ? t('converterV2.rateBasisCash')
        : t('converterV2.rateBasisSpot');

  // E8 缺口 8：「查看 {幣別} 攻略」連結——以 seo-paths SSOT 判斷該 pair 落地頁存在才顯示。
  const pairGuidePath = `/${fromCurrency.toLowerCase()}-${toCurrency.toLowerCase()}/`;
  const trendGuidePath =
    isCurrencyPagePath(pairGuidePath) || isReverseCurrencyPagePath(pairGuidePath)
      ? pairGuidePath
      : null;
  const trendGuideCode = fromCurrency === 'TWD' ? toCurrency : fromCurrency;

  // 切換目標基準不可用時（如 KRW 無即期），chip 進入不可用態並以 tooltip 說明原因。
  // 換錢所啟用中 chip 語意改為「回銀行基準」，不進入不可用態。
  const nextRateType: RateType = rateType === 'cash' ? 'spot' : 'cash';
  const isBasisToggleDisabled = !isExchangeShopActive && !rateTypeAvailability[nextRateType];
  const basisUnavailableMessage = t('singleConverter.rateTypeUnavailable', {
    rateType: t(nextRateType === 'spot' ? 'singleConverter.spotRate' : 'singleConverter.cashRate'),
  });

  const handleToggleBasis = () => {
    // 換錢所啟用中：chip tap＝回到銀行基準（對齊 v1 RateSelector pill 語意），不切現金／即期。
    if (isExchangeShopActive) {
      cancelHistorySettle();
      onRateSourceChange?.('bank');
      return;
    }
    if (isBasisToggleDisabled) return;
    // B2：基準切換後兩列金額以新基準重算，pending settle 語意失真，取消不寫。
    // 翻轉態不重置（同 pair 內保留，S4）。
    cancelHistorySettle();
    onRateTypeChange(nextRateType);
  };

  // E8 缺口 4：翻轉僅改變顯示表述（同一報價的倒數），計價基準標籤不變。
  // chip 本體 tap 維持既有「切換現金／即期」語意（#659/#665 契約與 D3 不可用態不動），
  // 翻轉走獨立 ⇄ 鈕：兩動作語意分離、誤觸不互相汙染。
  const displayRate = isRateFlipped ? getReciprocalExchangeRate(exchangeRate) : exchangeRate;
  const displayBase = isRateFlipped ? toCurrency : fromCurrency;
  const displayQuote = isRateFlipped ? fromCurrency : toCurrency;

  const rateChipButton = (
    <button
      type="button"
      onClick={handleToggleBasis}
      data-testid="converter-v2-rate-chip"
      aria-label={
        isExchangeShopActive ? t('multiConverter.switchToBank') : t('converterV2.toggleRateBasis')
      }
      // 用 aria-disabled 而非原生 disabled：原生 disabled 會吞掉點擊，
      // RateTypeTooltip 的禁用原因提示將永遠無法觸發（onClick guard 已阻擋切換）。
      aria-disabled={isBasisToggleDisabled || undefined}
      // narrow（≤349px）梯次收斂內距與字級，與 ⇄ 鈕同列不溢出 320px 視口（E8 S5）。
      className={`inline-flex min-h-[44px] items-center gap-1.5 narrow:gap-1 whitespace-nowrap rounded-full bg-surface-elevated px-4 short:px-3 narrow:px-2.5 text-sm narrow:text-xs font-semibold tabular-nums text-neutral-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        isBasisToggleDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-primary/10'
      }`}
    >
      <span className="text-text">
        1 {displayBase} = {formatExchangeRate(displayRate)} {displayQuote}
      </span>
      <span aria-hidden="true">・</span>
      <span className="text-primary-on-surface">{basisLabel}</span>
    </button>
  );

  // QA-J J-1：701–805px 高度帶（如 360×740/360×800）補齊 snug/compact 壓縮梯次，
  // 鍵盤底列不得被固定底導覽遮蓋；short（≤700px）既有梯次不動。
  return (
    <div className="flex flex-col gap-3 snug:gap-2 short:gap-1.5" data-testid="converter-v2">
      {/* 等值雙列：上下緊貼、完全對等，divider 內嵌 32px swap 鈕 */}
      <div className="rounded-2xl border border-border/60 bg-surface overflow-hidden">
        <CurrencyRow
          field="from"
          currency={fromCurrency}
          amount={fromAmount}
          isActive={activeRow === 'from'}
          onOpenPicker={setPickerFor}
          onActivate={handleActivateRow}
          onCopyResult={handleCopyResultSync}
          liveExpression={liveExpression}
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
          onCopyResult={handleCopyResultSync}
          liveExpression={liveExpression}
        />
      </div>

      {/* rate chip：一行匯率資訊，tap 切換現金／即期；目標基準不可用時以 tooltip 說明（對齊 v1 RateSelector 慣例）。
          右側 ⇄ 鈕翻轉顯示方向（E8 缺口 4，顯示層 only）。 */}
      <div className="flex items-center justify-center gap-1 narrow:gap-0.5">
        {isBasisToggleDisabled ? (
          <RateTypeTooltip message={basisUnavailableMessage} isDisabled={true}>
            {rateChipButton}
          </RateTypeTooltip>
        ) : (
          rateChipButton
        )}
        {/* E8 缺口 3：換錢所來源切換鈕（bank ⇄ exchange-shop）。僅支援幣別（如 KRW）渲染，
            不支援幣別零暴露；與 ⇄ 鈕同規格 icon-only 44px 熱區，320px 視口不溢出。 */}
        {canToggleRateSource && (
          <button
            type="button"
            onClick={handleToggleRateSource}
            data-testid="converter-v2-rate-source"
            aria-label={
              isExchangeShopActive
                ? t('multiConverter.switchToBank')
                : t('singleConverter.switchToExchangeShop')
            }
            aria-pressed={isExchangeShopActive}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              isExchangeShopActive
                ? 'bg-primary/10 text-primary-on-surface'
                : 'text-neutral-text-secondary hover:bg-primary/10 hover:text-primary-on-surface'
            }`}
          >
            <Store className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsRateFlipped((flipped) => !flipped)}
          data-testid="converter-v2-rate-flip"
          aria-label={t('converterV2.flipRateDirection')}
          aria-pressed={isRateFlipped}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-text-secondary transition-colors hover:bg-primary/10 hover:text-primary-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h13m0 0l-3-3m3 3l-3 3" />
            <path d="M20 17H7m0 0l3-3m-3 3l3 3" />
          </svg>
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
        <div className="h-[72px] snug:h-[56px] short:h-[40px] pointer-events-none">
          {sparklineData.length >= 2 ? (
            <Suspense fallback={<TrendChartSkeleton />}>
              <MiniTrendChart data={sparklineData} currencyCode={toCurrency} />
            </Suspense>
          ) : (
            <TrendChartSkeleton />
          )}
        </div>
      </div>

      {/* 常駐計算機（含快速金額頂列）：輸入目標＝活躍列；key remount 重置種子，掛載為唯讀、僅實際按鍵才回寫。
          實體鍵盤（#587）於任一 sheet 開啟時停用，避免與 sheet 內搜尋、Esc 語意衝突。
          S3：quick chips 位於 remount key 範圍之外（shell 穩定不重掛），
          點 chip 觸發 keypad 重播種子時，chips 的橫向捲動位置與焦點不受影響。 */}
      <div
        data-testid="converter-v2-keypad"
        role="group"
        aria-label={t('converterV2.keypadLabel')}
        className="rounded-2xl bg-surface px-1 pt-3 pb-2 snug:pt-2 short:pt-1 short:pb-1"
      >
        {/* E8 缺口 1：快速金額 chips 內嵌 keypad 第 0 列（單排橫向捲動，不另佔獨立區塊）。
            點擊語意＝取代活躍列金額（父層 remount 重播種子，沿用 #633 首鍵取代閘門語意）。 */}
        <div
          data-testid="converter-v2-quick-chips"
          role="group"
          aria-label={t('converterV2.quickAmountsLabel')}
          className="mb-2 short:mb-1 flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide"
        >
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              data-testid={`converter-v2-quick-${amount}`}
              onClick={() => {
                lightHaptic();
                handleQuickAmount(amount);
              }}
              className="h-9 snug:h-8 short:h-7 min-w-0 shrink-0 rounded-full bg-surface-elevated px-3.5 text-sm short:text-xs font-semibold tabular-nums text-text/70 transition-colors hover:bg-primary/10 hover:text-primary-on-surface active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
        <ConverterKeypad
          key={`${activeRow}-${keypadSession}`}
          initialValue={keypadSeed}
          onValueChange={handleKeypadValue}
          onExpressionChange={handleExpressionChange}
          keyboardEnabled={pickerFor === null && !isTrendOpen}
        />
      </div>

      {/* E8 缺口 10（#620）：settle 後以 aria-live 播報換算結果（非逐鍵，節流即 settle 機制本身）。
          常駐 DOM 供 SR 註冊 live region；視覺隱藏（sr-only），畫面零變化。 */}
      <div
        aria-live="polite"
        role="status"
        className="sr-only"
        data-testid="converter-v2-sr-summary"
      >
        {settledSnapshot
          ? t('converterV2.settleAnnouncement', {
              amount:
                formatAmountDisplay(settledSnapshot.fromAmount, settledSnapshot.fromCurrency) ||
                settledSnapshot.fromAmount,
              from: settledSnapshot.fromCurrency,
              result:
                formatAmountDisplay(settledSnapshot.toAmount, settledSnapshot.toCurrency) ||
                settledSnapshot.toAmount,
              to: settledSnapshot.toCurrency,
            })
          : ''}
      </div>

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
        data={sheetTrend.data}
        basisLabel={sheetBasisLabel}
        basis={sheetBasis}
        onBasisChange={handleSheetBasisChange}
        showBasisToggle={!isExchangeShopActive}
        guidePath={trendGuidePath}
        guideCode={trendGuideCode}
      />
    </div>
  );
};
