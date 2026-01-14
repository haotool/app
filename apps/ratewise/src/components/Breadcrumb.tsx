/**
 * Breadcrumb Component (UI + Client-Side Schema)
 *
 * 依據：
 * - [WCAG 2.1] 無障礙導航要求
 *   https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 * - [Google 2025] Evergreen Googlebot 執行 JavaScript
 *   https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
 *
 * 功能：
 * - 視覺化麵包屑導航（響應式）
 * - 完整無障礙支持 (a11y)
 * - **客戶端** BreadcrumbList Schema 生成
 *
 * 建立時間: 2025-12-20
 * 最後更新: 2025-12-23 (恢復 Schema 生成 - SSG 架構限制)
 * BDD 階段: Stage 3 GREEN
 *
 * **架構決策記錄**:
 * - **理想方案**: SEOHelmet 統一管理所有 Schema（符合 SRP）
 * - **現實限制**: react-helmet-async 不支援 SSG 靜態渲染
 * - **務實選擇**: Breadcrumb 組件生成客戶端 Schema
 *   - ✅ Google 2025 Evergreen Googlebot 會執行 JS
 *   - ✅ 確保 Schema 能被索引
 *   - ⚠️  違反 SRP，但務實可行
 * - **後續改進**: 遷移到支援 SSG 的框架（Astro, Next.js）
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
