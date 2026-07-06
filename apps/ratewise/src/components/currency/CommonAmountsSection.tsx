/**
 * 常見金額互鏈（六段 IA 第 3 段）：Toss 列表式金額頁入口。
 * Wise-pattern：路徑型 URL 可被 SSG 預渲染，Googlebot 直接索引靜態 HTML。
 */

import { Link } from 'react-router-dom';
import { Calculator, ChevronRight } from 'lucide-react';
import type { CommonAmountEntry } from '../../config/seo-metadata';
import { CurrencySectionHeading } from './CurrencySectionHeading';

export interface CommonAmountsSectionProps {
  commonAmounts: CommonAmountEntry[];
  pathname: string;
}

export function CommonAmountsSection({ commonAmounts, pathname }: CommonAmountsSectionProps) {
  const basePath = pathname.replace(/\/$/, '');

  return (
    <section>
      <CurrencySectionHeading icon={Calculator}>常見金額換算</CurrencySectionHeading>
      <div className="rounded-card border border-border/60 bg-surface p-4 shadow-card sm:p-5">
        <p className="text-xs leading-relaxed text-text-muted sm:text-sm">
          點擊常見金額，即可在本頁查看台銀現金賣出參考換算結果，或前往換算器取得最新即時匯率：
        </p>
        <div className="mt-3 divide-y divide-border/40">
          {commonAmounts.map((entry) => (
            <Link
              key={entry.amount}
              to={`${basePath}/${entry.amount}/`}
              className="group flex min-h-11 items-center justify-between gap-3 py-3 transition-colors hover:bg-primary/5"
            >
              <h3 className="text-sm font-medium text-text transition-colors group-hover:text-primary-on-surface">
                {entry.question}
              </h3>
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
