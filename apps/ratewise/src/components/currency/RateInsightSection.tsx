/**
 * 報價對比卡（六段 IA 第 2 段）：中間價 vs 賣出價雙卡＋匯差落地敘述。
 * 文案沿用既有 JSX 常數，僅重排樣式；semantic token 取代硬編 palette，確保各主題正確。
 */

import { Scale } from 'lucide-react';
import { APP_INFO } from '../../config/app-info';

export interface RateInsightSectionProps {
  currencyName: string;
  rateDifferenceSentence: string;
}

export function RateInsightSection({
  currencyName,
  rateDifferenceSentence,
}: RateInsightSectionProps) {
  return (
    <section className="rounded-card border border-border/60 bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-warning/15 text-warning">
          <Scale className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-snug text-text">
            為什麼 {APP_INFO.shortName} 比其他工具更精準？
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            多數匯率工具顯示「中間價」（mid-rate），是買入與賣出的平均值，不是你實際換匯的價格。
            {APP_INFO.shortName} 直接顯示臺灣銀行牌告的「
            <strong className="font-semibold text-text">
              現金賣出
            </strong>」價格，也就是你去銀行換 {currencyName} 現鈔時實際要付的台幣金額。
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-panel border border-destructive/20 bg-destructive/5 p-3 text-center">
          <div className="text-xs font-bold text-destructive">中間價（Google／XE）</div>
          <div className="mt-1 text-xs leading-relaxed text-text-muted">買入與賣出的平均值</div>
          <div className="mt-0.5 text-xs leading-relaxed text-text-muted">≠ 實際換匯金額</div>
        </div>
        <div className="rounded-panel border border-success/20 bg-success/10 p-3 text-center">
          <div className="text-xs font-bold text-success">賣出價（{APP_INFO.shortName}）</div>
          <div className="mt-1 text-xs leading-relaxed text-text-muted">臺灣銀行牌告實際報價</div>
          <div className="mt-0.5 text-xs leading-relaxed text-text-muted">= 銀行實際收你的台幣</div>
        </div>
      </div>

      <p className="mt-3 rounded-panel bg-surface-sunken px-3 py-2.5 text-xs leading-relaxed text-text-muted">
        {rateDifferenceSentence}
      </p>
    </section>
  );
}
