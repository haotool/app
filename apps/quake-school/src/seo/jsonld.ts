/**
 * JSON-LD Structured Data Configuration
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 *
 * 根據 vite-react-ssg 官方最佳實踐，JSON-LD 應該在 onPageRendered hook 中注入
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { SITE_CONFIG } from '../config/seo-paths';

const ASSET_VERSION = 'v=20251229';

const SOCIAL_LINKS = ['https://github.com/haotool/app', 'https://haotool.org'];

const withAssetVersion = (url: string) =>
  url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;

const buildAssetUrl = (value: string) => {
  const absolute = value.startsWith('http')
    ? value
    : `${SITE_CONFIG.url}${value.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
};

/**
 * 基礎 JSON-LD 結構化數據 (適用於所有頁面)
 */
export const BASE_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.name,
    alternateName: '地震防災教室',
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: ['地震知識教育', '防災準備指南', '避難路線規劃', '即時地震資訊', 'PWA 離線支援'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'haotool',
    url: 'https://haotool.org',
    logo: buildAssetUrl('icons/icon-512x512.png'),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'haotool.org@gmail.com',
    },
    sameAs: SOCIAL_LINKS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    inLanguage: 'zh-TW',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

/**
 * Breadcrumb schema builder
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http')
        ? item.url
        : `${SITE_CONFIG.url}${item.url.replace(/^\//, '')}`,
    })),
  };
}

/**
 * FAQ schema builder
 */
export interface FAQEntry {
  question: string;
  answer: string;
}

export function buildFaqSchema(faq: FAQEntry[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    url,
  };
}

/**
 * ImageObject schema builder
 */
export function buildImageObjectSchema(imagePath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: buildAssetUrl(imagePath),
    width: 1200,
    height: 630,
    caption: SITE_CONFIG.name,
    inLanguage: 'zh-TW',
  };
}

/**
 * FAQ 資料
 */
const FAQ_DATA: FAQEntry[] = [
  {
    question: '什麼是地震？',
    answer:
      '地震是地球內部板塊運動或斷層活動所引起的地表震動。台灣位於環太平洋地震帶，地震頻繁，了解地震知識對防災至關重要。',
  },
  {
    question: '地震發生時該如何反應？',
    answer:
      '記住「趴下、掩護、穩住」三步驟：趴下降低重心、找堅固掩體保護頭部、穩住身體等待震動結束。不要慌張奔跑或使用電梯。',
  },
  {
    question: '家庭防災包應該準備什麼？',
    answer:
      '建議準備：飲用水（每人每天3公升）、乾糧、手電筒、電池、急救包、重要證件影本、現金、保暖衣物、哨子、收音機等物品。',
  },
  {
    question: '這個應用可以離線使用嗎？',
    answer:
      '可以！Quake-School 支援 PWA 技術，首次訪問後可將網頁加入主畫面，之後即可離線瀏覽防災知識和避難指南。',
  },
];

/**
 * 根據路由生成完整的 JSON-LD 數據
 */
export function getJsonLdForRoute(route: string, _buildTime: string): Record<string, unknown>[] {
  const normalizedRoute = route.replace(/\/$/, '') || '/';
  const fullUrl = `${SITE_CONFIG.url}${normalizedRoute.replace(/^\//, '')}`;

  const jsonLd: Record<string, unknown>[] = [...BASE_JSON_LD];

  switch (normalizedRoute) {
    case '/':
    case '':
      jsonLd.push(
        buildBreadcrumbSchema([{ name: '首頁', url: SITE_CONFIG.url }]),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/about':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_CONFIG.url },
          { name: '關於', url: `${SITE_CONFIG.url}about/` },
        ]),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/guide':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_CONFIG.url },
          { name: '防災指南', url: `${SITE_CONFIG.url}guide/` },
        ]),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/faq':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_CONFIG.url },
          { name: '常見問題', url: `${SITE_CONFIG.url}faq/` },
        ]),
        buildFaqSchema(FAQ_DATA, fullUrl),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    default:
      jsonLd.push(
        buildBreadcrumbSchema([{ name: '首頁', url: SITE_CONFIG.url }]),
        buildImageObjectSchema('og-image.png'),
      );
  }

  return jsonLd;
}

/**
 * 將 JSON-LD 數據轉換為 HTML script 標籤
 */
export function jsonLdToScriptTags(jsonLd: Record<string, unknown>[]): string {
  return jsonLd
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n');
}
