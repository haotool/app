/**
 * 金額頁換算結果卡（Answer Hero 插槽）：大字結果＋雙向答案＋來源註記＋換算器 CTA。
 * 數字全部由 CurrencyLandingPage 純計算後傳入。
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Calculator } from 'lucide-react';
import type { AmountAnswerData } from '../../config/seo-metadata';
import { formatNum } from './format';

export interface AmountAnswerCardProps {
  amount: number;
  amountResult: number;
  cashSell: number;
  currencyCode: string;
  isTwdToForeign: boolean;
  answerData: AmountAnswerData | null;
  converterHref: string;
}

export function AmountAnswerCard({
  amount,
  amountResult,
  cashSell,
  currencyCode,
  isTwdToForeign,
  answerData,
  converterHref,
}: AmountAnswerCardProps) {
  return (
    <div
      className="mt-4 rounded-panel border border-primary/20 bg-primary/5 p-4 sm:p-5"
      data-testid="amount-answer-block"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
        <span>換算結果（台銀實際牌告）</span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm tabular-nums text-text-muted">
          {isTwdToForeign ? `${formatNum(amount)} TWD` : `${formatNum(amount)} ${currencyCode}`}
        </span>
        <span className="text-sm text-text-muted">≈</span>
        <span className="text-[32px] font-bold leading-tight tracking-tight tabular-nums text-text">
          {isTwdToForeign
            ? `${formatNum(amountResult)} ${currencyCode}`
            : `${formatNum(amountResult)} TWD`}
        </span>
        <span className="text-2xs text-text-muted">（台銀現金賣出）</span>
      </div>

      {answerData && (
        <ul className="mt-3 space-y-2 border-t border-border/40 pt-3 text-xs leading-relaxed text-text-muted">
          {!isTwdToForeign && answerData.cashBuyEstimate !== null && (
            <li>
              把 {formatNum(amount)} {currencyCode} 換回台幣 ≈{' '}
              <strong className="font-semibold tabular-nums text-text">
                {formatNum(Math.round(amount * answerData.cashBuyEstimate))} TWD
              </strong>
              （台銀現金買入估算）
            </li>
          )}
          <li>
            Google／XE 中間價換算 ≈{' '}
            {isTwdToForeign
              ? `${formatNum(Math.round((amount / answerData.marketMid) * 100) / 100)} ${currencyCode}`
              : `${formatNum(Math.round(amount * answerData.marketMid))} TWD`}
            ——中間價是批發參考價，一般人換不到
          </li>
        </ul>
      )}

      <p className="mt-3 text-2xs leading-relaxed text-text-muted">
        資料來源：臺灣銀行牌告（現金賣出 1 {currencyCode} = {cashSell}{' '}
        TWD），頁面嵌入價每日更新；即時價請用換算器查看。
      </p>

      <Link
        to={converterHref}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-control bg-primary-strong px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        在換算器查看最新匯率
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
