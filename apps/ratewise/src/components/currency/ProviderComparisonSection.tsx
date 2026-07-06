/**
 * 換匯管道比較（在地情境卡片組）：台銀 vs 現場換匯所雙欄報價卡。
 * 僅有 alternativeProviders 的幣別（如 KRW）渲染；數值計算由 CurrencyLandingPage 傳入。
 */

import { Landmark } from 'lucide-react';
import type { AlternativeProvider, RateExample } from '../../config/generated/seo-rate-examples';
import { CurrencySectionHeading } from './CurrencySectionHeading';

export interface ProviderComparisonSectionProps {
  isTwdToForeign: boolean;
  taiwanBankKrwPerTwd: number | null;
  rateExample: RateExample | undefined;
  alternativeProviders: AlternativeProvider[];
}

export function ProviderComparisonSection({
  isTwdToForeign,
  taiwanBankKrwPerTwd,
  rateExample,
  alternativeProviders,
}: ProviderComparisonSectionProps) {
  return (
    // #594 二階：≥1024px 佔滿兩欄寬版；<1024px 佈局零變化。
    <section data-testid="provider-comparison-card" className="lg:col-span-2">
      <CurrencySectionHeading icon={Landmark}>換匯管道比較</CurrencySectionHeading>
      <div className="rounded-card border border-border/60 bg-surface p-4 shadow-card sm:p-5">
        <h3 className="text-sm font-bold text-text sm:text-base">台銀 vs 現場換匯所比較</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 臺灣銀行欄：TWD→KRW 顯示現金賣出；KRW→TWD 顯示估算買入率 */}
          <div className="rounded-panel border border-border/60 bg-surface-elevated p-3">
            <div className="text-xs font-bold text-text-muted">
              {isTwdToForeign ? '臺灣銀行（現金賣出）' : '臺灣銀行（現金買入估算）'}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-text">
              {taiwanBankKrwPerTwd !== null ? taiwanBankKrwPerTwd.toFixed(2) : '—'}{' '}
              <span className="text-xs font-normal text-text-muted">KRW / TWD</span>
            </div>
            <div className="mt-1 text-xs tabular-nums text-text-muted">
              {isTwdToForeign
                ? `${rateExample?.exampleTWD.toLocaleString()} TWD ≈ ${rateExample?.foreignAtCash.toLocaleString()} KRW`
                : '估算值；以台銀牌告現金買入率為準'}
            </div>
          </div>
          {/* 替代換匯管道欄 */}
          {alternativeProviders.map((provider) => {
            // TWD→KRW: 使用 sell 率（provider.rate），KRW→TWD: 使用 buy 率（provider.rateBuy）
            // 兩者單位均為 KRW/TWD（46.0 = 1 TWD 換 46 KRW；46.7 = 需 46.7 KRW 換 1 TWD）
            const displayRate = isTwdToForeign
              ? provider.rate
              : (provider.rateBuy ?? provider.rate);
            const rateLabel = 'KRW / TWD';
            const exampleAmount = rateExample
              ? isTwdToForeign
                ? Math.floor(rateExample.exampleTWD * displayRate)
                : null // KRW→TWD 方向不顯示台幣換算範例
              : null;
            return (
              <div
                key={provider.source}
                className="rounded-panel border border-success/20 bg-success/10 p-3"
                data-testid="provider-rate-cell"
              >
                <div className="text-xs font-bold text-success">{provider.name}</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-success">
                  {displayRate.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-text-muted">{rateLabel}</span>
                </div>
                {exampleAmount !== null && rateExample && (
                  <div className="mt-1 text-xs tabular-nums text-text-muted">
                    {rateExample.exampleTWD.toLocaleString()} TWD ≈ {exampleAmount.toLocaleString()}{' '}
                    KRW
                  </div>
                )}
                <div className="mt-2 text-2xs text-text-muted">
                  {provider.source} · {provider.rateDate}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-2xs leading-relaxed text-text-muted">
          {isTwdToForeign
            ? alternativeProviders[0]?.note
            : `${alternativeProviders[0]?.name ?? '明洞換匯所'}亦提供韓元換台幣服務，現場持韓元現鈔可直接兌換。買入估算匯率，實際以換匯所現場報價為準。`}
        </p>
      </div>
    </section>
  );
}
