/**
 * Meta Tags Configuration for SSG
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { SITE_CONFIG, normalizePath } from '../config/seo-paths';

const ASSET_VERSION = 'v=20251229';

interface PageMeta {
  title: string;
  description: string;
  keywords: string[];
  ogType: 'website' | 'article';
}

/**
 * 頁面 Meta 數據配置
 */
const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    keywords: ['地震', '防災', '台灣', '避難', '安全', 'PWA'],
    ogType: 'website',
  },
  '/about/': {
    title: '關於 Quake-School | 地震防災教室',
    description:
      '了解 Quake-School 的使命：提供台灣民眾最完整的地震防災教育資源，從地震知識到避難準備，守護每個家庭的安全。',
    keywords: ['關於', '地震防災', '教育', '台灣', 'haotool'],
    ogType: 'website',
  },
  '/faq/': {
    title: '常見問題 FAQ | Quake-School 地震防災教室',
    description:
      '地震防災常見問題解答：地震發生時該如何反應？家庭防災包要準備什麼？離線使用說明等。',
    keywords: ['FAQ', '常見問題', '地震', '防災', '避難'],
    ogType: 'website',
  },
  '/guide/': {
    title: '防災指南 | Quake-School 地震防災教室',
    description:
      '完整的地震防災指南：事前準備、緊急應變、事後處理，一步步教你保護自己和家人的安全。',
    keywords: ['防災指南', '地震', '避難', '準備', '安全'],
    ogType: 'article',
  },
};

/**
 * 獲取頁面 Meta 數據
 */
function getPageMeta(route: string): PageMeta {
  const normalized = normalizePath(route);
  return (
    PAGE_META[normalized] ?? {
      title: SITE_CONFIG.title,
      description: SITE_CONFIG.description,
      keywords: ['地震', '防災', '台灣'],
      ogType: 'website' as const,
    }
  );
}

/**
 * 生成頁面的 Meta Tags HTML
 */
export function getMetaTagsForRoute(route: string, _buildTime: string): string {
  const meta = getPageMeta(route);
  const normalized = normalizePath(route);
  const canonicalUrl =
    normalized === '/' ? SITE_CONFIG.url : `${SITE_CONFIG.url}${normalized.replace(/^\//, '')}`;
  const ogImageUrl = `${SITE_CONFIG.url}og-image.png?${ASSET_VERSION}`;

  const tags = [
    // Basic Meta
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.description}" />`,
    `<meta name="keywords" content="${meta.keywords.join(', ')}" />`,

    // Canonical
    `<link rel="canonical" href="${canonicalUrl}" />`,

    // Open Graph
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${meta.title}" />`,
    `<meta property="og:description" content="${meta.description}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${ogImageUrl}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="zh_TW" />`,
    `<meta property="og:site_name" content="${SITE_CONFIG.name}" />`,

    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${meta.title}" />`,
    `<meta name="twitter:description" content="${meta.description}" />`,
    `<meta name="twitter:image" content="${ogImageUrl}" />`,

    // Alternate languages (hreflang)
    `<link rel="alternate" hreflang="zh-TW" href="${canonicalUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`,

    // Additional SEO
    `<meta name="robots" content="index, follow" />`,
    `<meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />`,
    `<meta name="author" content="haotool" />`,
    `<meta name="generator" content="Vite React SSG" />`,
  ];

  return tags.join('\n    ');
}
