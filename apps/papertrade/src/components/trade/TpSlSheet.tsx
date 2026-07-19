import { useState } from 'react';
import clsx from 'clsx';
import { BottomSheet } from '../BottomSheet';
import { type Position } from '../../engine/types';
import { isSlBeyondLiquidation, liquidationPrice } from '../../engine/math';
import { useTradeStore } from '../../stores/tradeStore';
import { useMarketStore } from '../../stores/marketStore';
import {
  pnlAtPrice,
  priceFromPnl,
  priceFromRoe,
  roeAtPrice,
  type TpSlBasis,
} from '../../lib/tpslMath';
import { formatAmount, formatPrice, formatSignedPercent, formatSignedPnl } from '../../lib/format';
import { pricePrecisionFor } from '../../lib/priceScale';
import { TPSL_INPUT_MESSAGES, TRADE_ERROR_MESSAGES } from '../../lib/tradeForm';
import { QTY_DISPLAY_DECIMALS } from '../../config/trading';
import { SYMBOL_META } from '../../config/market';

interface TpSlSheetProps {
  open: boolean;
  position: Position;
  onClose: () => void;
}

type Scope = 'full' | 'partial';
type ValueMode = 'price' | 'roe' | 'pnl';
type TriggerKind = 'tp' | 'sl';

interface Draft {
  mode: ValueMode;
  input: string;
}

const VALUE_MODES: readonly { id: ValueMode; label: string }[] = [
  { id: 'price', label: '價格' },
  { id: 'roe', label: '收益率%' },
  { id: 'pnl', label: '收益額' },
] as const;

const PERCENT_PRESETS = [25, 50, 75, 100] as const;

const KIND_META = {
  tp: { title: '止盈', sliderMin: 0, sliderMax: 300, focus: 'focus:border-long' },
  sl: { title: '止損', sliderMin: -100, sliderMax: 0, focus: 'focus:border-short' },
} as const;

function inputLabel(kind: TriggerKind, mode: ValueMode): string {
  const unit = mode === 'roe' ? '%' : 'USDT';
  const name = mode === 'price' ? '價格' : mode === 'roe' ? '收益率' : '收益額';
  return `${KIND_META[kind].title}${name}（${unit}）`;
}

// 顯示回填用的短數字（去尾零），避免換算後輸入框出現長浮點。
function fmtInput(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(decimals)).toString();
}

function valueAtMode(
  price: number,
  mode: ValueMode,
  basis: TpSlBasis,
  priceDecimals: number,
): string {
  if (mode === 'price') return fmtInput(price, priceDecimals);
  if (mode === 'roe') return fmtInput(roeAtPrice(basis, price), 2);
  return fmtInput(pnlAtPrice(basis, price), 2);
}

// 由使用者輸入導出觸發價：null＝未設定、NaN＝無效輸入。
function deriveTriggerPrice(draft: Draft, basis: TpSlBasis): number | null {
  const raw = draft.input.trim();
  if (raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return Number.NaN;
  if (draft.mode === 'price') return value;
  if (draft.mode === 'roe') return priceFromRoe(basis, value);
  return priceFromPnl(basis, value);
}

// 方向驗證沿用引擎 R4 規則（多單 tp>開倉價、sl<開倉價；空單反向），避免 UI 與引擎判定漂移。
function validateTrigger(
  kind: TriggerKind,
  price: number | null,
  position: Position,
): string | null {
  if (price === null) return null;
  if (Number.isNaN(price) || price <= 0) return TPSL_INPUT_MESSAGES[kind];
  const isLong = position.side === 'long';
  if (kind === 'tp') {
    const valid = isLong ? price > position.entryPrice : price < position.entryPrice;
    return valid ? null : TRADE_ERROR_MESSAGES['invalid-tp-direction'];
  }
  const valid = isLong ? price < position.entryPrice : price > position.entryPrice;
  if (!valid) return TRADE_ERROR_MESSAGES['invalid-sl-direction'];
  // 高槓桿死區（issue 781）：停損劣於強平價時強平必先觸發，標示無效並擋下送出。
  if (isSlBeyondLiquidation(position.side, position.entryPrice, position.leverage, price)) {
    const liq = liquidationPrice(position.side, position.entryPrice, position.leverage);
    return `此停損價已越過強平價 ${formatPrice(liq, position.symbol)}，實際會先觸發強平`;
  }
  return null;
}

export function TpSlSheet({ open, position, onClose }: TpSlSheetProps) {
  const [scope, setScope] = useState<Scope>(position.tpSlCloseRatio < 1 ? 'partial' : 'full');
  const [percent, setPercent] = useState(() => Math.round(position.tpSlCloseRatio * 100));
  const [tpDraft, setTpDraft] = useState<Draft>({
    mode: 'price',
    input: position.takeProfit?.toString() ?? '',
  });
  const [slDraft, setSlDraft] = useState<Draft>({
    mode: 'price',
    input: position.stopLoss?.toString() ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const setPositionTpSl = useTradeStore((state) => state.setPositionTpSl);
  const mark = useMarketStore((state) => state.tickers[position.symbol]?.markPrice);

  const ratio = scope === 'full' ? 1 : percent / 100;
  const basis: TpSlBasis = {
    side: position.side,
    entryPrice: position.entryPrice,
    closeQty: position.qty * ratio,
    closeMargin: position.margin * ratio,
  };
  const base = SYMBOL_META[position.symbol].base;

  const drafts = { tp: tpDraft, sl: slDraft } as const;
  const setters = { tp: setTpDraft, sl: setSlDraft } as const;
  const tpPrice = deriveTriggerPrice(tpDraft, basis);
  const slPrice = deriveTriggerPrice(slDraft, basis);
  const prices = { tp: tpPrice, sl: slPrice } as const;
  const tpError = validateTrigger('tp', tpPrice, position);
  const slError = validateTrigger('sl', slPrice, position);
  const errors = { tp: tpError, sl: slError } as const;
  const submitDisabled = tpError !== null || slError !== null;

  function switchMode(kind: TriggerKind, nextMode: ValueMode) {
    setters[kind]((prev) => {
      if (prev.mode === nextMode) return prev;
      const price = deriveTriggerPrice(prev, basis);
      // 無效輸入切換模式即清空，避免垃圾值跨模式殘留。
      if (price === null || Number.isNaN(price) || price <= 0) {
        return { mode: nextMode, input: '' };
      }
      return {
        mode: nextMode,
        input: valueAtMode(price, nextMode, basis, pricePrecisionFor(position.symbol)),
      };
    });
    setError(null);
  }

  function writeFromRoe(kind: TriggerKind, roe: number) {
    setters[kind]((prev) => ({
      mode: prev.mode,
      input: valueAtMode(
        priceFromRoe(basis, roe),
        prev.mode,
        basis,
        pricePrecisionFor(position.symbol),
      ),
    }));
    setError(null);
  }

  function confirm() {
    const result = setPositionTpSl(position.id, tpPrice, slPrice, ratio);
    if (!result.ok) {
      setError(TRADE_ERROR_MESSAGES[result.error]);
      return;
    }
    setError(null);
    onClose();
  }

  function renderTriggerBlock(kind: TriggerKind) {
    const meta = KIND_META[kind];
    const draft = drafts[kind];
    const price = prices[kind];
    const inlineError = errors[kind];
    const hasValidPrice = price !== null && !Number.isNaN(price) && price > 0;
    const pnl = hasValidPrice ? pnlAtPrice(basis, price) : null;
    const roe = hasValidPrice ? roeAtPrice(basis, price) : null;
    // 未設定時滑桿停在 0%（TP 左端、SL 右端），僅拖動才回寫值。
    const sliderValue = roe !== null ? Math.min(meta.sliderMax, Math.max(meta.sliderMin, roe)) : 0;

    return (
      <section aria-label={`${meta.title}設定`} className="mt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-label font-medium text-text-2">{meta.title}</h3>
          <div
            role="tablist"
            aria-label={`${meta.title}輸入模式`}
            className="flex rounded-control bg-surface-2 p-0.5"
          >
            {VALUE_MODES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={draft.mode === id}
                onClick={() => switchMode(kind, id)}
                className={clsx(
                  'min-h-11 min-w-11 rounded-[10px] px-2 text-caption transition-colors',
                  draft.mode === id ? 'bg-surface font-semibold text-text' : 'text-text-3',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          inputMode="decimal"
          aria-label={inputLabel(kind, draft.mode)}
          value={draft.input}
          onChange={(event) => {
            setters[kind]((prev) => ({ mode: prev.mode, input: event.target.value }));
            setError(null);
          }}
          placeholder="未設定"
          className={clsx(
            'mt-2 h-11 w-full rounded-control border border-border bg-surface-2 px-3 text-body tabular-nums outline-none',
            meta.focus,
          )}
        />
        <div className="relative mt-2">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2"
          />
          <input
            type="range"
            aria-label={`${meta.title}收益率快設`}
            aria-valuetext={`${Math.round(sliderValue)}%`}
            min={meta.sliderMin}
            max={meta.sliderMax}
            step={5}
            value={sliderValue}
            onChange={(event) => writeFromRoe(kind, Number(event.target.value))}
            className="range-input relative h-11 w-full"
          />
        </div>
        <div className="flex justify-between text-caption text-text-3 tabular-nums">
          <span>{meta.sliderMin}%</span>
          <span>{kind === 'tp' ? `+${meta.sliderMax}%` : `${meta.sliderMax}%`}</span>
        </div>
        {hasValidPrice && inlineError === null && pnl !== null && roe !== null && (
          <p
            className={clsx(
              'mt-1 text-caption tabular-nums',
              pnl >= 0 ? 'text-long' : 'text-short',
            )}
          >
            觸發價 {formatPrice(price, position.symbol)}｜預估損益 {formatSignedPnl(pnl)} USDT（ROE{' '}
            {formatSignedPercent(roe)}）
          </p>
        )}
        {inlineError !== null && (
          <p
            role="alert"
            className="mt-1 rounded bg-short-bg px-2.5 py-1.5 text-caption text-short"
          >
            {inlineError}
          </p>
        )}
      </section>
    );
  }

  return (
    <BottomSheet open={open} title="止盈止損" onClose={onClose}>
      <p className="text-caption text-text-3 tabular-nums">
        開倉價 {formatPrice(position.entryPrice, position.symbol)}｜標記價{' '}
        {mark !== undefined ? formatPrice(mark, position.symbol) : '--'}
        ；觸發後以市價結算，留空代表不設定。
      </p>

      <div
        role="tablist"
        aria-label="平倉範圍"
        className="mt-3 flex rounded-control bg-surface-2 p-0.5"
      >
        {(
          [
            { id: 'full', label: '全倉' },
            { id: 'partial', label: '部分' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={scope === id}
            onClick={() => {
              setScope(id);
              setError(null);
            }}
            className={clsx(
              'min-h-11 min-w-11 flex-1 rounded-[10px] text-label transition-colors',
              scope === id ? 'bg-surface font-semibold text-text' : 'text-text-3',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {scope === 'partial' && (
        <div className="mt-3" role="group" aria-label="平倉比例">
          <div className="flex justify-between text-caption text-text-3">
            <span>平倉比例</span>
            <span className="tabular-nums">
              {percent}%（{formatAmount(position.qty * ratio, QTY_DISPLAY_DECIMALS)} {base}）
            </span>
          </div>
          <div className="relative mt-1.5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: `calc(10px + (100% - 20px) * ${(percent - 1) / 99})` }}
            />
            <input
              type="range"
              aria-label="平倉比例"
              aria-valuetext={`${percent}%`}
              min={1}
              max={100}
              step={1}
              value={percent}
              onChange={(event) => {
                setPercent(Number(event.target.value));
                setError(null);
              }}
              className="range-input relative h-11 w-full"
            />
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {PERCENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setPercent(preset);
                  setError(null);
                }}
                className={clsx(
                  'min-h-11 min-w-11 flex-1 rounded text-caption tabular-nums transition-colors',
                  percent === preset
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'bg-surface-2 text-text-2 active:bg-border',
                )}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      )}

      {renderTriggerBlock('tp')}
      {renderTriggerBlock('sl')}

      {error !== null && (
        <p role="alert" className="mt-3 rounded bg-short-bg px-2.5 py-1.5 text-caption text-short">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={confirm}
        disabled={submitDisabled}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-control bg-primary text-body font-semibold text-text active:bg-primary-pressed disabled:opacity-40"
      >
        確認
      </button>
    </BottomSheet>
  );
}
