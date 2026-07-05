/**
 * 在地情境卡片組（六段 IA 第 4 段）：匯率重點卡＋旅遊提示卡。
 * persona 文案由 props 傳入；icon 點綴取代舊牆文條列。
 */

import { BookOpen, Lightbulb } from 'lucide-react';
import { CurrencySectionHeading } from './CurrencySectionHeading';

export interface LocalInsightsSectionProps {
  currencyName: string;
  highlights: string[];
  travelTip?: string | undefined;
}

export function LocalInsightsSection({
  currencyName,
  highlights,
  travelTip,
}: LocalInsightsSectionProps) {
  return (
    <section>
      <CurrencySectionHeading icon={BookOpen}>{currencyName}匯率重點</CurrencySectionHeading>
      <div className="grid gap-3 md:grid-cols-3">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-card border border-border/60 bg-surface p-4 shadow-card"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary">
              {index + 1}
            </span>
            <p className="min-w-0 text-sm leading-relaxed text-text">{highlight}</p>
          </div>
        ))}
      </div>

      {travelTip && (
        <div className="mt-3 flex items-start gap-3 rounded-card border border-warning/20 bg-warning/10 p-4 shadow-card sm:p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-warning/15 text-warning">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text sm:text-base">旅遊換匯小提示</h3>
            <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">{travelTip}</p>
          </div>
        </div>
      )}
    </section>
  );
}
