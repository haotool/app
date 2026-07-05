/** 使用步驟卡（保留內容層 HowTo 文案，重排為編號卡片網格）。 */

import { ListOrdered } from 'lucide-react';
import type { HowToStep } from '../../config/seo-metadata';
import { CurrencySectionHeading } from './CurrencySectionHeading';

export interface HowToStepsSectionProps {
  howToSteps: HowToStep[];
}

export function HowToStepsSection({ howToSteps }: HowToStepsSectionProps) {
  return (
    <section>
      <CurrencySectionHeading icon={ListOrdered}>使用步驟</CurrencySectionHeading>
      <div className="grid gap-3 md:grid-cols-2">
        {howToSteps.map((step) => (
          <div
            key={step.position}
            className="flex items-start gap-3 rounded-card border border-border/60 bg-surface p-4 shadow-card sm:p-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-icon bg-primary/10 text-base font-bold tabular-nums text-primary">
              {step.position}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text sm:text-base">{step.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
