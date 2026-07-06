/**
 * 四報價卡（六段 IA 第 2 段，#618 E5 wave-C）：現金買/賣＋即期買/賣 2×2 卡片網格。
 * 數值一律來自 SEO_RATE_EXAMPLES（SSOT，每日自動更新）；台銀無即期報價的幣別
 * 誠實顯示不可用態，不推估、不留空。韓系扁平：E1 token、hairline、無漸層。
 */

import { Landmark } from 'lucide-react';
import { CurrencySectionHeading } from './CurrencySectionHeading';
import type { RateExample } from '../../config/generated/seo-rate-examples';

export interface QuoteMatrixSectionProps {
  currencyCode: string;
  currencyName: string;
  rateExample: RateExample;
}

interface QuoteCell {
  key: string;
  label: string;
  hint: string;
  value: number | null;
}

/** 牌告匯率顯示：沿用來源原始精度，避免小數幣別（KRW/VND/IDR）被截斷。 */
function formatBoardRate(value: number): string {
  return value.toLocaleString('zh-TW', { maximumFractionDigits: 6 });
}

export function QuoteMatrixSection({
  currencyCode,
  currencyName,
  rateExample,
}: QuoteMatrixSectionProps) {
  const quotes: QuoteCell[] = [
    {
      key: 'cash-buy',
      label: '現金買入',
      hint: '你把外幣現鈔換回台幣',
      value: rateExample.cashBuy,
    },
    {
      key: 'cash-sell',
      label: '現金賣出',
      hint: '你用台幣買外幣現鈔',
      value: rateExample.cashSell,
    },
    {
      key: 'spot-buy',
      label: '即期買入',
      hint: '外幣帳戶存款換回台幣',
      value: rateExample.spotBuy,
    },
    {
      key: 'spot-sell',
      label: '即期賣出',
      hint: '台幣換入外幣帳戶存款',
      value: rateExample.spotSell,
    },
  ];

  const spotUnavailable = rateExample.spotBuy === null && rateExample.spotSell === null;

  return (
    <section
      className="rounded-card border border-border/60 bg-surface p-5 shadow-card"
      data-testid="quote-matrix-section"
    >
      <CurrencySectionHeading icon={Landmark}>
        臺灣銀行{currencyName}四種牌告報價
      </CurrencySectionHeading>
      <p className="text-sm leading-relaxed text-text-muted">
        牌告匯率為 1 {currencyCode} 兌換台幣（TWD）的價格；「買入／賣出」皆為銀行視角，
        現鈔換匯看現金報價，外幣帳戶轉帳看即期報價。
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {quotes.map((quote) => (
          <div
            key={quote.key}
            data-testid={`quote-cell-${quote.key}`}
            className="rounded-panel border border-border/60 bg-surface-sunken p-3"
          >
            <div className="text-xs font-semibold text-text-muted">{quote.label}</div>
            {quote.value !== null ? (
              <>
                <div className="mt-1 text-lg font-bold leading-tight tabular-nums text-text">
                  {formatBoardRate(quote.value)}
                </div>
                <div className="mt-0.5 text-2xs leading-relaxed text-text-muted">{quote.hint}</div>
              </>
            ) : (
              <>
                <div
                  className="mt-1 text-lg font-bold leading-tight text-text-muted"
                  aria-hidden="true"
                >
                  —
                </div>
                <div className="mt-0.5 text-2xs leading-relaxed text-text-muted">臺銀無此報價</div>
              </>
            )}
          </div>
        ))}
      </div>

      {spotUnavailable && (
        <p className="mt-3 rounded-panel bg-surface-sunken px-3 py-2.5 text-xs leading-relaxed text-text-muted">
          臺灣銀行對{currencyName}未提供即期報價，換匯以現金匯率為準。
        </p>
      )}
    </section>
  );
}
