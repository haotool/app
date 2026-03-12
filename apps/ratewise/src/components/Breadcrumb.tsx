/**
 * Breadcrumb - 麵包屑導航組件（僅 UI）
 * Schema 由 SEOHelmet 統一管理
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="麵包屑導航" className={`mb-4 ${className}`}>
      <ol className="flex items-center gap-2 text-sm text-text-muted flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const itemKey = `${item.href}::${item.label}`;

          return (
            <li key={itemKey} className="flex items-center gap-2">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight
                  className="w-4 h-4 text-text-muted flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb Item */}
              {isLast ? (
                // Current Page - Not a link
                <span className="font-medium text-text" aria-current="page" title={item.label}>
                  {item.label}
                </span>
              ) : (
                // Parent Pages - Links
                <Link
                  to={item.href}
                  title={item.label}
                  className="hover:text-primary transition-colors duration-200 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
