/**
 * 刷卡估算資訊區（ADR-002 Phase 1）：常駐「估算」badge＋計算式揭露＋手續費 stepper＋免責連結。
 * 手續費 SSOT 為 converterStore.cardFeePercent；計算式與估算值共用 getCardFeeMultiplier，
 * 確保值-標籤耦合（badge 揭露的乘數即引擎實際採用的乘數）。
 */

import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConverterStore } from '../../../stores/converterStore';
import { getCardFeeMultiplier } from '../../../utils/exchangeRateCalculation';
import { CARD_FEE_PERCENT_MAX, CARD_FEE_PERCENT_MIN, CARD_FEE_PERCENT_STEP } from '../constants';
import type { RateType } from '../types';

interface CardEstimateInfoProps {
  /** 實際估算基準（resolveCardBasisRateType 解析）：即期可用為 spot，缺失誠實揭露 cash。 */
  basisRateType: RateType;
}

/** 乘數顯示：最多 3 位小數並去尾零（1.5% → 1.015、0% → 1）。 */
export function formatCardFeeMultiplier(feePercent: number): string {
  return Number(getCardFeeMultiplier(feePercent).toFixed(3)).toString();
}

export function CardEstimateInfo({ basisRateType }: CardEstimateInfoProps) {
  const { t } = useTranslation();
  const cardFeePercent = useConverterStore((state) => state.cardFeePercent);
  const setCardFeePercent = useConverterStore((state) => state.setCardFeePercent);

  const basisLabel = t(
    basisRateType === 'cash' ? 'converterV2.rateBasisCash' : 'converterV2.rateBasisSpot',
  );
  const isAtMin = cardFeePercent <= CARD_FEE_PERCENT_MIN;
  const isAtMax = cardFeePercent >= CARD_FEE_PERCENT_MAX;

  const adjustFee = (delta: number) => {
    setCardFeePercent(cardFeePercent + delta);
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // stepper 按鈕：視覺 28px 圓形、44px 觸控熱區（負邊距抵銷外擴，比照 RateSelector pill 慣例）。
  const stepButtonClass = (disabled: boolean) =>
    `-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
      disabled ? 'cursor-not-allowed' : ''
    }`;
  const stepVisualClass = (disabled: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-full bg-surface-elevated text-text transition-colors ${
      disabled ? 'opacity-40' : 'hover:bg-primary/10 active:scale-95'
    }`;

  return (
    <div
      data-testid="card-estimate-info"
      className="flex w-full flex-col items-center gap-1.5 pt-1"
    >
      {/* 估算 badge＋計算式：值-標籤耦合，乘數與引擎共用 getCardFeeMultiplier。 */}
      <div className="flex items-center justify-center gap-1.5">
        <span
          data-testid="card-estimate-badge"
          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary-on-surface"
        >
          {t('cardEstimate.badge')}
        </span>
        <span data-testid="card-estimate-formula" className="text-xs tabular-nums text-text-muted">
          {t('cardEstimate.formula', {
            basis: basisLabel,
            multiplier: formatCardFeeMultiplier(cardFeePercent),
            fee: cardFeePercent.toFixed(1),
          })}
        </span>
      </div>

      {/* 手續費 stepper：0–3%、步進 0.1%，卡片內直接調整（點擊深度 1）。 */}
      <div
        role="group"
        aria-label={t('cardEstimate.feeLabel')}
        className="flex items-center justify-center gap-3"
      >
        <button
          type="button"
          data-testid="card-fee-decrease"
          onClick={() => {
            if (isAtMin) return;
            adjustFee(-CARD_FEE_PERCENT_STEP);
          }}
          aria-label={t('cardEstimate.decreaseFee')}
          aria-disabled={isAtMin || undefined}
          className={stepButtonClass(isAtMin)}
        >
          <span className={stepVisualClass(isAtMin)}>
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
        <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums text-text">
          <span className="mr-1 text-2xs font-medium text-text-muted">
            {t('cardEstimate.feeLabel')}
          </span>
          <span data-testid="card-fee-value" aria-live="polite">
            {cardFeePercent.toFixed(1)}%
          </span>
        </span>
        <button
          type="button"
          data-testid="card-fee-increase"
          onClick={() => {
            if (isAtMax) return;
            adjustFee(CARD_FEE_PERCENT_STEP);
          }}
          aria-label={t('cardEstimate.increaseFee')}
          aria-disabled={isAtMax || undefined}
          className={stepButtonClass(isAtMax)}
        >
          <span className={stepVisualClass(isAtMax)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* 免責：實際扣款以發卡行清算日匯率為準。 */}
      <p data-testid="card-estimate-disclaimer" className="text-2xs text-text-muted">
        {t('cardEstimate.disclaimer')}
        <Link to="/card-rate-guide/" className="ml-1 text-primary-on-surface underline">
          {t('cardEstimate.guideLink')}
        </Link>
      </p>
    </div>
  );
}
