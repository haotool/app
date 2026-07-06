/**
 * 相關連結（六段 IA 第 6 段）：hub-and-spoke 內部鏈接，Toss 列表式連結卡。
 */

import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { RelatedGuideLink } from '../../config/seo-metadata';
import { CurrencySectionHeading } from './CurrencySectionHeading';

export interface RelatedGuidesSectionProps {
  relatedGuides: RelatedGuideLink[];
}

export function RelatedGuidesSection({ relatedGuides }: RelatedGuidesSectionProps) {
  return (
    // #594 二階：≥1024px 佔滿兩欄寬版；<1024px 佈局零變化。
    <section className="lg:col-span-2">
      <CurrencySectionHeading icon={BookOpen}>相關攻略</CurrencySectionHeading>
      <div className="rounded-card border border-border/60 bg-surface shadow-card">
        <div className="divide-y divide-border/40">
          {relatedGuides.map((guide) => (
            <Link
              key={guide.href}
              to={guide.href}
              className="group flex min-h-11 items-center justify-between gap-3 p-4 transition-colors hover:bg-primary/5 sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text transition-colors group-hover:text-primary-on-surface sm:text-base">
                  {guide.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted sm:text-sm">
                  {guide.description}
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-text-muted opacity-60 transition-colors group-hover:text-primary-on-surface"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
