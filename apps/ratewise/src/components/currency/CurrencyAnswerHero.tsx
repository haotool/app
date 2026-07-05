/**
 * Answer Hero（六段 IA 第 1 段）：頁面身分＋更新時間＋快速答案＋換算 CTA。
 * 純呈現層：所有文案由 props 傳入，本檔不新增敘述性文字。
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { FAQEntry } from '../../config/seo-metadata';

export interface CurrencyAnswerHeroProps {
  flag: string;
  heading: string;
  description: string;
  updatedDate: string;
  quickAnswers: FAQEntry[];
  ctaTitle: string;
  ctaLead: string;
  ctaLabel: string;
  ctaTo: string;
  /** 金額頁換算結果卡插槽（answer-first：緊接頁面身分之後）。 */
  children?: ReactNode;
}

export function CurrencyAnswerHero({
  flag,
  heading,
  description,
  updatedDate,
  quickAnswers,
  ctaTitle,
  ctaLead,
  ctaLabel,
  ctaTo,
  children,
}: CurrencyAnswerHeroProps) {
  return (
    <section className="rounded-card border border-border/60 bg-surface p-5 shadow-card sm:p-6">
      <header className="flex items-start gap-3 sm:gap-4">
        <span className="text-4xl leading-none sm:text-5xl">{flag}</span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-text sm:text-[28px]">
            {heading}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted sm:text-base">{description}</p>
        </div>
      </header>

      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-2xs font-medium text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        最後更新：
        <time dateTime={updatedDate} className="tabular-nums">
          {updatedDate}
        </time>
      </p>

      {children}

      {quickAnswers.length > 0 && (
        <div className="mt-4 rounded-panel border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary">快速答案</h2>
          <div className="mt-3 space-y-3">
            {quickAnswers.map((item) => (
              <div
                key={item.question}
                className="border-t border-border/40 pt-3 first:border-t-0 first:pt-0"
              >
                <h3 className="text-xs font-medium text-text-muted">{item.question}</h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-text sm:text-base">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-border/60 pt-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          {ctaTitle}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{ctaLead}</p>
        <Link
          to={ctaTo}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-primary-strong px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
