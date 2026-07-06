import { Zap } from 'lucide-react';
import type { FAQEntry } from '../config/seo-metadata';

interface AnswerCapsuleProps {
  title?: string;
  items: FAQEntry[];
}

/** AEO/GEO 快速答案卡：answer-first 首屏摘要，樣式走 E1 token（wave-D 收斂）。 */
export function AnswerCapsule({ title = '快速答案', items }: AnswerCapsuleProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-6 rounded-card border border-primary/20 bg-primary/5 p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-xl font-bold leading-tight text-text">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-icon bg-primary/10 text-primary-on-surface">
          <Zap className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article
            key={item.question}
            className="rounded-panel border border-border/60 bg-surface p-4"
          >
            <h3 className="text-base font-semibold text-text">{item.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
