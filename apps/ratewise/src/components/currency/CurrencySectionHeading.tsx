/** 幣別頁 section 標題列：icon 徽章＋粗體標題（韓系扁平，取代舊 uppercase 微字標）。 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface CurrencySectionHeadingProps {
  icon: LucideIcon;
  children: ReactNode;
}

export function CurrencySectionHeading({ icon: Icon, children }: CurrencySectionHeadingProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-icon bg-primary/10 text-primary-on-surface">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold leading-tight text-text">{children}</h2>
    </div>
  );
}
