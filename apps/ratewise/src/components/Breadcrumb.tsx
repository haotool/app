/**
 * Breadcrumb Component - Navigation Breadcrumbs with Structured Data
 *
 * @description Visual breadcrumb navigation with client-side JSON-LD schema generation
 *
 * @features
 * - Responsive breadcrumb navigation
 * - Full accessibility support (WCAG 2.1)
 * - Client-side BreadcrumbList schema generation
 * - Design token integration for consistent styling
 *
 * @accessibility
 * - ARIA breadcrumb pattern implementation
 * - Keyboard navigation support
 * - Screen reader optimized
 *
 * @seo
 * - Structured data (BreadcrumbList JSON-LD)
 * - Google Evergreen Googlebot compatible
 *
 * @architecture-decision
 * - Ideal: SEOHelmet manages all schemas (follows SRP)
 * - Reality: react-helmet-async doesn't support SSG static rendering
 * - Pragmatic: Breadcrumb component generates client-side schema
 *   - ✅ Google 2025 Evergreen Googlebot executes JavaScript
 *   - ✅ Ensures schema indexing
 *   - ⚠️  Violates SRP, but pragmatically viable
 * - Future: Migrate to SSG-friendly frameworks (Astro, Next.js)
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ - WCAG 2.1 Breadcrumb Pattern
 * @see https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics - Google JS SEO
 * @see docs/dev/005_design_token_refactoring.md - Design token migration
 *
 * @created 2025-12-20
 * @updated 2026-01-24
 * @version 2.0.0
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SITE_CONFIG, normalizePath } from '../config/seo-paths';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Helper: 將相對路徑轉換為絕對 URL
 *
 * 用途: BreadcrumbList Schema 要求所有 URL 必須是絕對路徑
 * 依據: [Schema.org BreadcrumbList](https://schema.org/BreadcrumbList)
 *
 * @example
 * buildAbsoluteUrl('/') → 'https://app.haotool.org/ratewise'
 * buildAbsoluteUrl('/faq/') → 'https://app.haotool.org/ratewise/faq/'
 */
const buildAbsoluteUrl = (href: string): string => {
  // 已經是絕對路徑，直接返回
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  // 標準化路徑（確保以 / 開頭結尾）
  const normalized = normalizePath(href.startsWith('/') ? href : `/${href}`);

  // 根路徑特殊處理
  if (normalized === '/') {
    return SITE_CONFIG.url;
  }

  // 組合完整 URL
  return `${SITE_CONFIG.url}${normalized.replace(/^\//, '')}`;
};

/**
 * Breadcrumb 導航組件
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: '首頁', href: '/' },
 *     { label: 'FAQ', href: '/faq/' },
 *     { label: '當前頁', href: '/faq/currency/' }
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  // 空陣列不渲染麵包屑
  if (items.length === 0) {
    return null;
  }

  // 生成 BreadcrumbList Schema（客戶端注入）
  // 只有 2+ 項目才生成 Schema（單項目無導航意義）
  const shouldRenderSchema = items.length >= 2;
  const breadcrumbSchema = shouldRenderSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          item: buildAbsoluteUrl(item.href),
        })),
      }
    : null;

  return (
    <>
      <nav aria-label="麵包屑導航" className={`mb-4 ${className}`}>
        <ol className="flex items-center gap-2 text-sm text-neutral-text-secondary flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={`${item.href}-${index}`} className="flex items-center gap-2">
                {/* Separator */}
                {index > 0 && (
                  <ChevronRight
                    className="w-4 h-4 text-neutral-text-muted flex-shrink-0"
                    aria-hidden="true"
                  />
                )}

                {/* Breadcrumb Item */}
                {isLast ? (
                  // Current Page - Not a link
                  <span className="font-medium text-neutral-text" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  // Parent Pages - Links
                  <Link
                    to={item.href}
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

      {/* BreadcrumbList JSON-LD Schema（客戶端注入）*/}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </>
  );
}

export default Breadcrumb;
