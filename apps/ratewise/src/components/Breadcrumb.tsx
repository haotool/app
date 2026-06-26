/**
 * Breadcrumb - 麵包屑導航組件（僅 UI）
 * Schema 由 SEOHelmet 統一管理
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { breadcrumbTokens } from '../config/design-tokens';
import { cn } from '../utils/classnames';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <nav aria-label={t('nav.breadcrumb')} className={cn(breadcrumbTokens.nav, className)}>
      <ol className={breadcrumbTokens.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const itemKey = `${item.href}::${item.label}`;

          return (
            <li key={itemKey} className={breadcrumbTokens.item}>
              {/* Separator */}
              {index > 0 && (
                <ChevronRight className={breadcrumbTokens.separatorIcon} aria-hidden="true" />
              )}

              {/* Breadcrumb Item */}
              {isLast ? (
                // Current Page - Not a link
                <span className={breadcrumbTokens.current} aria-current="page" title={item.label}>
                  {item.label}
                </span>
              ) : (
                // Parent Pages - Links
                <Link to={item.href} title={item.label} className={breadcrumbTokens.link}>
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
