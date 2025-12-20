/**
 * Breadcrumb Component with BreadcrumbList Schema
 *
 * 依據：
 * - [Schema.org] BreadcrumbList 結構化數據規範
 *   https://schema.org/BreadcrumbList
 * - [Google Search Central] 麵包屑導航最佳實踐
 *   https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 * - [WCAG 2.1] 無障礙導航要求
 *   https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * 功能：
 * - 視覺化麵包屑導航（響應式）
 * - BreadcrumbList JSON-LD 結構化數據
 * - 完整無障礙支持 (a11y)
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 3 GREEN
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://app.haotool.org/ratewise/';
const SITE_BASE_URL = SITE_URL.replace(/\/+$/, '') + '/'; // 確保尾斜線

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * 生成 BreadcrumbList JSON-LD Schema
 *
 * @param items - 麵包屑項目
 * @returns JSON-LD 物件
 */
function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      // 轉換相對路徑為絕對 URL
      const absoluteUrl =
        item.href === '/'
          ? SITE_BASE_URL
          : `${SITE_BASE_URL}${item.href.replace(/^\//, '').replace(/\/+$/, '')}/`;

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: absoluteUrl,
      };
    }),
  };
}

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
  // 空陣列或單項目不渲染麵包屑
  if (items.length === 0) {
    return null;
  }

  const schema = generateBreadcrumbSchema(items);

  return (
    <>
      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Visual Breadcrumb Navigation */}
      <nav aria-label="麵包屑導航" className={`mb-4 ${className}`}>
        <ol className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={`${item.href}-${index}`} className="flex items-center gap-2">
                {/* Separator */}
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                )}

                {/* Breadcrumb Item */}
                {isLast ? (
                  // Current Page - Not a link
                  <span className="font-medium text-slate-900" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  // Parent Pages - Links
                  <Link
                    to={item.href}
                    className="hover:text-indigo-600 transition-colors duration-200 hover:underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export default Breadcrumb;
